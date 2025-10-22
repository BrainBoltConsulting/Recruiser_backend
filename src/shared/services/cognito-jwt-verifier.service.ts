import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as https from 'https';
import { ApiConfigService } from './api-config.service';

interface JWK {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

interface JWKS {
  keys: JWK[];
}

interface CognitoTokenPayload {
  sub: string;
  'cognito:username'?: string;
  username?: string;
  email?: string;
  email_verified?: boolean;
  iss: string;
  token_use: string;
  client_id?: string;
  aud?: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

@Injectable()
export class CognitoJwtVerifier {
  private readonly logger = new Logger(CognitoJwtVerifier.name);
  private jwksCache: JWKS | null = null;
  private jwksCacheExpiry: number = 0;
  private readonly JWKS_CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the JWKS (JSON Web Key Set) from Cognito
   * Caches the result to avoid repeated requests
   */
  private async getJWKS(): Promise<JWKS> {
    // Return cached JWKS if still valid
    if (this.jwksCache && Date.now() < this.jwksCacheExpiry) {
      this.logger.debug('Using cached JWKS');
      return this.jwksCache;
    }

    const cognitoConfig = this.apiConfigService.cognitoConfig;
    const region = this.apiConfigService.awsConfig.region;
    const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/jwks.json`;

    this.logger.debug(`Fetching JWKS from: ${jwksUrl}`);

    return new Promise((resolve, reject) => {
      https
        .get(jwksUrl, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const jwks = JSON.parse(data) as JWKS;
              
              // Cache the JWKS
              this.jwksCache = jwks;
              this.jwksCacheExpiry = Date.now() + this.JWKS_CACHE_DURATION;
              
              this.logger.debug('JWKS fetched and cached successfully');
              resolve(jwks);
            } catch (error) {
              this.logger.error('Failed to parse JWKS', error);
              reject(new Error('Failed to parse JWKS'));
            }
          });
        })
        .on('error', (error) => {
          this.logger.error('Failed to fetch JWKS', error);
          reject(new Error(`Failed to fetch JWKS: ${error.message}`));
        });
    });
  }

  /**
   * Convert JWK to PEM format for signature verification
   */
  private jwkToPem(jwk: JWK): string {
    // Decode base64url encoded modulus and exponent
    const modulus = this.base64urlToBuffer(jwk.n);
    const exponent = this.base64urlToBuffer(jwk.e);

    // Build the RSA public key in ASN.1 DER format
    const modulusEncoded = this.encodeInteger(modulus);
    const exponentEncoded = this.encodeInteger(exponent);
    
    // Build SEQUENCE of modulus and exponent
    const sequencePayload = Buffer.concat([modulusEncoded, exponentEncoded]);
    const sequence = this.encodeSequence(sequencePayload);
    
    // Build BIT STRING
    const bitString = this.encodeBitString(sequence);
    
    // Algorithm identifier for RSA encryption
    const algorithmIdentifier = Buffer.from(
      '300d06092a864886f70d0101010500',
      'hex'
    );
    
    // Build outer SEQUENCE
    const publicKeyPayload = Buffer.concat([algorithmIdentifier, bitString]);
    const publicKey = this.encodeSequence(publicKeyPayload);
    
    // Convert to PEM format
    const base64 = publicKey.toString('base64');
    const pem = 
      '-----BEGIN PUBLIC KEY-----\n' +
      base64.match(/.{1,64}/g)?.join('\n') +
      '\n-----END PUBLIC KEY-----\n';
    
    return pem;
  }

  /**
   * Convert base64url to Buffer
   */
  private base64urlToBuffer(base64url: string): Buffer {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if necessary
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64');
  }

  /**
   * Encode an integer in ASN.1 DER format
   */
  private encodeInteger(buffer: Buffer): Buffer {
    // If the high bit is set, prepend a 0x00 byte
    let payload = buffer;
    if (buffer[0] & 0x80) {
      payload = Buffer.concat([Buffer.from([0x00]), buffer]);
    }
    
    return Buffer.concat([
      Buffer.from([0x02]), // INTEGER tag
      this.encodeLength(payload.length),
      payload
    ]);
  }

  /**
   * Encode a sequence in ASN.1 DER format
   */
  private encodeSequence(buffer: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from([0x30]), // SEQUENCE tag
      this.encodeLength(buffer.length),
      buffer
    ]);
  }

  /**
   * Encode a bit string in ASN.1 DER format
   */
  private encodeBitString(buffer: Buffer): Buffer {
    const payload = Buffer.concat([Buffer.from([0x00]), buffer]); // 0x00 = no unused bits
    return Buffer.concat([
      Buffer.from([0x03]), // BIT STRING tag
      this.encodeLength(payload.length),
      payload
    ]);
  }

  /**
   * Encode length for ASN.1 DER format
   */
  private encodeLength(length: number): Buffer {
    if (length < 128) {
      return Buffer.from([length]);
    }
    
    const lengthBytes: number[] = [];
    let temp = length;
    while (temp > 0) {
      lengthBytes.unshift(temp & 0xff);
      temp >>= 8;
    }
    
    return Buffer.from([0x80 | lengthBytes.length, ...lengthBytes]);
  }

  /**
   * Verify a Cognito JWT token
   * @param token - The JWT token to verify
   * @returns The decoded token payload
   * @throws Error if token is invalid
   */
  async verify(token: string): Promise<CognitoTokenPayload> {
    try {
      // Decode token header to get the key ID (kid)
      const decodedHeader = jwt.decode(token, { complete: true });
      
      if (!decodedHeader || typeof decodedHeader === 'string') {
        throw new Error('Invalid token format');
      }

      const kid = decodedHeader.header.kid;
      if (!kid) {
        throw new Error('Token does not have a key ID');
      }

      // Get JWKS and find the matching key
      const jwks = await this.getJWKS();
      const jwk = jwks.keys.find((key) => key.kid === kid);

      if (!jwk) {
        throw new Error(`No matching key found for kid: ${kid}`);
      }

      // Convert JWK to PEM
      const pem = this.jwkToPem(jwk);

      // Verify the token
      const cognitoConfig = this.apiConfigService.cognitoConfig;
      const region = this.apiConfigService.awsConfig.region;
      const issuer = `https://cognito-idp.${region}.amazonaws.com/${cognitoConfig.userPoolId}`;

      const decoded = jwt.verify(token, pem, {
        algorithms: ['RS256'],
        issuer: issuer,
      }) as CognitoTokenPayload;

      // Additional validations
      if (decoded.token_use !== 'id' && decoded.token_use !== 'access') {
        throw new Error(`Invalid token_use: ${decoded.token_use}`);
      }

      // Verify client_id or aud matches
      if (decoded.client_id && decoded.client_id !== cognitoConfig.clientId) {
        throw new Error('Token client_id does not match');
      }

      if (decoded.aud && decoded.aud !== cognitoConfig.clientId) {
        throw new Error('Token audience does not match');
      }

      this.logger.debug(`Token verified successfully for user: ${decoded.sub}`);
      return decoded;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear the JWKS cache (useful for testing or when keys are rotated)
   */
  clearCache(): void {
    this.jwksCache = null;
    this.jwksCacheExpiry = 0;
    this.logger.debug('JWKS cache cleared');
  }
}

