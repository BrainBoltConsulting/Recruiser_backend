import { UsersEntity } from './../entities/Users';
import requestContext from 'request-context';


export class ContextProvider {
  private static readonly nameSpace = 'request';

  private static authUserKey = 'user_key';

  private static get<T>(key: string): T {
    return requestContext.get(ContextProvider.getKeyWithNamespace(key));
  }

  private static set(key: string, value: any): void {
    requestContext.set(ContextProvider.getKeyWithNamespace(key), value);
  }

  private static getKeyWithNamespace(key: string): string {
    return `${ContextProvider.nameSpace}.${key}`;
  }

  static setAuthUser(user: UsersEntity): void {
    ContextProvider.set('request.user', user);
  }

  static getAuthUser(): UsersEntity {
    return ContextProvider.get(ContextProvider.authUserKey);
  }
}