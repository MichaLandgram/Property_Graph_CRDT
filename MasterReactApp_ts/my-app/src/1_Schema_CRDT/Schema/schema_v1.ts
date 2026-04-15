import * as Y from 'yjs';
import { SchemaError } from '../0_Helper/SchemaError';
import { dataTypes,whatToChange } from '../../0_Types/types';
import { getOrThrow } from '../0_Helper/SchemaError';


// 
// We have as root the Y.Doc named SchemaCRDT, it contains the:
// 1. NodeTypes - containing the NodeTypes.
        // 
// 2. RelationshipTypes - containing the RelationshipTypes.

export interface SchemaDefinition {
    nodes: Array<{
        identifyingType: string;
        labels: string[];
        properties: Record<string, string>;
    }>;
    relationships: Array<{
        identifyingEdge: string;
        sourceNodeLabel: string;
        targetNodeLabel: string;
        properties: Record<string, string>;
    }>;
}

export class Schema_v1 {
    private doc: Y.Doc;
    private nodeTypes: Y.Map<any>;
    private relationshipTypes: Y.Map<any>;
    constructor(schemaDef?: SchemaDefinition, doc?: Y.Doc) {
        // a given doc is necessary for test purposes!
        this.doc = doc || new Y.Doc();
        this.nodeTypes = this.doc.getMap('nodeTypes');
        this.relationshipTypes = this.doc.getMap('relationshipTypes');

        if (schemaDef) {
            this.doc.transact(() => {
                schemaDef.nodes?.forEach(node => {
                    this.addNodeType({IdenifyingType: node.identifyingType, labels: node.labels, properties: node.properties});
                });
                schemaDef.relationships?.forEach(rel => {
                    this.addRelationshipType({IdenifyingEdge: rel.identifyingEdge, sourceNodeLabel: rel.sourceNodeLabel, targetNodeLabel: rel.targetNodeLabel, properties: rel.properties});
                });
            });
        }
    }
    /*
        NODETYPE Basic Operations
        add, drop, update, get
    */
    public addNodeType({ IdenifyingType, labels, properties, defa }: {IdenifyingType: string, labels: string[], properties: any, defa?: any}) {
        // cannot readd node types
        if (this.nodeTypes.has(IdenifyingType)) {
            throw new SchemaError('Type already exists');
        }
        const nodeTypeMap = new Y.Map<any>();
        const labelsMap = new Y.Map<string>();
        const propertiesMap = new Y.Map<any>();


        labels.forEach(label => {
            labelsMap.set(label, label);
        });
        for (const [key, value] of Object.entries(properties)) {
            const valueMap = new Y.Map<any>();
            const activeTypes = new Y.Map<any>();
            activeTypes.set(this.doc.clientID.toString(), {value: value, default: defa});
            valueMap.set('activeTypes', activeTypes);
            valueMap.set('name', key);
            propertiesMap.set(key, valueMap);
        }

        this.doc.transact(() => {
            nodeTypeMap.set('labels', labelsMap);
            nodeTypeMap.set('properties', propertiesMap);
            this.nodeTypes.set(IdenifyingType, nodeTypeMap);
        });
    }
    public dropNodeType(IdenifyingType: string) {
        this.nodeTypes.delete(IdenifyingType);
    }
    public getNodeType(IdenifyingType: string) {
        const nodeType = getOrThrow(this.nodeTypes.get(IdenifyingType), 'Node type not found');
        return nodeType;
    }

    private updateNodeProps(IdenifyingType: string, properties: any, defa?: any) {
        const nodeTypeMap = this.nodeTypes.get(IdenifyingType);
        if (!nodeTypeMap) {
            throw new Error('Node type not found');
        }
        const labelsArray = nodeTypeMap.get('labels');
        if (!labelsArray) {
            throw new Error('Node type labels not found');
        }
        const propertiesMap = nodeTypeMap.get('properties');
        if (!propertiesMap) {
            throw new Error('Node type properties not found');
        }
        for (const [key, value] of Object.entries(properties)) {
            let valueMap = propertiesMap.get(key);
            if (!valueMap) {
                valueMap = new Y.Map<any>();
                valueMap.set('name', key);
                const activeTypes = new Y.Map<any>();
                activeTypes.set(this.doc.clientID.toString(), {value: value, default: defa});
                valueMap.set('activeTypes', activeTypes);
                propertiesMap.set(key, valueMap);
            } else {
                const activeTypes = getOrThrow(valueMap.get('activeTypes'), 'activeTypes map not found');
                activeTypes.set(this.doc.clientID.toString(), value);
            }
        }
    }
    private updateNodeLabels(IdenifyingType: string, labels: string[]) {
        const nodeTypeMap = this.nodeTypes.get(IdenifyingType);
        if (!nodeTypeMap) {
            throw new Error('Node type not found');
        }
        const labelsMap = nodeTypeMap.get('labels');
        if (!labelsMap) {
            throw new Error('Node type labels not found');
        }
        labels.forEach(label => {
            labelsMap.set(label, label);
        });
    }

