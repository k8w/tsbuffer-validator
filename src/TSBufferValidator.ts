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
import { TupleTypeSchema } from 'tsbuffer-schema/src/schemas/TupleTypeSchema';
import { UnionTypeSchema } from 'tsbuffer-schema/src/schemas/UnionTypeSchema';
import { FlatInterfaceTypeSchema, ProtoHelper } from './ProtoHelper';
import { ValidateErrorCode, ValidateResult } from './ValidateResult';

export interface ValidateOptions {
    unionFields?: string[]
}

export interface TSBufferValidatorOptions {
    /** 不检查interface中是否包含Schema之外的字段，默认为false */
    skipExcessCheck: boolean;
    /** undefined和null区别对待，默认为true */
    strictNullCheck: boolean;
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

export class TSBufferValidator {

    /** 默认配置 */
    _options: TSBufferValidatorOptions = {
        skipExcessCheck: false,
        strictNullCheck: true
    }

    private _proto: TSBufferProto;
    readonly protoHelper: ProtoHelper;
    constructor(proto: TSBufferProto, options?: Partial<TSBufferValidatorOptions>) {
        this._proto = proto;
        if (options) {
            Object.assign(this._options, options);
        }
        this.protoHelper = new ProtoHelper(proto);
    }

    /**
     * 验证
     * @param value 
     * @param schemaId 例如 a/b.ts 里的 Test类型 则ID为 a/b/Test
     */
    validate(value: any, schemaId: string, options?: ValidateOptions): ValidateResult {
        //获取Schema
        let schema: TSBufferSchema = this._proto[schemaId];
        if (!schema) {
            throw new Error(`Cannot find schema [${schemaId}]`);
        }

        return this.validateBySchema(value, schema, options);
    }

    /**
     * 移除协议中不存在的字段，确保类型安全
     * @param value 
     * @param schema 
     */
    prune(value: any, schema: string | TSBufferSchema): any {
        // TODO
    }

    validateBySchema(value: any, schema: TSBufferSchema, options?: ValidateOptions): ValidateResult {
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
                return this._validateInterfaceType(value, schema, options);
            case 'Buffer':
                return this._validateBufferType(value, schema);
            case 'IndexedAccess':
                return this._validateIndexedAccessType(value, schema);
            case 'Reference':
                return this._validateReferenceType(value, schema);
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
                throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
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
            let elemValidateResult = this.validateBySchema(value[i], schema.elementType);
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
            if (value[i] === undefined || !this._options.strictNullCheck && value[i] == undefined) {
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

            let elemValidateResult = this.validateBySchema(value[i], schema.elementTypes[i]);
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
        if (schema.literal == null && !this._options.strictNullCheck) {
            return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
        }

        return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
    }

    private _validateNonPrimitiveType(value: any): ValidateResult {
        return typeof value === 'object' && value !== null ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    private _validateInterfaceType(value: any, schema: InterfaceTypeSchema | InterfaceReference, options?: { unionFields?: string[] }): ValidateResult {
        if (typeof value !== 'object' || value === null) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 先展平
        let flatSchema = this.protoHelper.getFlatInterfaceSchema(schema);

        // Union Fields
        options?.unionFields && this.protoHelper.extendUnionFieldsToInterface(flatSchema, options.unionFields);

        return this._validateFlatInterface(value, flatSchema);
    }

    private _validateMappedType(value: any, schema: PickTypeSchema | OmitTypeSchema | PartialTypeSchema | OverwriteTypeSchema, options?: { unionFields?: string[] }): ValidateResult {
        let parsed = this.protoHelper.parseMappedType(schema);
        if (parsed.type === 'Interface') {
            return this._validateInterfaceType(value, schema, options);
        }
        else if (parsed.type === 'Union') {
            return this._validateUnionType(value, parsed);
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
                if (value[property.name] === undefined || !this._options.strictNullCheck && value[property.name] == undefined) {
                    // Optional or Can be undefined
                    if (property.optional || this._canBeUndefined(property.type)) {
                        continue;
                    }
                    else {
                        return ValidateResult.error(ValidateErrorCode.InnerError, property.name, ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
                    }
                }

                // property本身验证
                let vRes = this.validateBySchema(value[property.name], property.type);
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, property.name, vRes);
                }
            }
        }

        // 检测indexSignature
        if (schema.indexSignature) {
            for (let key in value) {
                // validate each field
                let vRes = this.validateBySchema(value[key], schema.indexSignature.type);
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, vRes);
                }
            }
        }
        // 超出字段检测
        else if (!this._options.skipExcessCheck) {
            let validatedFields = schema.properties.map(v => v.name);
            let remainedFields = Object.keys(value).remove(v => validatedFields.indexOf(v) > -1);
            if (remainedFields.length) {
                return ValidateResult.error(ValidateErrorCode.InnerError, remainedFields[0], ValidateResult.error(ValidateErrorCode.UnexpectedField))
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

    private _validateIndexedAccessType(value: any, schema: IndexedAccessTypeSchema): ValidateResult {
        return this.validateBySchema(value, this.protoHelper.parseReference(schema));
    }

    private _validateReferenceType(value: any, schema: ReferenceTypeSchema): ValidateResult {
        return this.validateBySchema(value, this.protoHelper.parseReference(schema));
    }

    private _validateUnionType(value: any, schema: UnionTypeSchema, options?: ValidateOptions): ValidateResult {
        if (!options) {
            options = {}
        }
        if (!options.unionFields) {
            this.protoHelper.extendsUnionFields(options.unionFields = [], schema.members.map(v => v.type));
        }

        // 有一成功则成功
        for (let member of schema.members) {
            let memberType = this.protoHelper.isTypeReference(member.type) ? this.protoHelper.parseReference(member.type) : member.type;
            let vRes: ValidateResult = this.validateBySchema(value, memberType, options);
            // 有一成功则成功
            if (vRes.isSucc) {
                return ValidateResult.success;
            }
        }

        // 全失败，则失败
        return ValidateResult.error(ValidateErrorCode.NonConditionMet);
    }

    private _validateIntersectionType(value: any, schema: IntersectionTypeSchema, options?: ValidateOptions): ValidateResult {
        if (!options) {
            options = {}
        }
        if (!options.unionFields) {
            this.protoHelper.extendsUnionFields(options.unionFields = [], schema.members.map(v => v.type));
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
                vRes = this.validateBySchema(value, memberType);
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