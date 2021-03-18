import { TSBufferSchema } from "tsbuffer-schema";
import { IntersectionTypeSchema } from "tsbuffer-schema/src/schemas/IntersectionTypeSchema";

export interface ValidateResultSucc {
    isSucc: true,
    errMsg?: undefined
}

export interface ValidateResultErrorData {
    isSucc: false,
    property?: string[],
    // AtomError
    errMsg: string,
    value: any,
    schema: TSBufferSchema,
    /** Union Member Error (all) */
    unionMemberErrors?: ValidateResultError[];
    /** Intersection Member Error (any one) */
    intersection?: {
        schema: IntersectionTypeSchema,
        errorMemberIndex: number
    }
}
export class ValidateResultError implements ValidateResultErrorData {
    isSucc: false = false;

    // AtomError
    _errMsg!: string;
    property?: string[];
    value!: any;
    schema!: TSBufferSchema;
    /** Union Member Error (all) */
    unionMemberErrors?: ValidateResultError[];
    /** Intersection Member Error (any one) */
    fromIntersection?: {
        schema: IntersectionTypeSchema,
        errorMemberIndex: number
    };

    constructor(data: ValidateResultErrorData) {
        Object.assign(this, data);
    }

    get errMsg(): string {
        return ValidateResultError.getErrMsg(this._errMsg, this.property);
    }
    set errMsg(v: string) {
        this._errMsg = v;
    }

    static getErrMsg(errMsg: string, property: string[] | undefined) {
        if (property?.length) {
            return `Property ${property.join('.')}: ${errMsg}`
        }
        else {
            return errMsg;
        }
    }
}

export type ValidateResult = ValidateResultSucc | ValidateResultError;

export class ValidateResultUtil {
    static readonly succ: ValidateResultSucc = { isSucc: true };

    static error(errMsg: string, value: any, schema: TSBufferSchema, extra?: Partial<ValidateResultError>): ValidateResultError {
        return new ValidateResultError({
            isSucc: false,
            errMsg: errMsg,
            value: value,
            schema: schema,
            ...extra
        })
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