    public updateNodeType({IdenifyingType, labels, properties}: {IdenifyingType: string, labels: string[], properties: any}) {
        this.doc.transact(() => {
            if (labels) {
                this.updateNodeLabels(IdenifyingType, labels);
            }
            if (properties) {
                this.updateNodeProps(IdenifyingType, properties);
            }
        });
    }

    /*
        RELATIONSHIPTYPE basic operations
        add, drop, update, get
    */
    public addRelationshipType({IdenifyingEdge, sourceNodeLabel, targetNodeLabel, properties, defa}: {IdenifyingEdge: string, sourceNodeLabel: string, targetNodeLabel: string, properties: any, defa?: any}) {
        // cannot readd relationship types
        if (this.relationshipTypes.has(IdenifyingEdge)) {
            throw new SchemaError('Type already exists');
        }
        const relationshipTypeMap = new Y.Map<any>();
        const propertiesMap = new Y.Map<any>();
        for (const [key, value] of Object.entries(properties)) {
            const valueMap = new Y.Map<any>();
            const activeTypes = new Y.Map<any>();
            activeTypes.set(this.doc.clientID.toString(), {value: value, default: defa});
            valueMap.set('activeTypes', activeTypes);
            valueMap.set('name', key);
            propertiesMap.set(key, valueMap);
        }
        this.doc.transact(() => {
            relationshipTypeMap.set('properties', propertiesMap);
            relationshipTypeMap.set('sourceNodeLabel', sourceNodeLabel);
            relationshipTypeMap.set('targetNodeLabel', targetNodeLabel);

            this.relationshipTypes.set(IdenifyingEdge, relationshipTypeMap);
        });
    }
    public deleteRelationshipType(IdenifyingEdge: string) {
        this.relationshipTypes.delete(IdenifyingEdge);
    }
    public getRelationshipType(IdenifyingEdge: string) {
        const relationshipType = this.relationshipTypes.get(IdenifyingEdge);
        if (!relationshipType) {
            throw new SchemaError('Relationship type not found');
        }
        return relationshipType;
    }

    private updateRelationshipProperties(IdenifyingLabel: string, properties: any) {
        const relationshipType = this.relationshipTypes.get(IdenifyingLabel);
        if (!relationshipType) {
            throw new Error('Relationship type not found');
        }
        const propertiesMap = relationshipType.get('properties');
        if (!propertiesMap) {
            throw new Error('Relationship type properties not found');
        }
        for (const [key, value] of Object.entries(properties)) {
            let valueMap = propertiesMap.get(key);
            if (!valueMap) {
                valueMap = new Y.Map<any>();
                valueMap.set('name', key);
                const activeTypes = new Y.Map<any>();
                activeTypes.set(this.doc.clientID.toString(), value);
                valueMap.set('activeTypes', activeTypes);
                propertiesMap.set(key, valueMap);
            } else {
                const activeTypes = getOrThrow(valueMap.get('activeTypes'), 'activeTypes map not found');
                activeTypes.set(this.doc.clientID.toString(), value);
            }
        }

    }
    private updateRelationshipSourceNodeLabel(IdenifyingLabel: string, sourceNodeLabel: string) {
        const relationshipType = this.relationshipTypes.get(IdenifyingLabel);
        if (!relationshipType) {
            throw new Error('Relationship type not found');
        }
        relationshipType.set('sourceNodeLabel', sourceNodeLabel);
    }
    private updateRelationshipTargetNodeLabel(IdenifyingLabel: string, targetNodeLabel: string) {
        const relationshipType = this.relationshipTypes.get(IdenifyingLabel);
        if (!relationshipType) {
            throw new Error('Relationship type not found');
        }
        relationshipType.set('targetNodeLabel', targetNodeLabel);
    }

    public updateRelationshipType({IdenifyingLabel, sourceNodeLabel, targetNodeLabel, properties}: {IdenifyingLabel: string, sourceNodeLabel: string, targetNodeLabel: string, properties: any}) {
        this.doc.transact(() => {
            if (sourceNodeLabel) {
                this.updateRelationshipSourceNodeLabel(IdenifyingLabel, sourceNodeLabel);
            }
            if (targetNodeLabel) {
                this.updateRelationshipTargetNodeLabel(IdenifyingLabel, targetNodeLabel);
            }
            if (properties) {
                this.updateRelationshipProperties(IdenifyingLabel, properties);
            }
    });
    }
    public transformToJSONCleanSchema(){
        const jsonSchema = this.doc.toJSON();
        delete jsonSchema.identifyingTypeIndex;
        return jsonSchema;   
    }
    public transformToJSONFullSchema(){
        return this.doc.toJSON();   
    }







/*  
                Schema Modification Operations
*/


