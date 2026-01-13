"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsBigInt = IsBigInt;
const class_validator_1 = require("class-validator");
function IsBigInt(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isBigInt',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value, args) {
                    try {
                        if (typeof value === 'bigint')
                            return true;
                        if (typeof value === 'string') {
                            BigInt(value);
                            return true;
                        }
                        return false;
                    }
                    catch (e) {
                        return false;
                    }
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid BigInt string or BigInt literal`;
                },
            },
        });
    };
}
//# sourceMappingURL=is-bigint.validator.js.map