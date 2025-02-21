import { MessageTypeEnum, messages } from '../constants/message.enum';
import { compare, hashSync } from 'bcryptjs';
import { isArray } from 'class-validator';
import { MessageDto } from '../modules/common/modules/shared/message.dto';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export class UtilsProvider {
  /**
   * convert entity to dto class instance
   * @param {{new(entity: E, options: any): T}} model
   * @param {E[] | E} entity
   * @param options
   * @returns {T[] | T}
   */
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E,
    options?: Record<string, any>,
  ): T;

  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E[],
    options?: Record<string, any>,
  ): T[];

  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E | E[],
    options?: Record<string, any>,
  ): T | T[] {
    if (Array.isArray(entity)) {
      return entity.map((u) => new model(u, options));
    }

    return new model(entity, options);
  }

  static getMessageOverviewByType(messageEnum: MessageTypeEnum): MessageDto {
    return {
      messageType: messageEnum,
      message: messages[messageEnum]
    }
  }

  static getFileName(text: string) {
    const regexFileName = /([\s\w().:\\\-])+(.png|.jpeg|.jpg)$/; // add extensions for photo
    const fileName = text.match(regexFileName);

    return fileName[0];
  }

  static generateHash(password: string): string {
    return hashSync(password, 10);
  }

  static isProduction(): boolean {
    return process.env.NODE_ENV === "production" ? true : false
  }

  static validateHash(password: string, hash: string): Promise<boolean> {
    // tmp solution
    // if (!password || !hash) {
    //   return Promise.resolve(false);
    // }

    // return compare(password, hash);
    return Promise.resolve(password === hash)
  }

  static findAndReplaceNotApplied(target: string) {
    return target === 'n/a' ? null : target
  }

  static extractSizeAndIadcCode(itemName: string): { size: number, iadcCode: string } | null {
    let size: number;

    const sizeMatch = itemName.match(/\(([^)]+)\)/);
    if (!sizeMatch) {
      console.log(`Didn't found any size for this item: ${itemName}`)
        size = 0; // Size not found
    } else {
      const sizeValue = sizeMatch[1];
      size = this.fractionToDecimal(sizeValue as string);
      
    }

    const linenameAndIadcCodeMatch = itemName.match(/[a-zA-Z]+(\d+)/);
    let iadcCode = '';
    if (!linenameAndIadcCodeMatch || linenameAndIadcCodeMatch[1].length < 3) {
      console.log(`Didn't found any line name for this item: ${itemName}`)
    } else {
      iadcCode = linenameAndIadcCodeMatch[1];
    }

    return {
      iadcCode,
      size
    };
  }


  static attachCountryCodeToPhoneNumber(phoneNumber: string, countryCode: string): string | null {
    if (!phoneNumber) {
      return null;
    }
    if (!phoneNumber.startsWith('+')) {
      return countryCode + phoneNumber;
    }
    return phoneNumber;
  }
  
  static findUpdatedFields<T>(obj1: T, obj2: T, ignoreKeys = []): T {
    function diff(obj1, obj2) {
      let updatedFields = {};
  
      for (let key in obj2) {
        if (obj2.hasOwnProperty(key)) {
          if (ignoreKeys.includes(key)) {
            continue;
          }
  
          if (!obj2[key] && !obj1[key]) {
            continue;
          }
  
          if (typeof obj2[key] === 'object' && obj2[key] !== null && typeof obj1[key] === 'object' && obj1[key] !== null) {
            let nestedDiff = diff(obj1[key], obj2[key]);
            if (Object.keys(nestedDiff).length > 0) {
              updatedFields[key] = nestedDiff;
            }
          } else if (obj2[key] !== obj1[key]) {
            updatedFields[key] = obj2[key];
          }
        }
      }
  
      return updatedFields;
    }
  
    return diff(obj1, obj2) as T;
  }
  
  static getDay() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;

    return formattedDate;
  }

  static fractionToDecimal(fractionStr: string): number {
    const [wholeNumber, fraction] = fractionStr.includes(' ') ? fractionStr.split(' ') : ['0', fractionStr];

    const [numerator, denominator] = fraction.split('/').map(Number);

    if (!denominator) {
      return numerator;
    }
    
    const decimalValue = Number(wholeNumber) + (numerator / denominator);

    return decimalValue;
}

  static separateCommasAndCreateAnArray(txt: string): string[] {
    let array = txt
    .split(',').map(el => el.trim());

    return array.filter(el => el);
  }

  static getRandomNum(): string {
    const random = Math.floor(Math.random() * 1000);

    return `${'0'.repeat(4 - random.toString().length)}${random}`;
  }

  static removeElemsFromObject(targetObject: Object, keys: string[]) {
    keys.forEach(key => {
      if (targetObject.hasOwnProperty(key)) {
        delete targetObject[key];
      }
    });

    return targetObject;
  }

  static isUUID(value: string | string[]): boolean {
    const uuidPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (!uuidPattern.test(item)) {
          return false;
        }
      }

      return true;
    }

    return uuidPattern.test(value);
  }

  static replaceDotsWithCommasAndSpacesWithPercent(text: string) {
    return text 
    ? text.replace(/,/g, ' ').replace(/ /g, '%').replace(/[()]/g, '') 
    : '';
  }

  static getIds(value) {
    let ids: string[] | undefined;

    if (value?.length) {
      ids = [];

      if (isArray(value)) {
        ids.push(...(value as string[]));
      } else {
        ids.push(...(JSON.parse(value as string)[0] as string[]));
      }
    }

    return ids;
  }

  static stringToArrayParser({ value }) {
    if (Array.isArray(value)) {
        return value;
    } else if (typeof value === 'string') {
        return [value];
    } else {
        throw new BadRequestException('Invalid data type');
    }
  }

  static generateUniqueIdOfMeeting() {
    const uniqueId = crypto.randomBytes(4).toString("hex"); // 8-character random string

    return uniqueId;
  }

  static replaceS3UriWithS3Key(s3Uri: string) {
    const s3Key = s3Uri.replace(`s3://seekers3data/`, '');

    return s3Key;
  }
}
