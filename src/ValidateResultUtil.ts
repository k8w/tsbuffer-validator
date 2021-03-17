import { TSBufferSchema } from "tsbuffer-schema";

export interface ValidateResultSucc {
    isSucc: true,
    errMsg?: undefined
}
export interface ValidateResultError {
    isSucc: false,
    property?: string[],
    // AtomError
    errMsg: string,
    value: any,
    schema: TSBufferSchema,
    memberErrors?: ValidateResultError[],
    errorMemberIndex?: number
}
export type ValidateResult = ValidateResultSucc | ValidateResultError;

export class ValidateResultUtil {
    static readonly succ: ValidateResult = { isSucc: true };

    static error(errMsg: string, value: any, schema: TSBufferSchema, extra?: Partial<ValidateResultError>): ValidateResultError {
        return {
            isSucc: false,
            errMsg: errMsg,
            value: value,
            schema: schema,
            ...extra
        }
    }

    static innerError(property: string | string[], innerError: ValidateResultError): ValidateResultError {
        if (!innerError.property) {
            innerError.property = [];
        }

        if (typeof property === 'string') {
            innerError.property!.unshift(property);
        }
        else {
            innerError.property!.unshift(...property);
        }

        return innerError;
    }
}