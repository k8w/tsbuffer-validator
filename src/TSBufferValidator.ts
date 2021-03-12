import { TSBufferProto, TSBufferSchema } from 'tsbuffer-schema';
import { InterfaceReference } from 'tsbuffer-schema/src/InterfaceReference';
import { AnyTypeSchema } from 'tsbuffer-schema/src/schemas/AnyTypeSchema';
import { ArrayTypeSchema } from 'tsbuffer-schema/src/schemas/ArrayTypeSchema';
import { BooleanTypeSchema } from 'tsbuffer-schema/src/schemas/BooleanTypeSchema';
import { BufferTypeSchema } from 'tsbuffer-schema/src/schemas/BufferTypeSchema';
import { EnumTypeSchema } from 'tsbuffer-schema/src/schemas/EnumTypeSchema';
import { IndexedAccessTypeSchema } from 'tsbuffer-schema/src/schemas/IndexedAccessTypeSchema';
import { InterfaceTypeSchema } from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import { IntersectionTypeSchema } from 'tsbuffer-schema/src/schemas/IntersectionTypeSchema';
import { LiteralTypeSchema } from 'tsbuffer-schema/src/schemas/LiteralTypeSchema';
import { NonPrimitiveTypeSchema } from 'tsbuffer-schema/src/schemas/NonPrimitiveTypeSchema';
import { NumberTypeSchema } from 'tsbuffer-schema/src/schemas/NumberTypeSchema';
import { OmitTypeSchema } from 'tsbuffer-schema/src/schemas/OmitTypeSchema';
import { OverwriteTypeSchema } from 'tsbuffer-schema/src/schemas/OverwriteTypeSchema';
import { PartialTypeSchema } from 'tsbuffer-schema/src/schemas/PartialTypeSchema';
import { PickTypeSchema } from 'tsbuffer-schema/src/schemas/PickTypeSchema';
import { ReferenceTypeSchema } from 'tsbuffer-schema/src/schemas/ReferenceTypeSchema';
import { StringTypeSchema } from 'tsbuffer-schema/src/schemas/StringTypeSchema';
import { TupleTypeSchema } from 'tsbuffer-schema/src/schemas/TupleTypeSchema';
import { UnionTypeSchema } from 'tsbuffer-schema/src/schemas/UnionTypeSchema';
import { FlatInterfaceTypeSchema, ProtoHelper } from './ProtoHelper';
import { ValidateErrorCode, ValidateResult } from './ValidateResult';

export interface ValidateOptions {
    /** 合法的可以出现的属性名，不会触发excess property check的错误 */
    nonExcessProperties?: string[],

    /** 检查interface中是否包含Schema之外的字段，默认为true */
    excessPropertyChecks?: boolean,

    /** undefined和null区别对待，默认为true */
    strictNullChecks?: boolean
}

export interface TSBufferValidatorOptions {

}

const typedArrays = {
    Int8Array: Int8Array,
    Int16Array: Int16Array,
    Int32Array: Int32Array,
    BigInt64Array: typeof BigInt64Array !== 'undefined' ? BigInt64Array : undefined,
    Uint8Array: Uint8Array,
    Uint16Array: Uint16Array,
    Uint32Array: Uint32Array,
    BigUint64Array: typeof BigUint64Array !== 'undefined' ? BigUint64Array : undefined,
    Float32Array: Float32Array,
    Float64Array: Float64Array
};

export class TSBufferValidator<Proto extends TSBufferProto = TSBufferProto> {

    /** 默认 validate options */
    static defaultValidateOptions: ValidateOptions = {
        excessPropertyChecks: true,
        strictNullChecks: true
    }

    /** 默认配置 */
    options: TSBufferValidatorOptions = {}
    proto: Proto;

    readonly protoHelper: ProtoHelper;
    constructor(proto: Proto, options?: Partial<TSBufferValidatorOptions>) {
        this.proto = proto;
        if (options) {
            Object.assign(this.options, options);
        }
        this.protoHelper = new ProtoHelper(proto);
    }

