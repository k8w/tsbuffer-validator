import { TSBufferSchema } from "tsbuffer-schema";

export interface ValidateResultSucc {
    isSucc: true
}
export interface ValidateResultError {
    isSucc: false,
    property?: string[],
    // AtomError
    errMsg: string,
    value: any,
    schema: TSBufferSchema,
    memberResults?: ValidateResult[]
}
export type ValidateResultData = ValidateResultSucc | ValidateResultError;

export class ValidateResult {

    private _data: ValidateResultData;
    private constructor(data: ValidateResultData) {
        this._data = data;
    }

    static readonly succ: ValidateResult = new ValidateResult({ isSucc: true });

    static error(errMsg: string, value: any, schema: TSBufferSchema): ValidateResult {
        return new ValidateResult({
            isSucc: false,
            errMsg: errMsg,
            value: value,
            schema: schema
        })
    }

    static innerError(property: string | string[], innerError: ValidateResult): ValidateResult {
        if (!innerError.property) {
            (innerError._data as ValidateResultError).property = [];
        }

        if (typeof property === 'string') {
            innerError.property!.unshift(property);
        }
        else {
            innerError.property!.unshift(...property);
        }

        return innerError;
    }

    get isSucc() { return this._data.isSucc };
    get property() { return (this._data as ValidateResultError).property };
    get errMsg() { return (this._data as ValidateResultError).errMsg };
    get value() { return (this._data as ValidateResultError).value };
    get schema() { return (this._data as ValidateResultError).schema };
}