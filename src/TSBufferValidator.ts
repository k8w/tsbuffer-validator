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

export type ValidateResult = { isSucc: true } | { isSucc: false, errMsg: string };

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

        switch (schema.type) {
            case 'Boolean':
                return this.validateBooleanType(value, schema, path, symbolName);
            case 'Number':
                return this.validateNumberType(value, schema, path, symbolName);
            case 'String':
                return this.validateStringType(value, schema, path, symbolName);
            case 'Array':
                return this.validateArrayType(value, schema, path, symbolName);
            case 'Tuple':
                return this.validateTupleType(value, schema, path, symbolName);
            case 'Enum':
                return this.validateEnumType(value, schema, path, symbolName);
            case 'Any':
                return this.validateAnyType(value, schema, path, symbolName);
            case 'Literal':
                return this.validateLiteralType(value, schema, path, symbolName);
            case 'NonPrimitive':
                return this.validateNonPrimitiveType(value, schema, path, symbolName);
            case 'Interface':
                return this.validateInterfaceType(value, schema, path, symbolName);
            case 'Buffer':
                return this.validateBufferType(value, schema, path, symbolName);
            case 'IndexedAccess':
                return this.validateIndexedAccessType(value, schema, path, symbolName);
            case 'Reference':
                return this.validateReferenceType(value, schema, path, symbolName);
            case 'Union':
                return this.validateUnionType(value, schema, path, symbolName);
            case 'Intersection':
                return this.validateIntersectionType(value, schema, path, symbolName);
            case 'Pick':
                return this.validatePickType(value, schema, path, symbolName);
            case 'Partial':
                return this.validatePartialType(value, schema, path, symbolName);
            case 'Omit':
                return this.validateOmitType(value, schema, path, symbolName);
            case 'Overwrite':
                return this.validateOverwriteType(value, schema, path, symbolName);
            // 错误的type
            default:
                throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
    }

    validateBooleanType(value: any, schema: BooleanTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateNumberType(value: any, schema: NumberTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateStringType(value: any, schema: StringTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateArrayType(value: any, schema: ArrayTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateTupleType(value: any, schema: TupleTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateEnumType(value: any, schema: EnumTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateAnyType(value: any, schema: AnyTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateLiteralType(value: any, schema: LiteralTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateNonPrimitiveType(value: any, schema: NonPrimitiveTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateInterfaceType(value: any, schema: InterfaceTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateBufferType(value: any, schema: BufferTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateIndexedAccessType(value: any, schema: IndexedAccessTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateReferenceType(value: any, schema: ReferenceTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateUnionType(value: any, schema: UnionTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateIntersectionType(value: any, schema: IntersectionTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validatePickType(value: any, schema: PickTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validatePartialType(value: any, schema: PartialTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateOmitType(value: any, schema: OmitTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

    validateOverwriteType(value: any, schema: OverwriteTypeSchema, path: string, symbolName: string): ValidateResult {
        throw new Error('TODO');
    }

}