    /**
     * 验证
     * @param value 
     * @param schemaId 例如 a/b.ts 里的 Test类型 则ID为 a/b/Test
     */
    validate(value: any, schemaOrId: keyof Proto | TSBufferSchema, options?: ValidateOptions): ValidateResult {
        let schema: TSBufferSchema;

        // Get schema
        if (typeof schemaOrId === 'string') {
            schema = this.proto[schemaOrId];
            if (!schema) {
                throw new Error(`Cannot find schema: ${schemaOrId}`);
            }
        }
        else {
            schema = schemaOrId as TSBufferSchema;
        }

        // Merge default options
        options = Object.assign({}, TSBufferValidator.defaultValidateOptions, options);

        // Validate
        switch (schema.type) {
            case 'Boolean':
                return this._validateBooleanType(value, schema, options);
            case 'Number':
                return this._validateNumberType(value, schema, options);
            case 'String':
                return this._validateStringType(value, schema, options);
            case 'Array':
                return this._validateArrayType(value, schema, options);
            case 'Tuple':
                return this._validateTupleType(value, schema, options);
            case 'Enum':
                return this._validateEnumType(value, schema, options);
            case 'Any':
                return this._validateAnyType(value, schema, options);
            case 'Literal':
                return this._validateLiteralType(value, schema, options);
            case 'NonPrimitive':
                return this._validateNonPrimitiveType(value, schema, options);
            case 'Interface':
                return this._validateInterfaceType(value, schema, options);
            case 'Buffer':
                return this._validateBufferType(value, schema, options);
            case 'IndexedAccess':
                return this._validateIndexedAccessType(value, schema, options);
            case 'Reference':
                return this._validateReferenceType(value, schema, options);
            case 'Union':
                return this._validateUnionType(value, schema, options);
            case 'Intersection':
                return this._validateIntersectionType(value, schema, options);
            case 'Pick':
            case 'Omit':
            case 'Partial':
            case 'Overwrite':
                return this._validateMappedType(value, schema, options);
            // 错误的type
            default:
                throw new Error(`Unsupported schema type: ${(schema as any).type}`);
        }
    }

    /**
     * 修剪 Object，移除 Schema 中未定义的 Key
     * @param value 
     * @param nonExcessProperties validate 的 options 输出
     * @returns 如果是object会返回一个value的浅拷贝，否则返回原始value
     */
    private _prune<T>(value: T, nonExcessProperties: string[]): T {
        if (typeof value !== 'object' || value === null || Object.getPrototypeOf(value) !== Object.prototype) {
            return value;
        }

        // remove excess properties
        let output: any = {};
        for (let property of nonExcessProperties) {
            if ((value as Object).hasOwnProperty(property)) {
                output[property] = value[property as keyof T];
            }
        }
        return output;
    }

    private _validateBooleanType(value: any, schema: BooleanTypeSchema, options: ValidateOptions): ValidateResult {
        if (typeof value === 'boolean') {
            return ValidateResult.success;
        }
        else {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }
    }

    private _validateNumberType(value: any, schema: NumberTypeSchema, options: ValidateOptions): ValidateResult {
        // Wrong Type
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 默认为double
        let scalarType = schema.scalarType || 'double';

        // scalarType类型检测
        // 整形却为小数
        if (scalarType !== 'double' && typeof value === 'number' && !Number.isInteger(value)) {
            return ValidateResult.error(ValidateErrorCode.WrongScalarType);
        }
        // 无符号整形却为负数
        if (scalarType.indexOf('uint') > -1 && value < 0) {
            return ValidateResult.error(ValidateErrorCode.WrongScalarType);
        }
        // 不是bigint却为bigint
        if (scalarType.indexOf('big') === -1 && typeof value === 'bigint') {
            return ValidateResult.error(ValidateErrorCode.WrongScalarType);
        }
        // 应该是bigint却不为bigint
        if (scalarType.indexOf('big') > -1 && typeof value !== 'bigint') {
            return ValidateResult.error(ValidateErrorCode.WrongScalarType);
        }

        return ValidateResult.success;
    }

