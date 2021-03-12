import { TSBufferProto, TSBufferSchema } from 'tsbuffer-schema';
import { InterfaceReference } from 'tsbuffer-schema/src/InterfaceReference';
import { ArrayTypeSchema } from 'tsbuffer-schema/src/schemas/ArrayTypeSchema';
import { BufferTypeSchema } from 'tsbuffer-schema/src/schemas/BufferTypeSchema';
import { EnumTypeSchema } from 'tsbuffer-schema/src/schemas/EnumTypeSchema';
import { IndexedAccessTypeSchema } from 'tsbuffer-schema/src/schemas/IndexedAccessTypeSchema';
import { InterfaceTypeSchema } from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import { IntersectionTypeSchema } from 'tsbuffer-schema/src/schemas/IntersectionTypeSchema';
import { LiteralTypeSchema } from 'tsbuffer-schema/src/schemas/LiteralTypeSchema';
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

/** 单次validate的选项，会向下透传 */
export interface ValidateOptions {
    // Common properties from Union/Intersection type
    unionProperties?: string[]
}

export interface TSBufferValidatorOptions {
    /** 检查interface中是否包含Schema之外的字段，默认为true */
    excessPropertyChecks?: boolean,

    /** undefined和null区别对待，默认为true */
    strictNullChecks?: boolean
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

export class TSBufferValidator<Proto extends TSBufferProto> {
    /** 默认配置 */
    options: TSBufferValidatorOptions = {
        excessPropertyChecks: true,
        strictNullChecks: true
    }
    /** 会自动赋予每个schema一个uuid，便于提升性能 */
    proto: { [schemaId: string]: TSBufferSchema & { uuid: number } };

    readonly protoHelper: ProtoHelper;
    constructor(proto: Proto, options?: Partial<TSBufferValidatorOptions>) {
        this.proto = {};
        let uuid = 0;
        for (let key in proto) {
            this.proto[key] = {
                ...(proto as TSBufferProto)[key],
                uuid: ++uuid
            }
        }

        if (options) {
            Object.assign(this.options, options);
        }
        this.protoHelper = new ProtoHelper(this.proto);
    }

    /**
     * 验证
     * @param value 
     * @param schemaId 例如 a/b.ts 里的 Test类型 则ID为 a/b/Test
     */
    validate(value: any, schemaOrId: keyof Proto | TSBufferSchema): ValidateResult {
        let schema: TSBufferSchema;
        let schemaId: string | undefined;

        // Get schema
        if (typeof schemaOrId === 'string') {
            schemaId = schemaOrId;
            schema = this.proto[schemaId];
            if (!schema) {
                throw new Error(`Cannot find schema: ${schemaId}`);
            }
        }
        else {
            schema = schemaOrId as TSBufferSchema;
        }

        // Merge default options
        return this._validate(value, schema);
    }

    private _validate(value: any, schema: TSBufferSchema, options?: ValidateOptions) {
        // Validate
        switch (schema.type) {
            case 'Boolean':
                return this._validateBooleanType(value);
            case 'Number':
                return this._validateNumberType(value, schema);
            case 'String':
                return this._validateStringType(value);
            case 'Array':
                return this._validateArrayType(value, schema);
            case 'Tuple':
                return this._validateTupleType(value, schema);
            case 'Enum':
                return this._validateEnumType(value, schema);
            case 'Any':
                return this._validateAnyType(value);
            case 'Literal':
                return this._validateLiteralType(value, schema);
            case 'NonPrimitive':
                return this._validateNonPrimitiveType(value);
            case 'Interface':
                return this._validateInterfaceType(value, schema, options?.unionProperties);
            case 'Buffer':
                return this._validateBufferType(value, schema);
            case 'IndexedAccess':
            case 'Reference':
                return this._validateReferenceType(value, schema, options);
            case 'Union':
                return this._validateUnionType(value, schema, options?.unionProperties);
            case 'Intersection':
                return this._validateIntersectionType(value, schema, options?.unionProperties);
            case 'Pick':
            case 'Omit':
            case 'Partial':
            case 'Overwrite':
                return this._validateMappedType(value, schema, options?.unionProperties);
            // 错误的type
            default:
                throw new Error(`Unsupported schema type: ${(schema as any).type}`);
        }
    }

    /**
     * 修剪 Object，移除 Schema 中未定义的 Key
     * @param value 
     * @param unionProperties validate 的 options 输出
     * @returns 如果是object会返回一个value的浅拷贝，否则返回原始value
     */
    private _prune<T>(value: T, unionProperties: string[]): T {
        if (typeof value !== 'object' || value === null || Object.getPrototypeOf(value) !== Object.prototype) {
            return value;
        }

        // remove excess properties
        let output: any = {};
        for (let property of unionProperties) {
            if ((value as Object).hasOwnProperty(property)) {
                output[property] = value[property as keyof T];
            }
        }
        return output;
    }

    private _validateBooleanType(value: any): ValidateResult {
        if (typeof value === 'boolean') {
            return ValidateResult.success;
        }
        else {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }
    }

