import { TSBufferProto, TSBufferSchema } from "tsbuffer-schema";
import { InterfaceTypeSchema } from "tsbuffer-schema/src/schemas/InterfaceTypeSchema";
import { TypeReference } from "tsbuffer-schema/src/TypeReference";
import { InterfaceReference } from "tsbuffer-schema/src/InterfaceReference";
import { PickTypeSchema } from "tsbuffer-schema/src/schemas/PickTypeSchema";
import { PartialTypeSchema } from "tsbuffer-schema/src/schemas/PartialTypeSchema";
import { OverwriteTypeSchema } from "tsbuffer-schema/src/schemas/OverwriteTypeSchema";
import { OmitTypeSchema } from "tsbuffer-schema/src/schemas/OmitTypeSchema";
import { ReferenceTypeSchema } from "tsbuffer-schema/src/schemas/ReferenceTypeSchema";

export default class ProtoHelper {

    private _proto: TSBufferProto;

    get proto(): TSBufferProto {
        return this._proto;
    }

    constructor(proto: TSBufferProto) {
        this._proto = proto;
    }

    /** 将ReferenceTYpeSchema层层转换为它最终实际引用的类型 */
    parseReference(schema: TSBufferSchema): Exclude<TSBufferSchema, TypeReference> {
        // Reference
        if (schema.type === 'Reference') {
            if (!this._proto[schema.path]) {
                throw new Error('Cannot find path: ' + schema.path);
            }

            let parsedSchema = this._proto[schema.path][schema.targetName];
            if (!parsedSchema) {
                throw new Error(`Cannot find [${schema.targetName}] at ${schema.path}`);
            }

            if (this.isTypeReference(parsedSchema)) {
                return this.parseReference(parsedSchema);
            }
            else {
                return parsedSchema
            }
        }
        // IndexedAccess
        else if (schema.type === 'IndexedAccess') {
            if (!this.isInterface(schema.objectType)) {
                throw new Error(`Error objectType: ${(schema.objectType as any).type}`);
            }

            // find prop item
            let flat = this.getFlatInterfaceSchema(schema.objectType);
            let propItem = flat.properties!.find(v => v.name === schema.index);
            let propType: TSBufferSchema;
            if (propItem) {
                propType = propItem.type;
            }
            else {
                if (flat.indexSignature) {
                    propType = flat.indexSignature.type;
                }
                else {
                    throw new Error(`Error index: ${schema.index}`);
                }
            }

            // optional -> | undefined
            if (propItem && propItem.optional &&    // 引用的字段是optional
                (propItem.type.type !== 'Union' // 自身不为Union
                    // 或自身为Union，但没有undefined成员条件
                    || propItem.type.members.findIndex(v => v.type.type === 'Literal' && v.type.literal === undefined) === -1)
            ) {
                propType = {
                    type: 'Union',
                    members: [
                        { id: 0, type: propType },
                        {
                            id: 1,
                            type: {
                                type: 'Literal',
                                literal: undefined
                            }
                        }
                    ]
                }
            }

            return this.isTypeReference(propType) ? this.parseReference(propType) : propType;
        }
        else {
            return schema;
        }
    }

    isInterface(schema: TSBufferSchema, excludeReference = false): schema is InterfaceTypeSchema | InterfaceReference {
        if (!excludeReference && this.isTypeReference(schema)) {
            let parsed = this.parseReference(schema);
            return this.isInterface(parsed, excludeReference);
        }
        else {
            return schema.type === 'Interface' ||
                schema.type === 'Pick' ||
                schema.type === 'Partial' ||
                schema.type === 'Omit' ||
                schema.type === 'Overwrite';
        }
    }

    isTypeReference(schema: TSBufferSchema): schema is TypeReference {
        return schema.type === 'Reference' || schema.type === 'IndexedAccess';
    }

