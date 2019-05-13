import { TSBufferSchema, TSBufferProto } from 'tsbuffer-schema';
import { NumberTypeSchema } from 'tsbuffer-schema/src/schemas/NumberTypeSchema';
import { ArrayTypeSchema } from 'tsbuffer-schema/src/schemas/ArrayTypeSchema';
import { TupleTypeSchema } from 'tsbuffer-schema/src/schemas/TupleTypeSchema';
import { EnumTypeSchema } from 'tsbuffer-schema/src/schemas/EnumTypeSchema';
import { LiteralTypeSchema } from 'tsbuffer-schema/src/schemas/LiteralTypeSchema';
import { InterfaceTypeSchema } from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import { BufferTypeSchema } from 'tsbuffer-schema/src/schemas/BufferTypeSchema';
import { IndexedAccessTypeSchema } from 'tsbuffer-schema/src/schemas/IndexedAccessTypeSchema';
import { ReferenceTypeSchema } from 'tsbuffer-schema/src/schemas/ReferenceTypeSchema';
import { UnionTypeSchema } from 'tsbuffer-schema/src/schemas/UnionTypeSchema';
import { IntersectionTypeSchema } from 'tsbuffer-schema/src/schemas/IntersectionTypeSchema';
import { PickTypeSchema } from 'tsbuffer-schema/src/schemas/PickTypeSchema';
import { PartialTypeSchema } from 'tsbuffer-schema/src/schemas/PartialTypeSchema';
import { OmitTypeSchema } from 'tsbuffer-schema/src/schemas/OmitTypeSchema';
import { OverwriteTypeSchema } from 'tsbuffer-schema/src/schemas/OverwriteTypeSchema';
import { ValidateResult, ValidateErrorCode } from './ValidateResult';
import { InterfaceReference } from 'tsbuffer-schema/src/InterfaceReference';
import { TypeReference } from 'tsbuffer-schema/src/TypeReference';

export interface TSBufferValidatorOptions {
    strictNullChecks: boolean
}

const typedArrays = {
    Int8Array: Int8Array,
    Int16Array: Int16Array,
    Int32Array: Int32Array,
    BigInt64Array: BigInt64Array,
    Uint8Array: Uint8Array,
    Uint16Array: Uint16Array,
    Uint32Array: Uint32Array,
    BigUint64Array: BigUint64Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array
}

export class TSBufferValidator {

    _options: TSBufferValidatorOptions = {
        strictNullChecks: true
    }

    private _proto: TSBufferProto;
    constructor(proto: TSBufferProto, options?: Partial<TSBufferValidatorOptions>) {
        this._proto = proto;
        if (options) {
            Object.assign(this._options, options);
        }
    }

    validate(value: any, path: string, symbolName: string): ValidateResult {
        //获取Schema
        if (!this._proto[path]) {
            throw new Error(`Cannot find path: ${path}`);
        }
        let schema: TSBufferSchema = this._proto[path][symbolName];
        if (!schema) {
            throw new Error(`Cannot find schema [${symbolName}] at ${path}`);
        }

        return this.validateBySchema(value, schema);
    }

