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

export class TSBufferValidator {

    private _proto: TSBufferProto;
    constructor(proto: TSBufferProto) {
        this._proto = proto;
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
                return this.validateEnumType(value, schema, path);
            case 'Any':
                return this.validateAnyType(value, schema, path);
            case 'Literal':
                return this.validateLiteralType(value, schema, path);
            case 'NonPrimitive':
                return this.validateNonPrimitiveType(value, schema, path);
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

        // scalarType类型检测
        if (schema.scalarType) {
            // 无符号数字却为负数
            if ((schema.scalarType.indexOf('uint') === 0 || schema.scalarType.indexOf('fixed') === 0)
                && value < 0
            ) {
                return ValidateResult.error(ValidateErrorCode.InvalidUnsignedNumber);
            }
            // 整形却为小数
            if (schema.scalarType !== 'float' && schema.scalarType !== 'double' && value !== (value | 0)) {
                return ValidateResult.error(ValidateErrorCode.InvalidInteger);
            }
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

    validateEnumType(value: any, schema: EnumTypeSchema, path: string): ValidateResult {
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

    validateAnyType(value: any, schema: AnyTypeSchema, path: string): ValidateResult {
        // 不能是ArrayBuffer或function
        if (value instanceof ArrayBuffer || typeof value === 'function') {
            return ValidateResult.error(ValidateErrorCode.AnyTypeCannotBeArrayBuffer);
        }

        // 不能是TypedArray
        if (value && value.buffer && value.buffer instanceof ArrayBuffer) {
            return ValidateResult.error(ValidateErrorCode.AnyTypeCannotBeTypedArray);
        }

        return ValidateResult.success;
    }

    validateLiteralType(value: any, schema: LiteralTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateNonPrimitiveType(value: any, schema: NonPrimitiveTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
    }

    validateInterfaceType(value: any, schema: InterfaceTypeSchema, path: string): ValidateResult {
        throw new Error('TODO');
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