    extendsUnionFields(unionFields: string[], schemas: TSBufferSchema[]): void {
        for (let i = 0, len = schemas.length; i < len; ++i) {
            let schema = schemas[i];
            if (this.isTypeReference(schema)) {
                schema = this.parseReference(schema)
            }

            // Interface及其Ref 加入interfaces
            if (this.isInterface(schema)) {
                let flat = this.getFlatInterfaceSchema(schema);
                flat.properties.forEach(v => {
                    if (unionFields.binarySearch(v.name) === -1) {
                        unionFields.binaryInsert(v.name);
                    }
                });

                if (flat.indexSignature) {
                    let is = `[[${flat.indexSignature.keyType}]]`;
                    if (unionFields.binarySearch(is) === -1) {
                        unionFields.binaryInsert(is);
                    }
                }
            }
            // Intersection/Union 递归合并unionFields
            else if (schema.type === 'Intersection' || schema.type === 'Union') {
                let sub = this.extendsUnionFields(unionFields, schema.members.map(v => v.type));
            }
        }
    }

    /**
     * 将interface及其引用转换为展平的schema
     */
    getFlatInterfaceSchema(schema: InterfaceTypeSchema | InterfaceReference): FlatInterfaceTypeSchema {
        if (this.isTypeReference(schema)) {
            let parsed = this.parseReference(schema);
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
    private _flattenInterface(schema: InterfaceTypeSchema): FlatInterfaceTypeSchema {
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
            for (let extend of schema.extends) {
                // 解引用
                let parsedExtRef = this.parseReference(extend.type);
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
    private _flattenMappedType(schema: PickTypeSchema | PartialTypeSchema | OverwriteTypeSchema | OmitTypeSchema): FlatInterfaceTypeSchema {
        // target 解引用
        let target: Exclude<PickTypeSchema['target'], ReferenceTypeSchema>;
        if (schema.target.type === 'Reference') {
            let parsed = this.parseReference(schema.target);
            target = parsed as typeof target;
        }
        else {
            target = schema.target;
        }

        let flatTarget: FlatInterfaceTypeSchema;
        // 内层仍然为MappedType 递归之
        if (target.type === 'Pick' || target.type === 'Partial' || target.type === 'Omit' || target.type === 'Overwrite') {
            flatTarget = this._flattenMappedType(target);
        }
        else if (target.type === 'Interface') {
            flatTarget = this._flattenInterface(target);
        }
        else {
            throw new Error(`Invalid target.type: ${target.type}`)
        }

        // 开始执行Mapped逻辑
        if (schema.type === 'Pick') {
            let properties: NonNullable<InterfaceTypeSchema['properties']> = [];
            for (let key of schema.keys) {
                let propItem = flatTarget.properties!.find(v => v.name === key);
                if (propItem) {
                    properties.push({
                        id: properties.length,
                        name: key,
                        optional: propItem.optional,
                        type: propItem.type
                    })
                }
                else if (flatTarget.indexSignature) {
                    properties.push({
                        id: properties.length,
                        name: key,
                        type: flatTarget.indexSignature.type
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
            for (let v of flatTarget.properties!) {
                v.optional = true;
            }
            return flatTarget;
        }
        else if (schema.type === 'Omit') {
            for (let key of schema.keys) {
                flatTarget.properties!.removeOne(v => v.name === key);
            }
            return flatTarget;
        }
        else if (schema.type === 'Overwrite') {
            let overwrite = this.getFlatInterfaceSchema(schema.overwrite);
            if (overwrite.indexSignature) {
                flatTarget.indexSignature = overwrite.indexSignature;
            }
            for (let prop of overwrite.properties!) {
                flatTarget.properties!.removeOne(v => v.name === prop.name);
                flatTarget.properties!.push(prop);
            }
            return flatTarget;
        }
        else {
            throw new Error(`Unknown type: ${(schema as any).type}`)
        }
    }

}

export interface FlatInterfaceTypeSchema {
    type: InterfaceTypeSchema['type'],
    properties: NonNullable<InterfaceTypeSchema['properties']>,
    indexSignature?: InterfaceTypeSchema['indexSignature']
}