    public SMO_addNodeType(IdenifyingType: string, labels: string[], properties: any) {
        this.addNodeType({ IdenifyingType, labels, properties });
    }
    public SMO_dropNodeType(IdenifyingType: string) {
        this.dropNodeType(IdenifyingType);
    }
    public SMO_renamePropertyKey({Idenifying, oldPropertyKey, newPropertyKey, whatToChange}: {Idenifying: string, oldPropertyKey: string, newPropertyKey: string, whatToChange: whatToChange } ) {
        let Type;
        if (whatToChange === "NodeType") {
            Type = this.getNodeType(Idenifying);
        } 
        else if (whatToChange === "RelationshipType") {
            Type = this.getRelationshipType(Idenifying);
        }
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const valueMap = getOrThrow(properties.get(oldPropertyKey), 'Property not found');
        this.doc.transact(() => {
            valueMap.set('name', newPropertyKey);
        });
    }
    public SMO_renameLabel({Idenifying, oldLabel, newLabel, whatToChange}: {Idenifying: string, oldLabel: string, newLabel: string, whatToChange: whatToChange } ) {
        let Type;
        if (whatToChange === "NodeType") {
            Type = this.getNodeType(Idenifying);
            const labels = getOrThrow(Type.get('labels'), 'Labels not found');
            this.doc.transact(() => {
                labels.set(newLabel, newLabel);
            });
        } else if (whatToChange === "RelationshipType") {
            // do we support this? or do we just do a you have to add a new relationship type?
        }
    }
    public SMO_AddPropertyType({Idenifying, newProperty, defa, whatToChange}: {Idenifying: string, newProperty: {key: string, value: any}, defa?: any, whatToChange: whatToChange } ) {
        let Type;
        if (whatToChange === "NodeType") {
            Type = this.getNodeType(Idenifying);
        } 
        else if (whatToChange === "RelationshipType") {
            Type = this.getRelationshipType(Idenifying);
        }
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const valueMap = new Y.Map<any>();
        const activeTypes = new Y.Map<any>();
        activeTypes.set(this.doc.clientID.toString(), {value: newProperty.value, default: defa});
        valueMap.set('activeTypes', activeTypes);
        valueMap.set('name', newProperty.key);
        this.doc.transact(() => {
            properties.set(newProperty.key, valueMap);
        });
    }
    public SMO_DropPropertyType({Idenifying, propertyKey, whatToChange}: {Idenifying: string, propertyKey: string, whatToChange: whatToChange } ) {
        let Type;
        if (whatToChange === "NodeType") {
            Type = this.getNodeType(Idenifying);
        } 
        else if (whatToChange === "RelationshipType") {
            Type = this.getRelationshipType(Idenifying);
        }
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        this.doc.transact(() => {
            properties.delete(propertyKey);
        });
    }
    public SMO_ChangePropertyType({Idenifying, propertyKey, oldTags, newPropertyType, whatToChange}: {Idenifying: string, propertyKey: string, oldTags: string[], newPropertyType: dataTypes, whatToChange: whatToChange } ) {
        const Type = whatToChange === "NodeType" 
            ? this.getNodeType(Idenifying) 
            : this.getRelationshipType(Idenifying);
        
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const propertyMap = getOrThrow(properties.get(propertyKey), 'Property map not found');
        const activeTypes = getOrThrow(propertyMap.get('activeTypes'), 'activeTypes map not found');
        
        this.doc.transact(() => {
            for (const tag of oldTags) {
                activeTypes.delete(tag);
            }
            activeTypes.set(this.doc.clientID.toString(), newPropertyType);
        });
    }

    public getResolvedPropertyType(Idenifying: string, propertyKey: string, whatToChange: whatToChange): dataTypes {
        const Type = whatToChange === "NodeType" 
            ? this.getNodeType(Idenifying) 
            : this.getRelationshipType(Idenifying);
            
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const propertyMap = getOrThrow(properties.get(propertyKey), 'Property map not found');
        const activeTypesMap = getOrThrow(propertyMap.get('activeTypes'), 'activeTypes map not found');
        
        const survivingTypes = Array.from(activeTypesMap.values()) as dataTypes[];

        if (survivingTypes.length === 0) return 'string' as unknown as dataTypes;
        if (survivingTypes.length === 1) return survivingTypes[0];

        if (survivingTypes.includes('number' as unknown as dataTypes)) {
            return 'number' as unknown as dataTypes; 
        }

        return survivingTypes[0];
    }

}