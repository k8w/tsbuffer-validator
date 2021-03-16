import { TSBufferSchema } from "tsbuffer-schema";

export enum ValidateResultCode {
    Succ = 0,

    // 内部错误
    InnerError,
    NonConditionMet,

    // 自身错误
    TypeofNotMatch, // Typeof Property 'xxx' should be 
    NotArray,
    NotInstanceOf,
    WrongScalarType,
    TupleOverlength,
    InvalidEnumValue,
    InvalidLiteralValue,
    MissingRequiredMember,
    ExcessProperty,
    InvalidNumberKey,
}

export type ValidateResultDataError = {
    code: ValidateResultCode.InnerError,
    innerError: {
        fieldName: string,
        error: ValidateResultDataError,
    }
} | {
    code: ValidateResultCode.NonConditionMet,
    memberErrors: ValidateResultDataError[]
} | {
    code: Exclude<ValidateResultCode, ValidateResultCode.Succ | ValidateResultCode.InnerError | ValidateResultCode.NonConditionMet>
}

export type ValidateResultData = ValidateResultDataError | { code: ValidateResultCode.Succ };

export class ValidateResult {

    private _code: ValidateResultCode;
    private _innerErrors?: {
        fieldName: string,
        error: ValidateResult
    }[];
    private _value: any;
    private _schema: TSBufferSchema;

    private constructor(code: ValidateResultCode, innerErrors?: ValidateResult['_innerErrors']) {
        this._code = code;
        this._innerErrors = innerErrors;
    }

    static readonly success = new ValidateResult(ValidateResultCode.Succ);

    static error(code: Exclude<ValidateResultCode, ValidateResultCode.Succ>): ValidateResult{ }
    
    get message(): string {
        return '';
    }

    //重载检测 fieldName和innerError要传必须一起
    static error(code: ValidateResultCode, message: string): ValidateResult;
    static error(code: ValidateResultCode.InnerError, fieldName: string, innerError: ValidateResult): ValidateResult;
    static error(code: ValidateResultCode, fieldName?: string, innerError?: ValidateResult) {
        return new ValidateResult(code, fieldName, innerError);
    }

    static innerError(fieldName: string, code: Exclude<ValidateResultCode, ValidateResultCode.InnerError>): ValidateResult {
        let fields = fieldName.split('.');
        let last = new ValidateResult(code);
        for (let i = fields.length - 1; i > -1; --i) {
            last = new ValidateResult(ValidateResultCode.InnerError, fields[i], last);
        }
        return last;
    }

    /**
     * 最里面的错误，如对上面 {a:{b:{c:"Wrong"}}} 的例子
     * 返回为
     * { code:BasicTypeNotMatch, fieldName:'a.b.c' }
     * 返回中一定没有innerError
     * @returns {ValidateResult}
     */
    get originalError(): ValidateResult {
        let fieldNames: string[] = [];
        let result: ValidateResult = this;
        while (true) {
            if (result.innerError) {
                fieldNames.push(result.fieldName as string);
                result = result.innerError;
            }
            else {
                let output = new ValidateResult(result.code);
                output.fieldName = fieldNames.join('.');
                return output;
            }
        }
    }

    get isSucc(): boolean {
        return this._code === ValidateResultCode.Succ;
    }
}