    private _validateStringType(value: any, schema: StringTypeSchema, options: ValidateOptions): ValidateResult {
        return typeof value === 'string' ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    private _validateArrayType(value: any, schema: ArrayTypeSchema, options: ValidateOptions): ValidateResult {
        // is Array type
        if (!Array.isArray(value)) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // validate elementType
        for (let i = 0; i < value.length; ++i) {
            let elemValidateResult = this.validate(value[i], schema.elementType, options);
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.success;
    }

    private _validateTupleType(value: any, schema: TupleTypeSchema, options: ValidateOptions): ValidateResult {
        // is Array type
        if (!Array.isArray(value)) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // validate length
        if (value.length > schema.elementTypes.length) {
            return ValidateResult.error(ValidateErrorCode.TupleOverlength);
        }

        // validate elementType
        for (let i = 0; i < schema.elementTypes.length; ++i) {
            if (value[i] === undefined || !options.strictNullChecks && value[i] == undefined) {
                if (
                    // Optional
                    schema.optionalStartIndex !== undefined && i >= schema.optionalStartIndex
                    // Can be undefined
                    || this._canBeUndefined(schema.elementTypes[i])
                ) {
                    continue;
                }
                // Missing Required
                else {
                    return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
                }
            }

            let elemValidateResult = this.validate(value[i], schema.elementTypes[i], options);
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.success;
    }

    private _canBeUndefined(schema: TSBufferSchema): boolean {
        if (schema.type === 'Union') {
            return schema.members.some(v => this._canBeUndefined(v.type))
        }

        if (schema.type === 'Literal' && schema.literal === undefined) {
            return true;
        }

        return false;
    }

    private _validateEnumType(value: any, schema: EnumTypeSchema, options: ValidateOptions): ValidateResult {
        // must be string or number
        if (typeof value !== 'string' && typeof value !== 'number') {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 有值与预设相同
        if (schema.members.some(v => v.value === value)) {
            return ValidateResult.success;
        }
        else {
            return ValidateResult.error(ValidateErrorCode.InvalidEnumValue);
        }
    }

    private _validateAnyType(value: any, schema: AnyTypeSchema, options: ValidateOptions): ValidateResult {
        return ValidateResult.success;
    }

    private _validateLiteralType(value: any, schema: LiteralTypeSchema, options: ValidateOptions): ValidateResult {
        // 非 null undefined 严格模式，null undefined同等对待
        if (schema.literal == null && !options.strictNullChecks) {
            return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
        }

        return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
    }

    private _validateNonPrimitiveType(value: any, schema: NonPrimitiveTypeSchema, options: ValidateOptions): ValidateResult {
        return typeof value === 'object' && value !== null ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    private _validateInterfaceType(value: any, schema: InterfaceTypeSchema | InterfaceReference, options: ValidateOptions): ValidateResult {
        if (typeof value !== 'object' || value === null) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 先展平
        let flatSchema = this.protoHelper.getFlatInterfaceSchema(schema);

        // Union Fields
        options.nonExcessProperties && this.protoHelper.applyNonExcessProperties(flatSchema, options.nonExcessProperties);

        return this._validateFlatInterface(value, flatSchema, options);
    }

    private _validateMappedType(value: any, schema: PickTypeSchema | OmitTypeSchema | PartialTypeSchema | OverwriteTypeSchema, options: ValidateOptions): ValidateResult {
        let parsed = this.protoHelper.parseMappedType(schema);
        if (parsed.type === 'Interface') {
            return this._validateInterfaceType(value, schema, options);
        }
        else if (parsed.type === 'Union') {
            return this._validateUnionType(value, parsed, options);
        }

        throw new Error();
    }

    private _validateFlatInterface(value: any, schema: FlatInterfaceTypeSchema, options: ValidateOptions) {
        // interfaceSignature强制了key必须是数字的情况
        if (schema.indexSignature && schema.indexSignature.keyType === 'Number') {
            for (let key in value) {
                if (!this._isNumberKey(key)) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, ValidateResult.error(ValidateErrorCode.InvalidNumberKey))
                }
            }
        }

        // 校验properties
        if (schema.properties) {
            for (let property of schema.properties) {
                if (value[property.name] === undefined || !options.strictNullChecks && value[property.name] == undefined) {
                    // Optional or Can be undefined
                    if (property.optional || this._canBeUndefined(property.type)) {
                        continue;
                    }
                    else {
                        return ValidateResult.error(ValidateErrorCode.InnerError, property.name, ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
                    }
                }

                // property本身验证
                let vRes = this.validate(value[property.name], property.type);
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, property.name, vRes);
                }
            }
        }

        // 检测indexSignature
        if (schema.indexSignature) {
            for (let key in value) {
                // validate each field
                let vRes = this.validate(value[key], schema.indexSignature.type);
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, vRes);
                }
            }
        }
        // 超出字段检测
        else if (options.excessPropertyChecks) {
            let firstExcessProperty = Object.keys(value).find(v => options.nonExcessProperties!.indexOf(v) === -1);
            if (firstExcessProperty) {
                return ValidateResult.error(ValidateErrorCode.InnerError, firstExcessProperty, ValidateResult.error(ValidateErrorCode.UnexpectedField))
            }
        }

        return ValidateResult.success;
    }

