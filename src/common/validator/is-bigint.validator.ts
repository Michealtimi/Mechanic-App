// src/common/validators/is-bigint.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsBigInt(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isBigInt',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          try {
            // Attempt to convert to BigInt. Handle string or actual BigInt.
            // If it's a number, it will fail, which is intended for financial amounts.
            if (typeof value === 'bigint') return true;
            if (typeof value === 'string') {
                BigInt(value);
                return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid BigInt string or BigInt literal`;
        },
      },
    });
  };
}