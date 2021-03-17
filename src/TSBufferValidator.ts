import { TSBufferProto, TSBufferSchema } from 'tsbuffer-schema';
import { InterfaceReference } from 'tsbuffer-schema/src/InterfaceReference';
import { ArrayTypeSchema } from 'tsbuffer-schema/src/schemas/ArrayTypeSchema';
import { BooleanTypeSchema } from 'tsbuffer-schema/src/schemas/BooleanTypeSchema';
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
import { ValidateResult } from './ValidateResult';

/** 单次validate的选项，会向下透传 */
export interface ValidateOptions {
    // Common properties from Union/Intersection type
    unionProperties?: string[],

    // prune and output to this object
    prune?: ValidatePruneOptions
}

export interface ValidatePruneOptions {
    // this value prune output
    output?: any,
    // update parent prune output
    parent?: {
        value: any,
        key: string | number
    }
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
    proto: TSBufferProto;

    readonly protoHelper: ProtoHelper;
    constructor(proto: Proto, options?: Partial<TSBufferValidatorOptions>) {
        this.proto = Object.merge({}, proto);

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
        let vRes: ValidateResult;

        // Validate
        switch (schema.type) {
            case 'Boolean':
                vRes = this._validateBooleanType(value);
                break;
            case 'Number':
                vRes = this._validateNumberType(value, schema);
                break;
            case 'String':
                vRes = this._validateStringType(value);
                break;
            case 'Array':
                vRes = this._validateArrayType(value, schema, options?.prune);
                break;
            case 'Tuple':
                vRes = this._validateTupleType(value, schema, options?.prune);
                break;
            case 'Enum':
                vRes = this._validateEnumType(value, schema);
                break;
            case 'Any':
                vRes = this._validateAnyType(value);
                break;
            case 'Literal':
                vRes = this._validateLiteralType(value, schema);
                break;
            case 'NonPrimitive':
                vRes = this._validateNonPrimitiveType(value);
                break;
            case 'Interface':
                vRes = this._validateInterfaceType(value, schema, options?.unionProperties, options?.prune);
                break;
            case 'Buffer':
                vRes = this._validateBufferType(value, schema);
                break;
            case 'IndexedAccess':
            case 'Reference':
                vRes = this._validateReferenceType(value, schema, options);
                break;
            case 'Union':
                vRes = this._validateUnionType(value, schema, options?.unionProperties, options?.prune);
                break;
            case 'Intersection':
                vRes = this._validateIntersectionType(value, schema, options?.unionProperties, options?.prune);
                break;
            case 'Pick':
            case 'Omit':
            case 'Partial':
            case 'Overwrite':
                vRes = this._validateMappedType(value, schema, options?.unionProperties, options?.prune);
                break;
            // 错误的type
            default:
                throw new Error(`Unsupported schema type: ${(schema as any).type}`);
        }

        // prune
        if (options?.prune) {
            // don't need prune, return original value
            if (options.prune.output === undefined) {
                options.prune.output = value;
            }
            // output to parent
            if (options.prune.parent) {
                options.prune.parent.value[options.prune.parent.key] = options.prune.output;
            }
        }

        return vRes;
    }

    /**
     * 修剪 Object，移除 Schema 中未定义的 Key
     * 需要确保 value 类型合法
     * @param value 
     * @param unionProperties validate 的 options 输出
     * @returns Return a shallow copy when prune occur, otherwise return the original value
     */
    validateAndPrune<T>(value: T, schemaOrId: string | TSBufferSchema): ValidateResult & { pruneOutput: T | undefined } {
        let schema: TSBufferSchema = typeof schemaOrId === 'string' ? this.proto[schemaOrId] : schemaOrId;
        if (!schema) {
            throw new Error('Cannot find schema: ' + schemaOrId);
        }

        let options: ValidateOptions = {
            prune: {}
        };
        let vRes = this._validate(value, schema, options) as ValidateResult & { pruneOutput: T };
        if (vRes.isSucc) {
            vRes.pruneOutput = options.prune!.output;
        }

        return vRes;
    }

    private _validateBooleanType(value: any, schema: BooleanTypeSchema): ValidateResult {
        let type = this._getTypeof(value);
        if (type === 'boolean') {
            return ValidateResult.succ;
        }
        else {
            return ValidateResult.error(`Type should be 'boolean', but actually '${type}'.`, value, schema);
        }
    }

    private _validateNumberType(value: any, schema: NumberTypeSchema): ValidateResult {
        // Wrong Type
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            return ValidateResult.error(ValidateErrorCode.TypeofNotMatch);
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

        return ValidateResult.succ;
    }

