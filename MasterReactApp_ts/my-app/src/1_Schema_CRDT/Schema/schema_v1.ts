import * as Y from 'yjs';
import { SchemaError } from '../../0_Meta/ErrorDefinition';
import { dataTypes,defaultVal,whatType } from '../../0_Meta/types';
import { getOrThrow } from '../../0_Meta/ErrorDefinition';
import { v4 as uuidv4 } from 'uuid';


// 
// We have as root the Y.Doc named SchemaCRDT, it contains the:
// 1. NodeTypes - containing the NodeTypes.
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


/**
 * Defines a schema for a graph database.
 * @param schemaDef A optional schema definition to start from in a JSON format.
 * @param doc FOR TESTS. The Y.Doc to use for the schema. If not provided, a new Y.Doc will be created. 
 */
export class Schema_v1 {
    private doc: Y.Doc;
    private nodeTypes: Y.Map<any>;
    private relationshipTypes: Y.Map<any>;
    private labels: Y.Map<any>;

    public get yjsDoc(): Y.Doc {
        return this.doc;
    }

    constructor(schemaDef?: SchemaDefinition, doc?: Y.Doc) {
        // a given doc is necessary for test purposes!
        this.doc = doc || new Y.Doc();
        this.nodeTypes = this.doc.getMap('nodeTypes');
        this.relationshipTypes = this.doc.getMap('relationshipTypes');
        this.labels = this.doc.getMap('labels');

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


    /**
     * Adds a new node type to the schema.
     * @param IdenifyingType - The identifying type of the node type.
     * @param labels - The labels of the node type. A set of uuids.
     * @param properties - The properties of the node type.
     * @param defa - The default values of the properties.
     */
    private addNodeType({ IdenifyingType, labels, properties, defa }: {IdenifyingType: string, labels: string[], properties: any, defa?: any}) {
        // cannot readd node types
        if (this.nodeTypes.has(IdenifyingType)) {
            throw new SchemaError('Type already exists');
        }
        const nodeTypeMap = new Y.Map<any>();
        const propertiesMap = new Y.Map<any>();

        const labelsMap = new Y.Map<string>();

        labels.forEach(label => {
            let foundUuid: string | null = null;
            this.labels.forEach((labelObj: Y.Map<any>, uuid: string) => {
                if (labelObj.get('name') === label) {
                    foundUuid = uuid;
                }
            });
            if (!foundUuid) {
                foundUuid = uuidv4();
                const labelObj = new Y.Map<any>();
                labelObj.set('name', label);
                this.labels.set(foundUuid, labelObj);
            }
            labelsMap.set(foundUuid, foundUuid);
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
    private dropNodeType(IdenifyingType: string) {
        this.nodeTypes.delete(IdenifyingType);
    }
    private getNodeType(IdenifyingType: string) {
        const nodeType = getOrThrow(this.nodeTypes.get(IdenifyingType), 'Node type not found');
        return nodeType;
    }
    public getNodeTypeJSON(IdenifyingType: string) {
        const nodeType = getOrThrow(this.nodeTypes.get(IdenifyingType), 'Node type not found');
        const rawJson = nodeType.toJSON();
        
        // Project labels
        const resolvedLabels: Record<string, string> = {};
        for (const uuid of Object.keys(rawJson.labels || {})) {
            const labelObj = this.labels.get(uuid);
            if (labelObj) {
                const name = labelObj.get('name');
                if (name) resolvedLabels[name] = name;
            }
        }
        rawJson.labels = resolvedLabels;


        return rawJson;
    }

    /**
     * Dynamically extracts all active distinct labels currently surviving in the CRDT schema.
     */
    public getAllNodeLabels(): Set<string> {
        const allLabels = new Set<string>();
        this.nodeTypes.forEach((nodeTypeMap: any) => {
            const labelsMap = nodeTypeMap.get('labels');
            if (labelsMap) {
                labelsMap.forEach((uuid: string) => {
                    const labelObj = this.labels.get(uuid);
                    if (labelObj) {
                        const name = labelObj.get('name');
                        if (name) allLabels.add(name);
                    }
                });
            }
        });
        return allLabels;
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
            let foundUuid: string | null = null;
            this.labels.forEach((labelObj: Y.Map<any>, uuid: string) => {
                if (labelObj.get('name') === label) {
                    foundUuid = uuid;
                }
            });
            if (!foundUuid) {
                foundUuid = uuidv4();
                const labelObj = new Y.Map<any>();
                labelObj.set('name', label);
                this.labels.set(foundUuid, labelObj);
            }
            labelsMap.set(foundUuid, foundUuid);
        });
    }

    private updateNodeType({IdenifyingType, labels, properties}: {IdenifyingType: string, labels: string[], properties: any}) {
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
    private addRelationshipType({IdenifyingEdge, sourceNodeLabel, targetNodeLabel, properties, defa}: {IdenifyingEdge: string, sourceNodeLabel: string, targetNodeLabel: string, properties: any, defa?: any}) {
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
    private deleteRelationshipType(IdenifyingEdge: string) {
        this.relationshipTypes.delete(IdenifyingEdge);
    }
    private getRelationshipType(IdenifyingEdge: string) {
        const relationshipType = getOrThrow(this.relationshipTypes.get(IdenifyingEdge), 'Relationship type not found');
        return relationshipType;
    }
    public getRelationshipTypeJSON(IdenifyingEdge: string) {
        const relationshipType = getOrThrow(this.relationshipTypes.get(IdenifyingEdge), 'Relationship type not found');
        return relationshipType.toJSON();
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

    private updateRelationshipType({IdenifyingLabel, sourceNodeLabel, targetNodeLabel, properties}: {IdenifyingLabel: string, sourceNodeLabel: string, targetNodeLabel: string, properties: any}) {
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

    // CREATE 
    public SMO_addNodeType(IdenifyingType: string, labels: string[], properties: any) {
        this.addNodeType({ IdenifyingType, labels, properties });
    }

    public SMO_addRelationshipType(IdenifyingEdge: string, sourceNodeLabel: string, targetNodeLabel: string, properties: any) {
        this.addRelationshipType({ IdenifyingEdge, sourceNodeLabel, targetNodeLabel, properties });
    }

    // DROP
    public SMO_dropNodeType(IdenifyingType: string) {
        this.dropNodeType(IdenifyingType);
    }

    public SMO_dropRelationshipType(IdenifyingEdge: string) {
        this.deleteRelationshipType(IdenifyingEdge);
    }

    // RENAME
    public SMO_renamePropertyKey({Idenifying, oldPropertyKey, newPropertyKey, whatType}: {Idenifying: string, oldPropertyKey: string, newPropertyKey: string, whatType: whatType } ) {
        let Type;
        if (whatType === "NodeType") {
            Type = this.getNodeType(Idenifying);
        } 
        else if (whatType === "RelationshipType") {
            Type = this.getRelationshipType(Idenifying);
        }
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        console.log(properties.get(oldPropertyKey), whatType, oldPropertyKey, properties.toJSON());
        const valueMap = getOrThrow(properties.get(oldPropertyKey), 'Property not found');
        this.doc.transact(() => {
            valueMap.set('name', newPropertyKey);
        });
    }

    public SMO_renameLabel(oldLabel: string, newLabel: string) {
        let found = false;
        this.doc.transact(() => {
            this.labels.forEach((labelObj: Y.Map<any>) => {
                if (labelObj.get('name') === oldLabel) {
                    labelObj.set('name', newLabel);
                    found = true;
                }
            });
        });
        if (!found) {
            throw new SchemaError('Label does not exist');
        }
    }

    // CHANGE - ADD | DROP | RETYPE
    public SMO_AddPropertyType({Idenifying, newProperty, defa, whatType}: {Idenifying: string, newProperty: {key: string, value: any}, defa?: any, whatType: whatType } ) {
        let Type;
        if (whatType === "NodeType") {
            Type = this.getNodeType(Idenifying);
        } 
        else if (whatType === "RelationshipType") {
            Type = this.getRelationshipType(Idenifying);
        }
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        // cannot readd the same Property
        if (properties.has(newProperty.key)) {
            throw new SchemaError('Property already exists');
        }
        const valueMap = new Y.Map<any>();
        const activeTypes = new Y.Map<any>();
        activeTypes.set(this.doc.clientID.toString(), {value: newProperty.value, default: defa});
        valueMap.set('activeTypes', activeTypes);
        valueMap.set('name', newProperty.key);
        this.doc.transact(() => {
            properties.set(newProperty.key, valueMap);
        });
    }

    public SMO_DropPropertyType({Idenifying, propertyKey, whatType}: {Idenifying: string, propertyKey: string, whatType: whatType } ) {
        let Type;
        if (whatType === "NodeType") {
            Type = this.getNodeType(Idenifying);
        } 
        else if (whatType === "RelationshipType") {
            Type = this.getRelationshipType(Idenifying);
        }
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        this.doc.transact(() => {
            properties.delete(propertyKey);
        });
    }

    public getPropertyTypeTags(Idenifying: string, propertyKey: string, whatType: whatType): string[] {
        const Type = whatType === "NodeType" 
            ? this.getNodeType(Idenifying) 
            : this.getRelationshipType(Idenifying);
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const propertyMap = getOrThrow(properties.get(propertyKey), 'Property map not found');
        const activeTypes = getOrThrow(propertyMap.get('activeTypes'), 'activeTypes map not found');
        return Array.from(activeTypes.keys());
    }
    public SMO_ChangePropertyType({Idenifying, propertyKey, oldTags, newPropertyType, defaultVal, whatType}: {Idenifying: string, propertyKey: string, oldTags: string[], newPropertyType: dataTypes, defaultVal: defaultVal, whatType: whatType } ) {
        const Type = whatType === "NodeType" 
            ? this.getNodeType(Idenifying) 
            : this.getRelationshipType(Idenifying);
        
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const propertyMap = getOrThrow(properties.get(propertyKey), 'Property map not found');
        const activeTypes = getOrThrow(propertyMap.get('activeTypes'), 'activeTypes map not found');
        
        this.doc.transact(() => {
            for (const tag of oldTags) {
                activeTypes.delete(tag);
            }
            activeTypes.set(this.doc.clientID.toString(), {value: newPropertyType, ...defaultVal});
        });
    }

    public getResolvedPropertyType(Idenifying: string, propertyKey: string, whatType: whatType): dataTypes {
        const Type = whatType === "NodeType" 
            ? this.getNodeType(Idenifying) 
            : this.getRelationshipType(Idenifying);
            
        const properties = getOrThrow(Type.get('properties'), 'Properties not found');
        const propertyMap = getOrThrow(properties.get(propertyKey), 'Property map not found');
        const activeTypesMap = getOrThrow(propertyMap.get('activeTypes'), 'activeTypes map not found');
        
        // Support both old string format and new object (PropertyLensMap) format
        const mapOrStringArray = Array.from(activeTypesMap.values());
        
        const survivingTypes = mapOrStringArray.map((item: any) => {
            if (typeof item === 'string') return item as dataTypes;
            // Assumes it follows PropertyLensMap interface structure
            return (item && item.value) ? item.value as dataTypes : 'string' as unknown as dataTypes;
        });

        if (survivingTypes.length === 0) return 'string' as unknown as dataTypes;
        if (survivingTypes.length === 1) return survivingTypes[0];

        if (survivingTypes.includes('number' as unknown as dataTypes)) {
            return 'number' as unknown as dataTypes; 
        }

        return survivingTypes[0];
    }

}