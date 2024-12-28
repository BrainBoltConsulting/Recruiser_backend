import { registerDecorator, ValidationOptions, ValidationArguments, isUUID } from 'class-validator';

export function IsUUIDArray(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isUUIDArray',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (!this.validate(item)) {
                        return false;
                    }
                }

                return true;
            } 
            return isUUID(value, 'all')
        },
      },
    });

  };
}