import { ArrayTypeSchema, BooleanTypeSchema, BufferTypeSchema, EnumTypeSchema, IndexedAccessTypeSchema, InterfaceReference, InterfaceTypeSchema, IntersectionTypeSchema, LiteralTypeSchema, NonPrimitiveTypeSchema, NumberTypeSchema, OmitTypeSchema, OverwriteTypeSchema, PartialTypeSchema, PickTypeSchema, ReferenceTypeSchema, SchemaType, StringTypeSchema, TSBufferProto, TSBufferSchema, TupleTypeSchema, UnionTypeSchema } from 'tsbuffer-schema';
import { ErrorType, stringify } from './ErrorMsg';
import { FlatInterfaceTypeSchema, ProtoHelper } from './ProtoHelper';
import { ValidateResult, ValidateResultError, ValidateResultUtil } from './ValidateResultUtil';

/** 
 * 单次validate的选项，会向下透传
 * @internal
 */
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

/** @public */
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

/**
 * @public
 */
export class TSBufferValidator<Proto extends TSBufferProto = TSBufferProto> {
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
     * @param value - 待验证的值
     * @param schemaId - 例如 a/b.ts 里的 Test类型 则ID为 a/b/Test
     */
    validate(value: any, schemaOrId: keyof Proto | TSBufferSchema): ValidatorOutput {
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
            case SchemaType.Boolean:
                vRes = this._validateBooleanType(value, schema);
                break;
            case SchemaType.Number:
                vRes = this._validateNumberType(value, schema);
                break;
            case SchemaType.String:
                vRes = this._validateStringType(value, schema);
                break;
            case SchemaType.Array:
                vRes = this._validateArrayType(value, schema, options?.prune);
                break;
            case SchemaType.Tuple:
                vRes = this._validateTupleType(value, schema, options?.prune);
                break;
            case SchemaType.Enum:
                vRes = this._validateEnumType(value, schema);
                break;
            case SchemaType.Any:
                vRes = this._validateAnyType(value);
                break;
            case SchemaType.Literal:
                vRes = this._validateLiteralType(value, schema);
                break;
            case SchemaType.NonPrimitive:
                vRes = this._validateNonPrimitiveType(value, schema);
                break;
            case SchemaType.Interface:
                vRes = this._validateInterfaceType(value, schema, options?.unionProperties, options?.prune);
                break;
            case SchemaType.Buffer:
                vRes = this._validateBufferType(value, schema);
                break;
            case SchemaType.IndexedAccess:
            case SchemaType.Reference:
                vRes = this._validateReferenceType(value, schema, options);
                break;
            case SchemaType.Union:
                vRes = this._validateUnionType(value, schema, options?.unionProperties, options?.prune);
                break;
            case SchemaType.Intersection:
                vRes = this._validateIntersectionType(value, schema, options?.unionProperties, options?.prune);
                break;
            case SchemaType.Pick:
            case SchemaType.Omit:
            case SchemaType.Partial:
            case SchemaType.Overwrite:
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
     * @param value - value to be validated
     * @param unionProperties - validate 的 options 输出
     * @returns Return a shallow copy when prune occur, otherwise return the original value
     */
    validateAndPrune<T>(value: T, schemaOrId: string | TSBufferSchema): ValidatorOutput & { pruneOutput: T | undefined } {
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
            return ValidateResultUtil.succ;
        }
        else {
            return ValidateResultUtil.error(ErrorType.TypeError, 'boolean', type);
        }
    }

    private _validateNumberType(value: any, schema: NumberTypeSchema): ValidateResult {
        // 默认为double
        let scalarType = schema.scalarType || 'double';

        // Wrong Type
        let type = this._getTypeof(value);
        let rightType = scalarType.indexOf('big') > -1 ? 'bigint' : 'number';
        if (type !== rightType) {
            return ValidateResultUtil.error(ErrorType.TypeError, rightType, type);
        }

        // scalarType类型检测
        // 整形却为小数
        if (scalarType !== 'double' && type === 'number' && !Number.isInteger(value)) {
            return ValidateResultUtil.error(ErrorType.InvalidScalarType, value, scalarType);
        }
        // 无符号整形却为负数
        if (scalarType.indexOf('uint') > -1 && value < 0) {
            return ValidateResultUtil.error(ErrorType.InvalidScalarType, value, scalarType);
        }

        return ValidateResultUtil.succ;
    }

    private _validateStringType(value: any, schema: StringTypeSchema): ValidateResult {
        let type = this._getTypeof(value);
        return type === 'string' ? ValidateResultUtil.succ : ValidateResultUtil.error(ErrorType.TypeError, 'string', type);
    }

    private _validateArrayType(value: any, schema: ArrayTypeSchema, prune: ValidatePruneOptions | undefined): ValidateResult {
        // is Array type
        let type = this._getTypeof(value);
        if (type !== SchemaType.Array) {
            return ValidateResultUtil.error(ErrorType.TypeError, SchemaType.Array, type);
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
                return ValidateResultUtil.innerError('' + i, value[i], schema.elementType, elemValidateResult);
            }
        }