    private _validateBufferType(value: any, schema: BufferTypeSchema, options: ValidateOptions): ValidateResult {
        if (schema.arrayType) {
            let typeArrayClass = typedArrays[schema.arrayType];
            if (!typeArrayClass) {
                throw new Error(`Error TypedArray type: ${schema.arrayType}`);
            }
            return value instanceof typeArrayClass ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType)
        }
        else {
            return value instanceof ArrayBuffer ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
        }
    }

    private _validateIndexedAccessType(value: any, schema: IndexedAccessTypeSchema, options: ValidateOptions): ValidateResult {
        return this.validate(value, this.protoHelper.parseReference(schema), options);
    }

    private _validateReferenceType(value: any, schema: ReferenceTypeSchema, options: ValidateOptions): ValidateResult {
        return this.validate(value, this.protoHelper.parseReference(schema), options);
    }

    private _validateUnionType(value: any, schema: UnionTypeSchema, options: ValidateOptions): ValidateResult {
        if (!options.nonExcessProperties) {
            this.protoHelper.addNonExcessProperties(options.nonExcessProperties = [], schema.members.map(v => v.type));
        }

        // 有一成功则成功
        for (let member of schema.members) {
            let memberType = this.protoHelper.isTypeReference(member.type) ? this.protoHelper.parseReference(member.type) : member.type;
            let vRes: ValidateResult = this.validate(value, memberType, options);
            // 有一成功则成功
            if (vRes.isSucc) {
                return ValidateResult.success;
            }
        }

        // 全失败，则失败
        return ValidateResult.error(ValidateErrorCode.NonConditionMet);
    }

    private _validateIntersectionType(value: any, schema: IntersectionTypeSchema, options: ValidateOptions): ValidateResult {
        if (!options.nonExcessProperties) {
            this.protoHelper.addNonExcessProperties(options.nonExcessProperties = [], schema.members.map(v => v.type));
        }

        // 有一失败则失败
        for (let i = 0, len = schema.members.length; i < len; ++i) {
            // 验证member
            let memberType = schema.members[i].type;
            memberType = this.protoHelper.isTypeReference(memberType) ? this.protoHelper.parseReference(memberType) : memberType;

            let vRes: ValidateResult;
            // interface 加入unionFIelds去validate
            if (this.protoHelper.isInterface(memberType)) {
                vRes = this._validateInterfaceType(value, memberType, options);
            }
            // LogicType 递归unionFields
            else if (memberType.type === 'Union') {
                vRes = this._validateUnionType(value, memberType, options);
            }
            else if (memberType.type === 'Intersection') {
                vRes = this._validateIntersectionType(value, memberType, options);
            }
            // 其它类型 直接validate
            else {
                vRes = this.validate(value, memberType);
            }

            // 有一失败则失败
            if (!vRes.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, `<Condition${i}>`, vRes);
            }
        }

        // 全成功则成功
        return ValidateResult.success;
    }

    private _isNumberKey(key: string): boolean {
        let int = parseInt(key);
        return !(isNaN(int) || ('' + int) !== key);
    }
}