    private _validateStringType(value: any): ValidateResult {
        return typeof value === 'string' ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.TypeofNotMatch);
    }

    private _validateArrayType(value: any, schema: ArrayTypeSchema, prune: ValidatePruneOptions | undefined): ValidateResult {
        // is Array type
        if (!Array.isArray(value)) {
            return ValidateResult.error(ValidateErrorCode.NotArray);
        }

        // prune output
        if (prune) {
            prune.output = Array.from({ length: value.length });
        }

        // validate elementType
        for (let i = 0; i < value.length; ++i) {
            let elemValidateResult = this._validate(value[i], schema.elementType, {
                prune: prune?.output ? {
                    parent: {
                        value: prune.output,
                        key: i
                    }
                } : undefined
            });

            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.succ;
    }

    private _validateTupleType(value: any, schema: TupleTypeSchema, prune: ValidatePruneOptions | undefined): ValidateResult {
        // is Array type
        if (!Array.isArray(value)) {
            return ValidateResult.error(ValidateErrorCode.NotArray);
        }

        // validate length
        if (this.options.excessPropertyChecks && value.length > schema.elementTypes.length) {
            return ValidateResult.error(ValidateErrorCode.TupleOverlength);
        }

        // prune output
        if (prune) {
            prune.output = Array.from({ length: Math.min(value.length, schema.elementTypes.length) });
        }

        // validate elementType
        for (let i = 0; i < schema.elementTypes.length; ++i) {
            if (value[i] === undefined || value[i] === null && !this.options.strictNullChecks) {
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

            let elemValidateResult = this._validate(value[i], schema.elementTypes[i], {
                prune: prune?.output ? {
                    parent: {
                        value: prune.output,
                        key: i
                    }
                } : undefined
            });
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.succ;
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
            return ValidateResult.error(ValidateErrorCode.TypeofNotMatch);
        }

        // 有值与预设相同
        if (schema.members.some(v => v.value === value)) {
            return ValidateResult.succ;
        }
        else {
            return ValidateResult.error(ValidateErrorCode.InvalidEnumValue);
        }
    }

    private _validateAnyType(value: any): ValidateResult {
        return ValidateResult.succ;
    }

    private _validateLiteralType(value: any, schema: LiteralTypeSchema): ValidateResult {
        // 非 null undefined 严格模式，null undefined同等对待
        if (!this.options.strictNullChecks && (schema.literal === null || schema.literal === undefined)) {
            return value === null || value === undefined ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
        }

        return value === schema.literal ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
    }

    private _validateNonPrimitiveType(value: any): ValidateResult {
        return typeof value === 'object' && value !== null ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.TypeofNotMatch);
    }

    private _validateInterfaceType(value: any, schema: InterfaceTypeSchema | InterfaceReference, unionProperties: string[] | undefined, prune: ValidatePruneOptions | undefined): ValidateResult {
        if (typeof value !== 'object' || value === null) {
            return ValidateResult.error(ValidateErrorCode.TypeofNotMatch);
        }

        // 先展平
        let flatSchema = this.protoHelper.getFlatInterfaceSchema(schema);

        // From union or intersecton type
        if (unionProperties) {
            flatSchema = this.protoHelper.applyUnionProperties(flatSchema, unionProperties);
        }

        return this._validateFlatInterface(value, flatSchema, prune);
    }

    private _validateMappedType(value: any, schema: PickTypeSchema | OmitTypeSchema | PartialTypeSchema | OverwriteTypeSchema, unionProperties: string[] | undefined, prune: ValidatePruneOptions | undefined): ValidateResult {
        let parsed = this.protoHelper.parseMappedType(schema);
        if (parsed.type === 'Interface') {
            return this._validateInterfaceType(value, schema, unionProperties, prune);
        }
        else if (parsed.type === 'Union') {
            return this._validateUnionType(value, parsed, unionProperties, prune);
        }
        throw new Error();
    }

    private _validateFlatInterface(value: any, schema: FlatInterfaceTypeSchema, prune: ValidatePruneOptions | undefined) {
        // interfaceSignature强制了key必须是数字的情况
        if (schema.indexSignature && schema.indexSignature.keyType === 'Number') {
            for (let key in value) {
                if (!this._isNumberKey(key)) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, ValidateResult.error(ValidateErrorCode.InvalidNumberKey))
                }
            }
        }

        if (prune) {
            prune.output = {};
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
                let vRes = this._validate(value[property.name], property.type, {
                    prune: prune?.output && property.id > -1 ? {
                        parent: {
                            value: prune.output,
                            key: property.name
                        }
                    } : undefined
                });
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, property.name, vRes);
                }
            }
        }

        // 检测indexSignature
        if (schema.indexSignature) {
            for (let key in value) {
                // only prune is (property is pruned already)
                // let memberPrune: ValidatePruneOptions | undefined = schema.properties.some(v => v.name === key) ? undefined : {};

                // validate each field
                let vRes = this._validate(value[key], schema.indexSignature.type, {
                    prune: prune?.output ? {
                        parent: {
                            value: prune.output,
                            key: key
                        }
                    } : undefined
                });
                if (!vRes.isSucc) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, vRes);
                }
            }
        }
        else {
            // 超出字段检测
            if (this.options.excessPropertyChecks) {
                let validProperties = schema.properties.map(v => v.name);
                let firstExcessProperty = Object.keys(value).find(v => validProperties.indexOf(v) === -1);
                if (firstExcessProperty) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, firstExcessProperty, ValidateResult.error(ValidateErrorCode.ExcessProperty))
                }
            }
        }

        return ValidateResult.succ;
    }

    private _validateBufferType(value: any, schema: BufferTypeSchema): ValidateResult {
        if (schema.arrayType) {
            let typeArrayClass = typedArrays[schema.arrayType];
            if (!typeArrayClass) {
                throw new Error(`Error TypedArray type: ${schema.arrayType}`);
            }
            return value instanceof typeArrayClass ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.NotInstanceOf)
        }
        else {
            return value instanceof ArrayBuffer ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.NotInstanceOf);
        }
    }

    private _validateReferenceType(value: any, schema: ReferenceTypeSchema | IndexedAccessTypeSchema, options?: ValidateOptions): ValidateResult {
        return this._validate(value, this.protoHelper.parseReference(schema), options);
    }

    private _validateUnionType(value: any, schema: UnionTypeSchema, unionProperties: string[] | undefined, prune: ValidatePruneOptions | undefined): ValidateResult {
        unionProperties = unionProperties || this.protoHelper.getUnionProperties(schema);

        let isObjectPrune: boolean = false;
        if (prune && value && Object.getPrototypeOf(value) === Object.prototype) {
            isObjectPrune = true;
            prune.output = {};
        }

        // 有一成功则成功
        let isSomeSucc: boolean = false;
        for (let member of schema.members) {
            let memberType = this.protoHelper.isTypeReference(member.type) ? this.protoHelper.parseReference(member.type) : member.type;
            let memberPrune: ValidatePruneOptions | undefined = prune ? {} : undefined;
            let vRes: ValidateResult = this._validate(value, memberType, {
                unionProperties: unionProperties,
                prune: memberPrune
            });

            if (vRes.isSucc) {
                isSomeSucc = true;

                // if prune object, must prune all members
                if (isObjectPrune) {
                    Object.assign(prune!.output, memberPrune!.output);
                }
                else {
                    break;
                }
            }
        }

        // 有一成功则成功; 否则全失败，则失败
        return isSomeSucc ? ValidateResult.succ : ValidateResult.error(ValidateErrorCode.NonConditionMet);
    }

    private _validateIntersectionType(value: any, schema: IntersectionTypeSchema, unionProperties: string[] | undefined, prune: ValidatePruneOptions | undefined): ValidateResult {
        unionProperties = unionProperties || this.protoHelper.getUnionProperties(schema);

        let isObjectPrune: boolean = false;
        if (prune && value && Object.getPrototypeOf(value) === Object.prototype) {
            prune.output = {};
            isObjectPrune = true;
        }

        // 有一失败则失败
        for (let i = 0, len = schema.members.length; i < len; ++i) {
            // 验证member
            let memberType = schema.members[i].type;
            memberType = this.protoHelper.isTypeReference(memberType) ? this.protoHelper.parseReference(memberType) : memberType;
            let memberPrune: ValidatePruneOptions | undefined = prune ? {} : undefined;

            let vRes: ValidateResult = this._validate(value, memberType, {
                unionProperties: unionProperties,
                prune: memberPrune
            });
            // // interface 加入unionFIelds去validate
            // if (this.protoHelper.isInterface(memberType)) {
            //     vRes = this._validateInterfaceType(value, memberType, unionProperties, memberPrune);
            // }
            // // LogicType 递归unionFields
            // else if (memberType.type === 'Union') {
            //     vRes = this._validateUnionType(value, memberType, unionProperties, memberPrune);
            // }
            // else if (memberType.type === 'Intersection') {
            //     vRes = this._validateIntersectionType(value, memberType, unionProperties, memberPrune);
            // }
            // // 其它类型 直接validate
            // else {
            //     vRes = this._validate(value, memberType, {
            //         prune: memberPrune
            //     });
            // }

            // 有一失败则失败
            if (!vRes.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, `<Condition${i}>`, vRes);
            }

            if (isObjectPrune) {
                Object.assign(prune!.output, memberPrune!.output);
            }
        }

        // 全成功则成功
        return ValidateResult.succ;
    }

    private _isNumberKey(key: string): boolean {
        let int = parseInt(key);
        return !(isNaN(int) || ('' + int) !== key);
    }

    private _getTypeof(value: any): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "null" {
        let type = typeof value;
        if (type === 'object') {
            if (value === null) {
                return 'null';
            }
            else if (Array.isArray(type)) {
                return 'array';
            }
            else {
                return 'object';
            }
        }

        return type;
    }
}