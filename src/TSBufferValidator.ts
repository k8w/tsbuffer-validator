import { TSBufferSchema, TSBufferProto } from 'tsbuffer-schema';
import { BooleanTypeSchema } from 'tsbuffer-schema/src/schemas/BooleanTypeSchema';
import { NumberTypeSchema } from 'tsbuffer-schema/src/schemas/NumberTypeSchema';
import { StringTypeSchema } from 'tsbuffer-schema/src/schemas/StringTypeSchema';
import { ArrayTypeSchema } from 'tsbuffer-schema/src/schemas/ArrayTypeSchema';
import { TupleTypeSchema } from 'tsbuffer-schema/src/schemas/TupleTypeSchema';
import { EnumTypeSchema } from 'tsbuffer-schema/src/schemas/EnumTypeSchema';
import { AnyTypeSchema } from 'tsbuffer-schema/src/schemas/AnyTypeSchema';
import { LiteralTypeSchema } from 'tsbuffer-schema/src/schemas/LiteralTypeSchema';
import { NonPrimitiveTypeSchema } from 'tsbuffer-schema/src/schemas/NonPrimitiveTypeSchema';
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

export interface TSBufferValidatorOptions {
    strictNullChecks: boolean
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

        return this.validateBySchema(value, schema, path);
    }

    validateBySchema(value: any, schema: TSBufferSchema, path: string): ValidateResult {
        switch (schema.type) {
            case 'Boolean':
                return this.validateBooleanType(value);
            case 'Number':
                return this.validateNumberType(value, schema);
            case 'String':
                return this.validateStringType(value);
            case 'Array':
                return this.validateArrayType(value, schema, path);
            case 'Tuple':
                return this.validateTupleType(value, schema, path);
            case 'Enum':
                return this.validateEnumType(value, schema);
            case 'Any':
                return this.validateAnyType(value);
            case 'Literal':
                return this.validateLiteralType(value, schema);
            case 'NonPrimitive':
                return this.validateNonPrimitiveType(value);
            case 'Interface':
                return this.validateInterfaceType(value, schema, path);
            case 'Buffer':
                return this.validateBufferType(value, schema, path);
            case 'IndexedAccess':
                return this.validateIndexedAccessType(value, schema, path);
            case 'Reference':
                return this.validateReferenceType(value, schema, path);
            case 'Union':
                return this.validateUnionType(value, schema, path);
            case 'Intersection':
                return this.validateIntersectionType(value, schema, path);
            case 'Pick':
                return this.validatePickType(value, schema, path);
            case 'Partial':
                return this.validatePartialType(value, schema, path);
            case 'Omit':
                return this.validateOmitType(value, schema, path);
            case 'Overwrite':
                return this.validateOverwriteType(value, schema, path);
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

    validateArrayType(value: any, schema: ArrayTypeSchema, path: string): ValidateResult {
        // is Array type
        if (!Array.isArray(value)) {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // validate elementType
        for (let i = 0; i < value.length; ++i) {
            let elemValidateResult = this.validateBySchema(value[i], schema.elementType, path);
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InvalidArrayElement, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.success;
    }

    validateTupleType(value: any, schema: TupleTypeSchema, path: string): ValidateResult {
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
            let elemValidateResult = this.validateBySchema(value[i], schema.elementTypes[i], path);
            if (!elemValidateResult.isSucc) {
                return ValidateResult.error(ValidateErrorCode.InvalidTupleElement, '' + i, elemValidateResult);
            }
        }

        return ValidateResult.success;
    }

    validateEnumType(value: any, schema: EnumTypeSchema): ValidateResult {
        // must be string or number
        if (typeof value !== 'string' || typeof value !== 'number') {
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
        return typeof value === 'object' ? ValidateResult.success : ValidateResult.error(ValidateErrorCode.WrongType);
    }

    validateInterfaceType(value: any, schema: InterfaceTypeSchema, path: string): ValidateResult {
        if (typeof value !== 'object') {
            return ValidateResult.error(ValidateErrorCode.WrongType);
        }

        // interfaceSignature强制了key必须是数字的情况
        if (schema.indexSignature && schema.indexSignature.keyType === 'Number') {
            for (let key in value) {
                if (!/\d+/.test(key)) {
                    return ValidateResult.error(ValidateErrorCode.InvalidInterfaceMember, key, ValidateResult.error(ValidateErrorCode.InvalidNumberKey))
                }
            }
        }

        // 确保每个字段不重复检测
        // 作为一个透传的参数在各个方法间共享传递
        let skipFields: string[] = [];

        // 先校验properties
        if (schema.properties) {
            let vRes = this._validateInterfaceProperties(value, schema.properties, path, skipFields);
            if (!vRes.isSucc) {
                return vRes;
            }
        }

        // 再检测extends
        if (schema.extends) {
            for (let i = 0; i < schema.extends.length; ++i) {
                // extends检测 允许未知的 跳过已检测的字段
                let vRes = this._validateInterfaceExtends(value, schema.extends[i], path, skipFields);
                if (!vRes.isSucc) {
                    return vRes;
                }
            }
        }

        // 最后检测indexSignature
        return this._validateInterfaceIndexSignature(value, schema.indexSignature, path, skipFields);
    }

    /**
     * 检测value中的字段是否满足properties
     * 注意：这个方法允许properties中未定义的字段存在！
     * @return interface的error
     */
    private _validateInterfaceProperties(value: any, properties: NonNullable<InterfaceTypeSchema['properties']>, path: string, skipFields: string[]): ValidateResult {
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

            let vRes = this.validateBySchema(value[property.name], property.type, path);
            if (!vRes) {
                return ValidateResult.error(ValidateErrorCode.InvalidInterfaceMember, property.name, vRes)
            }
        }

        return ValidateResult.success;
    }

    /**
     * 递归检测extends
     * 不检测额外超出的字段
     * @reutrn interface的error
     */
    private _validateInterfaceExtends(value: any, extendsSchema: ReferenceTypeSchema, path: string, skipFields: string[]): ValidateResult {
        // 解析引用
        let parsedSchema = this._parseReference(extendsSchema, path);
        let schema = parsedSchema.schema;
        let schemaPath = parsedSchema.path;
        if (schema.type !== 'Interface') {
            return ValidateResult.error(ValidateErrorCode.ExtendsMustBeInterface);
        }

        // 递归检查extends的extends
        if (schema.extends) {
            for (let exSchema of schema.extends) {
                let vRes = this._validateInterfaceExtends(value, exSchema, schemaPath, skipFields);
                if (!vRes) {
                    return vRes;
                }
            }
        }

        // 检查本extends的properties
        if (schema.properties) {
            let vRes = this._validateInterfaceProperties(value, schema.properties, schemaPath, skipFields);
            if (!vRes) {
                return vRes;
            }
        }

        return this._validateInterfaceIndexSignature(value, schema.indexSignature, schemaPath, skipFields);
    }

    private _validateInterfaceIndexSignature(value: any, indexSignature: InterfaceTypeSchema['indexSignature'], path: string, skipFields: string[]) {
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
                    let vRes = this.validateBySchema(value[field], indexSignature.type, path);
                    if (!vRes.isSucc) {
                        return ValidateResult.error(ValidateErrorCode.InvalidInterfaceMember, vRes.fieldName || '', vRes);
                    }
                }
            }
            // Unexpected field
            else {
                return ValidateResult.error(ValidateErrorCode.InvalidInterfaceMember, remainedFields[0], ValidateResult.error(ValidateErrorCode.UnexpectedField))
            }
        }

        return ValidateResult.success;
    }

    /** 将ReferenceTYpeSchema层层转换为它最终实际引用的类型 */
    private _parseReference(schema: ReferenceTypeSchema, path: string): {
        schema: Exclude<TSBufferSchema, ReferenceTypeSchema>, path: string
    } {
        path = schema.path || path;
        if (path && !this._proto[path]) {
            throw new Error('Cannot find path: ' + path);
        }

        let parsedSchema = this._proto[path][schema.targetName];
        if (!parsedSchema) {
            throw new Error(`Cannot find [${schema.targetName}] at ${path}`);
        }

        if (parsedSchema.type === 'Reference') {
            return this._parseReference(parsedSchema, path);
        }
        else {
            return {
                schema: parsedSchema,
                path: path
            }
        }
    }

    validateBufferType(value: any, schema: BufferTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateIndexedAccessType(value: any, schema: IndexedAccessTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateReferenceType(value: any, schema: ReferenceTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateUnionType(value: any, schema: UnionTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateIntersectionType(value: any, schema: IntersectionTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validatePickType(value: any, schema: PickTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validatePartialType(value: any, schema: PartialTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateOmitType(value: any, schema: OmitTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateOverwriteType(value: any, schema: OverwriteTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

}