import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function NameContainsEnum(entity: object, validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'NameContainsEnum',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
            if (value && Object.values(entity).find(el => value.includes(el))) {
                return true;
            }
            return false;
        },
      },
    });

  };
}