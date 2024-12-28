import { ValidationOptions, ValidateBy, buildMessage, isNumberString } from 'class-validator';

export function IsArrayOfNumbers(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isArrayOfNumbers',
      validator: {
        validate(value: any) {
          if (!Array.isArray(value)) {
            return false;   
          }

          return value.every(element => isNumberString(String(element)));
        },
        defaultMessage: buildMessage(eachPrefix => eachPrefix + '$property must be an array of valid numbers', validationOptions),
      },
    },
    validationOptions
  );
}