        return ValidateResultUtil.succ;
    }

    private _validateTupleType(value: any, schema: TupleTypeSchema, prune: ValidatePruneOptions | undefined): ValidateResult {
        // is Array type
        let type = this._getTypeof(value);
        if (type !== SchemaType.Array) {
            return ValidateResultUtil.error(ErrorType.TypeError, SchemaType.Array, type);
        }

        // validate length
        if (this.options.excessPropertyChecks && value.length > schema.elementTypes.length) {
            return ValidateResultUtil.error(ErrorType.TupleOverLength, value.length, schema.elementTypes.length);
        }

        // prune output
        if (prune) {
            prune.output = Array.from({ length: Math.min(value.length, schema.elementTypes.length) });
        }

        // validate elementType
        for (let i = 0; i < schema.elementTypes.length; ++i) {
            // MissingRequiredProperty: NotOptional && is undefined
            if (value[i] === undefined || value[i] === null && !this.options.strictNullChecks) {
                let isOptional = schema.optionalStartIndex !== undefined && i >= schema.optionalStartIndex || this._canBeUndefined(schema.elementTypes[i]);
                // skip undefined property
                if (isOptional) {
                    continue;
                }
                else {
                    return ValidateResultUtil.error(ErrorType.MissingRequiredProperty, i);
                }
            }

            // element type check
            let elemValidateResult = this._validate(value[i], schema.elementTypes[i], {
                prune: prune?.output ? {
                    parent: {
                        value: prune.output,
                        key: i
                    }
                } : undefined
            });
            if (!elemValidateResult.isSucc) {
                return ValidateResultUtil.innerError('' + i, value[i], schema.elementTypes[i], elemValidateResult);
            }
        }

        return ValidateResultUtil.succ;
    }

    private _canBeUndefined(schema: TSBufferSchema): boolean {
        if (schema.type === SchemaType.Union) {
            return schema.members.some(v => this._canBeUndefined(v.type))
        }

        if (schema.type === SchemaType.Literal && schema.literal === undefined) {
            return true;
        }

        return false;
    }

    private _validateEnumType(value: any, schema: EnumTypeSchema): ValidateResult {
        // must be string or number
        let type = this._getTypeof(value);
        if (type !== 'string' && type !== 'number') {
            return ValidateResultUtil.error(ErrorType.TypeError, 'string | number', type);
        }

        // 有值与预设相同
        if (schema.members.some(v => v.value === value)) {
            return ValidateResultUtil.succ;
        }
        else {
            return ValidateResultUtil.error(ErrorType.InvalidEnumValue, value);
        }
    }

    private _validateAnyType(value: any): ValidateResult {
        return ValidateResultUtil.succ;
    }

    private _validateLiteralType(value: any, schema: LiteralTypeSchema): ValidateResult {
        // 非 null undefined 严格模式，null undefined同等对待
        if (!this.options.strictNullChecks && (schema.literal === null || schema.literal === undefined)) {
            return value === null || value === undefined ?
                ValidateResultUtil.succ
                : ValidateResultUtil.error(ErrorType.InvalidLiteralValue, schema.literal, value);
        }

        return value === schema.literal ?
            ValidateResultUtil.succ
            : ValidateResultUtil.error(ErrorType.InvalidLiteralValue, schema.literal, value);
    }

    private _validateNonPrimitiveType(value: any, schema: NonPrimitiveTypeSchema): ValidateResult {
        let type = this._getTypeof(value);
        return type === 'Object' ? ValidateResultUtil.succ : ValidateResultUtil.error(ErrorType.TypeError, 'Object', type);
    }

    private _validateInterfaceType(value: any, schema: InterfaceTypeSchema | InterfaceReference, unionProperties: string[] | undefined, prune: ValidatePruneOptions | undefined): ValidateResult {
        let type = this._getTypeof(value);
        if (type !== 'Object') {
            return ValidateResultUtil.error(ErrorType.TypeError, 'Object', type);
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
        if (parsed.type === SchemaType.Interface) {
            return this._validateInterfaceType(value, schema, unionProperties, prune);
        }
        else if (parsed.type === SchemaType.Union) {
            return this._validateUnionType(value, parsed, unionProperties, prune);
        }
        throw new Error();
    }

    private _validateFlatInterface(value: any, schema: FlatInterfaceTypeSchema, prune: ValidatePruneOptions | undefined) {
        // interfaceSignature强制了key必须是数字的情况
        if (schema.indexSignature && schema.indexSignature.keyType === SchemaType.Number) {
            for (let key in value) {
                if (!this._isNumberKey(key)) {
                    return ValidateResultUtil.error(ErrorType.InvalidNumberKey, key);
                }
            }
        }

        if (prune) {
            prune.output = {};
        }

        // Excess property check
        if (this.options.excessPropertyChecks && !schema.indexSignature) {
            let validProperties = schema.properties.map(v => v.name);
            let firstExcessProperty = Object.keys(value).find(v => validProperties.indexOf(v) === -1);
            if (firstExcessProperty) {
                return ValidateResultUtil.error(ErrorType.ExcessProperty, firstExcessProperty);
            }
        }

        // 校验properties
        if (schema.properties) {
            for (let property of schema.properties) {
                // MissingRequiredProperty: is undefined && !isOptional
                if (value[property.name] === undefined || value[property.name] === null && !this.options.strictNullChecks) {
                    let isOptional = property.optional || this._canBeUndefined(property.type);
                    // skip undefined optional property
                    if (isOptional) {
                        continue;
                    }
                    else {
                        return ValidateResultUtil.error(ErrorType.MissingRequiredProperty, property.name);
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
                    return ValidateResultUtil.innerError(property.name, value[property.name], property.type, vRes);
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
                    return ValidateResultUtil.innerError(key, value[key], schema.indexSignature.type, vRes);
                }
            }
        }

        return ValidateResultUtil.succ;
    }

    private _validateBufferType(value: any, schema: BufferTypeSchema): ValidateResult {
        let type = this._getTypeof(value);
        if (type !== 'Object') {
            return ValidateResultUtil.error(ErrorType.TypeError, schema.arrayType || 'ArrayBuffer', type);
        }
        else if (schema.arrayType) {
            let typeArrayClass = typedArrays[schema.arrayType];
            if (!typeArrayClass) {
                throw new Error(`Error TypedArray type: ${schema.arrayType}`);
            }
            return value instanceof typeArrayClass ? ValidateResultUtil.succ : ValidateResultUtil.error(ErrorType.TypeError, schema.arrayType, value?.constructor?.name);
        }
        else {
            return value instanceof ArrayBuffer ? ValidateResultUtil.succ : ValidateResultUtil.error(ErrorType.TypeError, 'ArrayBuffer', value?.constructor?.name);
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
        let memberErrors: ValidateResultError[] = [];
        for (let i = 0; i < schema.members.length; ++i) {
            let member = schema.members[i];
            let memberType = this.protoHelper.isTypeReference(member.type) ? this.protoHelper.parseReference(member.type) : member.type;
            let memberPrune: ValidatePruneOptions | undefined = prune ? {} : undefined;
            let vRes: ValidateResult = this._validate(value, memberType, {
                unionProperties: unionProperties,
                prune: memberPrune
            });

            if (vRes.isSucc) {
                isSomeSucc = true;

                // if prune object: must prune all members
                if (isObjectPrune) {
                    Object.assign(prune!.output, memberPrune!.output);
                }
                // not prune object: stop checking after 1st member matched
                else {
                    break;
                }
            }
            else {
                memberErrors.push(vRes);
            }
        }

        // 有一成功则成功;
        if (isSomeSucc) {
            return ValidateResultUtil.succ
        }
        // 全部失败，则失败
        else {
            // All member error is the same, return the first
            let msg0 = memberErrors[0].errMsg;
            if (memberErrors.every(v => v.errMsg === msg0)) {
                return memberErrors[0];
            }

            // mutual exclusion: return the only one
            let nonLiteralErrors = memberErrors.filter(v => v.error.type !== ErrorType.InvalidLiteralValue);
            if (nonLiteralErrors.length === 1) {
                return nonLiteralErrors[0];
            }

            // All member error without inner: show simple msg
            if (memberErrors.every(v => !v.error.inner && (v.error.type === ErrorType.TypeError || v.error.type === ErrorType.InvalidLiteralValue))) {
                let valueType = this._getTypeof(value);
                let expectedTypes = memberErrors.map(v => v.error.type === ErrorType.TypeError ? v.error.params[0] : this._getTypeof(v.error.params[0])).distinct();

                // Expected type A|B|C, actually type D
                if (expectedTypes.indexOf(valueType) === -1) {
                    return ValidateResultUtil.error(ErrorType.TypeError, expectedTypes.join(' | '), this._getTypeof(value))
                }

                // `'D'` is not matched to `'A'|'B'|'C'`
                if (valueType !== 'Object' && valueType !== SchemaType.Array) {
                    let types = memberErrors.map(v => v.error.type === ErrorType.TypeError ? v.error.params[0] : stringify(v.error.params[0])).distinct();
                    return ValidateResultUtil.error(ErrorType.UnionTypesNotMatch, value, types);
                }
            }

            // other errors
            return ValidateResultUtil.error(ErrorType.UnionMembersNotMatch, memberErrors);
        }
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

            // 有一失败则失败
            if (!vRes.isSucc) {
                return vRes;
            }

            if (isObjectPrune) {
                Object.assign(prune!.output, memberPrune!.output);
            }
        }

        // 全成功则成功
        return ValidateResultUtil.succ;
    }

    private _isNumberKey(key: string): boolean {
        let int = parseInt(key);
        return !(isNaN(int) || ('' + int) !== key);
    }

    private _getTypeof(value: any): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "Object" | "function" | "Array" | "null" {
        let type = typeof value;
        if (type === 'object') {
            if (value === null) {
                return 'null';
            }
            else if (Array.isArray(value)) {
                return SchemaType.Array;
            }
            else {
                return 'Object';
            }
        }

        return type;
    }
}

/** @public */
export type ValidatorOutput = { isSucc: true, errMsg?: undefined } | { isSucc: false, errMsg: string };