    validateBySchema(value: any, schema: TSBufferSchema): ValidateResult {
        switch (schema.type) {
            case 'Boolean':
                return this.validateBooleanType(value);
            case 'Number':
                return this.validateNumberType(value, schema);
            case 'String':
                return this.validateStringType(value);
            case 'Array':
                return this.validateArrayType(value, schema);
            case 'Tuple':
                return this.validateTupleType(value, schema);
            case 'Enum':
                return this.validateEnumType(value, schema);
            case 'Any':
                return this.validateAnyType(value);
            case 'Literal':
                return this.validateLiteralType(value, schema);
            case 'NonPrimitive':
                return this.validateNonPrimitiveType(value);
            case 'Interface':
                return this.validateInterfaceType(value, schema);
            case 'Buffer':
                return this.validateBufferType(value, schema);
            case 'IndexedAccess':
                return this.validateIndexedAccessType(value, schema);
            case 'Reference':
                return this.validateReferenceType(value, schema);
            case 'Union':
                return this.validateUnionType(value, schema);
            case 'Intersection':
                return this.validateIntersectionType(value, schema);
            case 'Pick':
            case 'Partial':
            case 'Omit':
            case 'Overwrite':
                return this.validateMappedType(value, schema);
            // 错误的type
            default:
                throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
    }

    validateBooleanType(value: any): ValidateResult {
        if (typeof value === 'boolean') {
            return ValidateResult.success;
        }
        else {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }
    }

    validateNumberType(value: any, schema: NumberTypeSchema): ValidateResult {
        // Wrong Type
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 默认为double
        let scalarType = schema.scalarType || 'double';

        // scalarType类型检测
        // 整形却为小数
        if (scalarType !== 'float' && scalarType !== 'double' && typeof value === 'number' && value !== (value | 0)) {
            return ValidateResult.error(ValidateErrorCode.InvalidInteger);
        }
        // 无符号整形却为负数
        if ((scalarType.indexOf('uint') === 0 || scalarType.indexOf('fixed') === 0)
            && value < 0
        ) {
            return ValidateResult.error(ValidateErrorCode.InvalidUnsignedNumber);
        }
        // 不是bigint却为bigint
        if (scalarType.indexOf('64') === -1 && typeof value === 'bigint') {
            return ValidateResult.error(ValidateErrorCode.CantBeBigInt);
        }

        return ValidateResult.success;
    }

    validateStringType(value: any): ValidateResult {
        return typeof value === 'string' ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    validateArrayType(value: any, schema: ArrayTypeSchema): ValidateResult {
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

    validateTupleType(value: any, schema: TupleTypeSchema): ValidateResult {
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
            let elemValidateResult = this.validateBySchema(value[i], schema.elementTypes[i]);
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.success;
    }

    validateEnumType(value: any, schema: EnumTypeSchema): ValidateResult {
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

    validateAnyType(value: any): ValidateResult {
        return ValidateResult.success;
    }

    validateLiteralType(value: any, schema: LiteralTypeSchema): ValidateResult {
        return value === schema.literal ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.InvalidLiteralValue);
    }

    validateNonPrimitiveType(value: any): ValidateResult {
        return typeof value === 'object' && value !== null ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    validateInterfaceType(value: any, schema: InterfaceTypeSchema): ValidateResult {
        if (typeof value !== 'object') {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // 先展平
        schema = this._flattenInterface(schema);

        // interfaceSignature强制了key必须是数字的情况
        if (schema.indexSignature && schema.indexSignature.keyType === 'Number') {
            for (let key in value) {
                if (!/\d+/.test(key)) {
                    return ValidateResult.error(ValidateErrorCode.InnerError, key, ValidateResult.error(ValidateErrorCode.InvalidNumberKey))
                }
            }
        }

        // 确保每个字段不重复检测
        // 作为一个透传的参数在各个方法间共享传递
        let skipFields: string[] = [];

        // 校验properties
        if (schema.properties) {
            let vRes = this._validateInterfaceProperties(value, schema.properties, skipFields);
            if (!vRes.isSucc) {
                return vRes;
            }
        }

        // 检测indexSignature
        if (schema.indexSignature) {
            let vRes = this._validateInterfaceIndexSignature(value, schema.indexSignature, skipFields);
            if (!vRes.isSucc) {
                return vRes;
            }
        }

        return ValidateResult.success;
    }

    /**
     * 检测value中的字段是否满足properties
     * 注意：这个方法允许properties中未定义的字段存在！
     * @return interface的error
     */
    private _validateInterfaceProperties(value: any, properties: NonNullable<InterfaceTypeSchema['properties']>, skipFields: string[]): ValidateResult {
        for (let property of properties) {
            // skipFields
            if (skipFields.indexOf(property.name) > -1) {
                continue;
            }
            skipFields.push(property.name);

            // optional
            if (property.optional && value[property.name] === undefined) {
                continue;
            }

            // required
            if (!property.optional && value[property.name] === undefined) {
                return ValidateResult.error(ValidateErrorCode.InnerError, property.name, ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
            }

            let vRes = this.validateBySchema(value[property.name], property.type);
            if (!vRes.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InnerError, property.name, vRes);
            }
        }

        return ValidateResult.success;
    }

    private _validateInterfaceIndexSignature(value: any, indexSignature: InterfaceTypeSchema['indexSignature'], skipFields: string[]) {
        let remainedFields = Object.keys(value).remove(v => skipFields.indexOf(v) > -1);
        if (remainedFields.length) {
            if (indexSignature) {
                for (let field of remainedFields) {
                    // skipFields
                    if (skipFields.indexOf(field) > -1) {
                        continue;
                    }
                    skipFields.push(field);

                    // validate each field
                    let vRes = this.validateBySchema(value[field], indexSignature.type);
                    if (!vRes.isSucc) {
                        return ValidateResult.error(ValidateErrorCode.InnerError, vRes.fieldName || '', vRes);
                    }
                }
            }
            // Unexpected field
            else {
                return ValidateResult.error(ValidateErrorCode.InnerError, remainedFields[0], ValidateResult.error(ValidateErrorCode.UnexpectedField))
            }
        }

        return ValidateResult.success;
    }

    /** 将ReferenceTYpeSchema层层转换为它最终实际引用的类型 */
    private _parseReference(schema: TypeReference): Exclude<TSBufferSchema, TypeReference> {
        if (schema.type === 'Reference') {
            if (!this._proto[schema.path]) {
                throw new Error('Cannot find path: ' + schema.path);
            }

            let parsedSchema = this._proto[schema.path][schema.targetName];
            if (!parsedSchema) {
                throw new Error(`Cannot find [${schema.targetName}] at ${schema.path}`);
            }

            if (this._isTypeReference(parsedSchema)) {
                return this._parseReference(parsedSchema);
            }
            else {
                return parsedSchema
            }
        }
        else if (schema.type === 'IndexedAccess') {
            if (!this._isInterfaceReference(schema.objectType)) {
                throw new Error(`Error objectType: ${schema.objectType.type}`);
            }

            // find prop item
            let flat = this.getFlatInterfaceSchema(schema.objectType);
            let propItem = flat.properties!.find(v => v.name === schema.index);
            if (!propItem) {
                throw new Error(`Error index: ${schema.index}`);
            }

            return this._isTypeReference(propItem.type) ? this._parseReference(propItem.type) : propItem.type;
        }

        throw new Error(`Type ${(schema as any).type} is not reference`);
    }

    validateBufferType(value: any, schema: BufferTypeSchema): ValidateResult {
        if (schema.arrayType) {
            if (!typedArrays[schema.arrayType]) {
                return ValidateResult.error(ValidateErrorCode.WrongType);
            }
            return value instanceof typedArrays[schema.arrayType] ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType)
        }
        else {
            return value instanceof ArrayBuffer ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
        }
    }

    validateIndexedAccessType(value: any, schema: IndexedAccessTypeSchema): ValidateResult {
        return this.validateBySchema(value, this._parseReference(schema));
    }

    validateReferenceType(value: any, schema: ReferenceTypeSchema): ValidateResult {
        return this.validateBySchema(value, this._parseReference(schema));
    }

    validateMappedType(value: any, schema: PickTypeSchema | PartialTypeSchema | OmitTypeSchema | OverwriteTypeSchema): ValidateResult {
        return this.validateInterfaceType(value, this._flattenMappedType(schema));
    }

    validateUnionType(value: any, schema: UnionTypeSchema): ValidateResult {
        throw new Error('TODO');

        // 对schema.members做处理，整理出field清单
        // 对member进行依次检查，对interface及其ref检查时，对多出的字段，若在field清单内，则不报错

        // for (let cond of schema.members) {
        //     let vRes = this.validateBySchema(value, cond.type);
        //     if (vRes) {
        //         return ValidateResult.success;
        //     }
        // }

        // return ValidateResult.error(ValidateErrorCode.NonConditionSatisfied);
    }

    validateIntersectionType(value: any, schema: IntersectionTypeSchema): ValidateResult {
        throw new Error('TODO');

        // for (let cond of schema.members) {
        //     if (cond.type.type === 'Interface' || this._isInterfaceReference(cond.type)) {
        //         let flat = this.getFlatInterfaceSchema(cond.type);
        //         // Intersection 每个部分检查（如果是Interface的）允许额外的字段
        //         if (!flat.indexSignature) {
        //             flat.indexSignature = {
        //                 keyType: 'String',
        //                 type: {
        //                     type: 'Any'
        //                 }
        //             }
        //         }
        //     }

        //     // let vRes = this.validateBySchema(value, cond.type);
        //     // if (vRes) {
        //     //     return ValidateResult.success;
        //     // }
        // }
    }

    private _isInterfaceReference(schema: TSBufferSchema): schema is InterfaceReference {
        if (this._isTypeReference(schema)) {
            let parsed = this._parseReference(schema);
            return this._isInterfaceReference(parsed);
        }
        else {
            return schema.type === 'Interface' ||
                schema.type === 'Pick' ||
                schema.type === 'Partial' ||
                schema.type === 'Omit' ||
                schema.type === 'Overwrite';
        }
    }

    private _isTypeReference(schema: TSBufferSchema): schema is TypeReference {
        return schema.type === 'Reference' || schema.type === 'IndexedAccess';
    }

    /**
     * 将interface及其引用转换为展平的schema
     */
    getFlatInterfaceSchema(schema: InterfaceTypeSchema | InterfaceReference): InterfaceTypeSchema {
        if (this._isTypeReference(schema)) {
            let parsed = this._parseReference(schema);
            if (parsed.type !== 'Interface') {
                throw new Error(`Cannot flatten non interface type: ${parsed.type}`);
            }
            return this.getFlatInterfaceSchema(parsed);
        }
        else if (schema.type === 'Interface') {
            return this._flattenInterface(schema);
        }
        else {
            return this._flattenMappedType(schema);
        }
    }

    // 展平interface
    private _flattenInterface(schema: InterfaceTypeSchema): InterfaceTypeSchema {
        let properties: {
            [name: string]: {
                optional?: boolean;
                type: TSBufferSchema;
            }
        } = {};
        let indexSignature: InterfaceTypeSchema['indexSignature'];

        // 自身定义的properties和indexSignature优先级最高
        if (schema.properties) {
            for (let prop of schema.properties) {
                properties[prop.name] = {
                    optional: prop.optional,
                    type: prop.type
                }
            }
        }
        if (schema.indexSignature) {
            indexSignature = schema.indexSignature;
        }

        // extends的优先级次之，补全没有定义的字段
        if (schema.extends) {
            for (let extendsRef of schema.extends) {
                // 解引用
                let parsedExtRef = this._parseReference(extendsRef);
                if (parsedExtRef.type !== 'Interface') {
                    throw new Error('SchemaError: extends must from interface but from ' + parsedExtRef.type)
                }
                // 递归展平extends
                let flatenExtendsSchema = this.getFlatInterfaceSchema(parsedExtRef);

                // properties
                if (flatenExtendsSchema.properties) {
                    for (let prop of flatenExtendsSchema.properties) {
                        if (!properties[prop.name]) {
                            properties[prop.name] = {
                                optional: prop.optional,
                                type: prop.type
                            }
                        }
                    }
                }

                // indexSignature
                if (flatenExtendsSchema.indexSignature && !indexSignature) {
                    indexSignature = flatenExtendsSchema.indexSignature;
                }
            }
        }

        return {
            type: 'Interface',
            properties: Object.entries(properties).map((v, i) => ({
                id: i,
                name: v[0],
                optional: v[1].optional,
                type: v[1].type
            })),
            indexSignature: indexSignature
        }
    }

    // 将MappedTypeSchema转换为展平的Interface
    private _flattenMappedType(schema: PickTypeSchema | PartialTypeSchema | OverwriteTypeSchema | OmitTypeSchema): InterfaceTypeSchema {
        // target 解引用
        let target: Exclude<PickTypeSchema['target'], ReferenceTypeSchema>;
        if (schema.target.type === 'Reference') {
            let parsed = this._parseReference(schema.target);
            target = parsed as typeof target;
        }
        else {
            target = schema.target;
        }

        // 内层仍然为MappedType 递归之
        if (target.type === 'Pick' || target.type === 'Partial' || target.type === 'Omit' || target.type === 'Overwrite') {
            return this._flattenMappedType(target);
        }
        // interface 展平之
        else if (target.type === 'Interface') {
            // target已展平
            target = this._flattenInterface(target);

            // 开始执行Mapped逻辑
            if (schema.type === 'Pick') {
                let properties: NonNullable<InterfaceTypeSchema['properties']> = [];
                for (let key of schema.keys) {
                    let propItem = target.properties!.find(v => v.name === key);
                    if (propItem) {
                        properties.push({
                            id: properties.length,
                            name: key,
                            optional: propItem.optional,
                            type: propItem.type
                        })
                    }
                    else if (target.indexSignature) {
                        properties.push({
                            id: properties.length,
                            name: key,
                            type: target.indexSignature.type
                        })
                    }
                    else {
                        throw new Error(`Cannot find pick key [${key}]`);
                    }
                }
                return {
                    type: 'Interface',
                    properties: properties
                }
            }
            else if (schema.type === 'Partial') {
                for (let v of target.properties!) {
                    v.optional = true;
                }
                return target;
            }
            else if (schema.type === 'Omit') {
                for (let key in schema.keys) {
                    target.properties!.removeOne(v => v.name === key);
                }
                return target;
            }
            else if (schema.type === 'Overwrite') {
                let overwrite = this.getFlatInterfaceSchema(schema.overwrite);
                if (overwrite.indexSignature) {
                    target.indexSignature = overwrite.indexSignature;
                }
                for (let prop of overwrite.properties!) {
                    target.properties!.removeOne(v => v.name === prop.name);
                    target.properties!.push(prop);
                }
                return target;
            }
            else {
                throw new Error(`Unknown type: ${(schema as any).type}`)
            }
        }
        else {
            throw new Error(`MappedType target cannot be ${(target as any).type} type`);
        }
    }

}