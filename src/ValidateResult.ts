export enum ValidateErrorCode {
    Succ = 0,
    WrongType,
    InvalidUnsignedNumber,
    InvalidInteger,
    CantBeBigInt,
    InvalidArrayElement,
    TupleOverlength,
    InvalidTupleElement,
    InvalidEnumValue,
    AnyTypeCannotBeArrayBuffer,
    AnyTypeCannotBeTypedArray,
    InvalidLiteralValue,
    InvalidInterfaceMember,
    UnexpectedField,
    InvalidNumberKey,
    ExtendsMustBeInterface,
    InvalidBufferArrayType,
    SchemaError
}

export class ValidateResult {

    errcode: ValidateErrorCode;

    /**
     * 若是InterfaceValidator或ArrayValidator，则此字段标识错误发生在哪个子字段
     */
    fieldName?: string;

    /**
     * 子字段的错误详情
     * errcode指整体的错误码， fieldName指若是错误从子元素发出，那么发生在哪个子元素，innerError指具体子元素发出的错误
     * 如有
     *    {
     *      a: {
     *          b:{
     *              c: number
     *          }
     *      }
     *    }
     * 对于 {a:{b:{c:"Wrong"}}}, 验证结果为：
     * {
     *    errcode: InterfaceNotMatch,
     *    fieldName: a,
     *    innerError: {
     *          errcode: InterfaceNotMatch,
     *          field: b,
     *          innerError: {
     *              errcode: BasicTypeNotMatch,
     *              fieldName: c
     *          }
     *    }
     * }
     */
    innerError?: ValidateResult;

    private constructor(errcode: ValidateErrorCode = 0, fieldName?: string, innerError?: ValidateResult) {
        this.errcode = errcode;
        this.fieldName = fieldName;
        this.innerError = innerError;
    }

    static readonly success = new ValidateResult(ValidateErrorCode.Succ);

    //重载检测 fieldName和innerError要传必须一起
    static error(errcode: ValidateErrorCode): ValidateResult;
    static error(errcode: ValidateErrorCode, fieldName: string, innerError: ValidateResult): ValidateResult;
    static error(errcode: ValidateErrorCode, fieldName?: string, innerError?: ValidateResult) {
        return new ValidateResult(errcode, fieldName, innerError);
    }

    /**
     * 最里面的错误，如对上面 {a:{b:{c:"Wrong"}}} 的例子
     * 返回为
     * { errcode:BasicTypeNotMatch, fieldName:'a.b.c' }
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
                let output = new ValidateResult(result.errcode);
                output.fieldName = fieldNames.join('.');
                return output;
            }
        }
    }

    get isSucc(): boolean {
        return this.errcode === ValidateErrorCode.Succ;
    }

    get message(): string {
        return ValidateErrorCode[this.errcode] || 'UnknownError';
    }

}