    private _validateNumberType(value: any, schema: NumberTypeSchema): ValidateResult {
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

    private _validateStringType(value: any): ValidateResult {
        return typeof value === 'string' ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    private _validateArrayType(value: any, schema: ArrayTypeSchema): ValidateResult {
        // is Array type
        if (!Array.isArray(value)) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // validate elementType
        for (let i = 0; i < value.length; ++i) {
            let elemValidateResult = this._validate(value[i], schema.elementType);
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.success;
    }

    private _validateTupleType(value: any, schema: TupleTypeSchema): ValidateResult {
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
            if (value[i] === undefined || !this.options.strictNullChecks && value[i] == undefined) {
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

            let elemValidateResult = this._validate(value[i], schema.elementTypes[i]);
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

    private _validateEnumType(value: any, schema: EnumTypeSchema): ValidateResult {
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

    private _validateAnyType(value: any): ValidateResult {
        return ValidateResult.success;
    }

    private _validateLiteralType(value: any, schema: LiteralTypeSchema): ValidateResult {
        // 非 null undefined 严格模式，null undefined同等对待
        if (!this.options.strictNullChecks && (schema.literal === null || schema.literal === undefined)) {
            return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
        }

        return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
    }

    private _validateNonPrimitiveType(value: any): ValidateResult {
        return typeof value === 'object' && value !== null ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    private _validateInterfaceType(value: any, schema: InterfaceTypeSchema | InterfaceReference, unionProperties?: string[]): ValidateResult {
        if (typeof value !== 'object' || value === null) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 先展平
        let flatSchema = this.protoHelper.getFlatInterfaceSchema(schema);

        // From union or intersecton type
        if (unionProperties) {
            this.protoHelper.applyNonExcessProperties(flatSchema, unionProperties);
        }

        return this._validateFlatInterface(value, flatSchema);
    }

    private _validateMappedType(value: any, schema: PickTypeSchema | OmitTypeSchema | PartialTypeSchema | OverwriteTypeSchema, unionProperties?: string[]): ValidateResult {
        let parsed = this.protoHelper.parseMappedType(schema);
        if (parsed.type === 'Interface') {
            return this._validateInterfaceType(value, schema, unionProperties);
        }
        else if (parsed.type === 'Union') {
            return this._validateUnionType(value, parsed, unionProperties);
        }

        throw new Error();
    }

    private _validateFlatInterface(value: any, schema: FlatInterfaceTypeSchema) {
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
                if (value[property.name] === undefined || !this.options.strictNullChecks && value[property.name] == undefined) {
                    // Optional or Can be undefined
                    if (property.optional || this._canBeUndefined(property.type)) {
                        continue;
                    }
                    else {
                        return ValidateResult.error(ValidateErrorCode.InnerError, property.name, ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
                    }
                }

                // property本身验证
                let vRes = this._validate(value[property.name], property.type);
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, property.name, vRes);
                }
            }
        }

        // 检测indexSignature
        if (schema.indexSignature) {
            for (let key in value) {
                // validate each field
                let vRes = this._validate(value[key], schema.indexSignature.type);
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, vRes);
                }
            }
        }
        // 超出字段检测
        else if (this.options.excessPropertyChecks) {
            let validProperties = schema.properties.map(v => v.name);
            let firstExcessProperty = Object.keys(value).find(v => validProperties.indexOf(v) === -1);
            if (firstExcessProperty) {
                return ValidateResult.error(ValidateErrorCode.InnerError, firstExcessProperty, ValidateResult.error(ValidateErrorCode.UnexpectedField))
            }
        }

        return ValidateResult.success;
    }

    private _validateBufferType(value: any, schema: BufferTypeSchema): ValidateResult {
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

    private _validateReferenceType(value: any, schema: ReferenceTypeSchema | IndexedAccessTypeSchema, options?: ValidateOptions): ValidateResult {
        return this._validate(value, this.protoHelper.parseReference(schema), options);
    }

    private _validateUnionType(value: any, schema: UnionTypeSchema, unionProperties?: string[]): ValidateResult {
        if (!unionProperties) {
            this.protoHelper.addUnionProperties(unionProperties = [], schema.members.map(v => v.type));
        }

        // 有一成功则成功
        for (let member of schema.members) {
            let memberType = this.protoHelper.isTypeReference(member.type) ? this.protoHelper.parseReference(member.type) : member.type;
            let vRes: ValidateResult = this._validate(value, memberType, {
                unionProperties: unionProperties
            });
            // 有一成功则成功
            if (vRes.isSucc) {
                return ValidateResult.success;
            }
        }

        // 全失败，则失败
        return ValidateResult.error(ValidateErrorCode.NonConditionMet);
    }

    private _validateIntersectionType(value: any, schema: IntersectionTypeSchema, unionProperties?: string[]): ValidateResult {
        if (!unionProperties) {
            this.protoHelper.addUnionProperties(unionProperties = [], schema.members.map(v => v.type));
        }

        // 有一失败则失败
        for (let i = 0, len = schema.members.length; i < len; ++i) {
            // 验证member
            let memberType = schema.members[i].type;
            memberType = this.protoHelper.isTypeReference(memberType) ? this.protoHelper.parseReference(memberType) : memberType;

            let vRes: ValidateResult;
            // interface 加入unionFIelds去validate
            if (this.protoHelper.isInterface(memberType)) {
                vRes = this._validateInterfaceType(value, memberType, unionProperties);
            }
            // LogicType 递归unionFields
            else if (memberType.type === 'Union') {
                vRes = this._validateUnionType(value, memberType, unionProperties);
            }
            else if (memberType.type === 'Intersection') {
                vRes = this._validateIntersectionType(value, memberType, unionProperties);
            }
            // 其它类型 直接validate
            else {
                vRes = this._validate(value, memberType);
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