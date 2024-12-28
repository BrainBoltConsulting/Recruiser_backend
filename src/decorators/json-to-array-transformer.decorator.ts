import { plainToInstance, Transform } from 'class-transformer';

export function ParseJsonArray(type: any) {
  return Transform(({ value }) => {
    try {
      if (typeof value === 'string') {
        const parsedItem = JSON.parse(value);
        return [ plainToInstance(type, parsedItem) ];
      } else if (Array.isArray(value)) {
        return value.map((item) => {
          return plainToInstance(type, item);
        });
      } else {
        throw new Error('Value is not an array');
      }
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  });
}