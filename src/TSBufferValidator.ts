import { TSBufferSchema } from 'tsbuffer-schema';
import { ValidateResult } from './ValidateResult';
import { BaseValidator } from './validators.ts/BaseValidator';

export const TypeValidatorMap: {
    [type: string]: BaseValidator
} = {

}

export class TSBufferValidator {

    validate(value: any, schema: TSBufferSchema): ValidateResult {
        if (TypeValidatorMap[schema.type]) {
            return TypeValidatorMap[schema.type].validate(value, schema);
        }
        else {
            throw new Error(`Unrecognized schema type: ${schema.type}`);
        }
    }

}