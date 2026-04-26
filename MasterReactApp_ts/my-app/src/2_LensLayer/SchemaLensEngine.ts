import { Schema_v1 } from '../1_Schema_CRDT/Schema/schema_v1';
import { whatType, PropertyLensMap, dataTypes } from '../0_Types/types';
import { SchemaError } from '../1_Schema_CRDT/0_Helper/SchemaError';

// first DRAFT
export class SchemaLensEngine {
    private schemaCRDT: Schema_v1;
    // Cache the resolved JSON state to prevent expensive Yjs `.toJSON()` computations
    private cachedSchema: any | null = null;

    constructor(schemaCRDT: Schema_v1) {
        this.schemaCRDT = schemaCRDT;
        this.refreshCache(); // Initialize cache on startup

        // Automatically invalidate cache on upstream CRDT updates!
        this.schemaCRDT.yjsDoc.on('update', () => {
            this.cachedSchema = null;
        });
    }

    public refreshCache() {
        this.cachedSchema = this.schemaCRDT.transformToJSONCleanSchema();
    }

    public getPropertyLens(identifyingType: string, propertyKey: string, changeType: whatType): PropertyLensMap | undefined {
        if (!this.cachedSchema) this.refreshCache();

        const targetTypes = changeType === "NodeType" 
            ? this.cachedSchema.nodeTypes 
            : this.cachedSchema.relationshipTypes;

        if (!targetTypes || !targetTypes[identifyingType]) return undefined;

        const propertyMap = targetTypes[identifyingType].properties;
        if (!propertyMap || !propertyMap[propertyKey]) return undefined;

        const activeTypes = propertyMap[propertyKey].activeTypes;
        if (!activeTypes) return undefined;

        const activeValues = Object.values(activeTypes);
        if (activeValues.length === 0) return undefined;

        const rawLens = activeValues[0];

        if (typeof rawLens === 'string') {
            return { value: rawLens as dataTypes, default: rawLens };
        }

        return rawLens as PropertyLensMap;
    }


    public decodeStringFromGraph(identifyingType: string, propertyKey: string, rawString: string, changeType: whatType): any {
        const lens = this.getPropertyLens(identifyingType, propertyKey, changeType);
        if (!lens) {
            return rawString;
        }

        let toBeTranslatedString = rawString;

        if (lens.transformerMap) {
            if (lens.transformerMap[rawString] !== undefined) {
                toBeTranslatedString = lens.transformerMap[rawString];
            }
        } else {
            // 2. try to make an automatic transformation from the data
            // type the property is supposed to have
            // 3. if the auto transform fails -> use the lens.default value
            
        switch (lens.value) {
            case 'number': {
                const parsedNum = Number(toBeTranslatedString);
                // if the parsed number is not a number -> use the lens.default value
                return isNaN(parsedNum) ? lens.default : parsedNum;
            }
            case 'boolean': {
                
                if (toBeTranslatedString.toLowerCase() === 'true' || toBeTranslatedString === '1') return true;
                if (toBeTranslatedString.toLowerCase() === 'false' || toBeTranslatedString === '0') return false;
                // exsisting String (e.g. "Hello") are "true" in boolean - empty string is false. GOOD "autotranslate"?
                return Boolean(toBeTranslatedString);
            }
            case 'date': {
                const parsedDate = new Date(toBeTranslatedString);
                // empty string is invalid date -> returns the default value.
                return isNaN(parsedDate.getTime()) ? lens.default : parsedDate;
            }
            case 'string':
            default:
                return toBeTranslatedString;
            }
        }
    }


    public encodeValueForGraph(identifyingType: string, propertyKey: string, rawAppValue: any, changeType: whatType): string {
        const lens = this.getPropertyLens(identifyingType, propertyKey, changeType);
        
        let stringifiedValue = String(rawAppValue);

        if (!lens) {
            if (rawAppValue instanceof Date) return rawAppValue.toISOString();
            return stringifiedValue; 
        }


        if (lens.value === 'date' && rawAppValue instanceof Date) {
            stringifiedValue = rawAppValue.toISOString();
        } else if (lens.value === 'boolean') {
            stringifiedValue = rawAppValue === true ? "true" : "false";
        } else {
            stringifiedValue = String(rawAppValue); 
        }

        if (lens.transformerMap) {
            for (const [dbKey, appMappedValue] of Object.entries(lens.transformerMap)) {
                // Ignore the fallback "default" key when inversely mapping
                if (dbKey !== 'default' && String(appMappedValue) === stringifiedValue) {
                    return dbKey; 
                }
            }
        }

        return stringifiedValue;
    }

    public isNodeAllowed(identifyingType: string): boolean {
        if (!this.cachedSchema) this.refreshCache();
        return this.cachedSchema.nodeTypes?.[identifyingType] !== undefined;
    }


    public isRelationshipAllowed(identifyingEdge: string): boolean {
        if (!this.cachedSchema) this.refreshCache();
        return this.cachedSchema.relationshipTypes?.[identifyingEdge] !== undefined;
    }

    public filterAllowedNodes<T>(nodes: T[], getType: (node: T) => string): T[] {
        if (!this.cachedSchema) this.refreshCache();
        const allowedNodes = this.cachedSchema.nodeTypes || {};
        return nodes.filter(node => allowedNodes[getType(node)] !== undefined);
    }

    public filterAllowedRelationships<T>(relationships: T[], getType: (rel: T) => string): T[] {
        if (!this.cachedSchema) this.refreshCache();
        const allowedEdges = this.cachedSchema.relationshipTypes || {};
        return relationships.filter(rel => allowedEdges[getType(rel)] !== undefined);
    }

    public decodeAndFilterProperties(identifyingType: string, rawProps: Record<string, any>, changeType: whatType): Record<string, any> {
        const filteredProps: Record<string, any> = {};
        const targetTypes = changeType === "NodeType" 
            ? this.cachedSchema.nodeTypes 
            : this.cachedSchema.relationshipTypes;
        if (!targetTypes || !targetTypes[identifyingType]) throw new SchemaError(`Type ${identifyingType} not found`);
        const allowedProps = targetTypes[identifyingType].properties;
        const decodedProps: Record<string, any> = {};

        for (const [key, rawValue] of Object.entries(rawProps)) {
            console.log("key", key, !allowedProps[key]);

            if (key.startsWith('__')) continue;
            if (!allowedProps[key]) continue;
            decodedProps[key] = this.decodeStringFromGraph(identifyingType, key, String(rawValue ?? ''), changeType);
        }
        console.log("rawProps ", identifyingType, rawProps);
        console.log("allowedProps", identifyingType, allowedProps);
        console.log("decodedProps", identifyingType, decodedProps);
        return decodedProps;
    }

    public retriveLabels(identifyingType: string, what: whatType): string[] {
        if (!this.cachedSchema) this.refreshCache();
        const targetTypes = what === "NodeType" 
            ? this.cachedSchema.nodeTypes 
            : this.cachedSchema.relationshipTypes;
        if (!targetTypes || !targetTypes[identifyingType]) return [];
        return targetTypes[identifyingType].labels;
    }

    public applyLensToGraph<VisibleNode extends { id: string, type: string, props: Record<string, any> }, 
                            VisibleEdge extends { id: string, type: string, sourceId: string, targetId: string, props: Record<string, any> }>(
        rawNodes: VisibleNode[],
        rawEdges: VisibleEdge[]
    ): { lensedNodes: (VisibleNode & { label: string[], appProps: Record<string, any> })[], lensedEdges: (VisibleEdge & { appProps: Record<string, any> })[] } {

        const validNodes = this.filterAllowedNodes(rawNodes, n => n.type);
        const validNodeIds = new Set(validNodes.map(n => n.id));

        const lensedNodes = validNodes.map(n => ({
            ...n,
            label: this.retriveLabels(n.type, 'NodeType'),
            appProps: this.decodeAndFilterProperties(n.type, n.props, 'NodeType')
        }));

        console.log("lensedNodes", lensedNodes);

        const validEdges = this.filterAllowedRelationships(rawEdges, e => e.type)
            .filter(e => validNodeIds.has(e.sourceId) && validNodeIds.has(e.targetId));

        const lensedEdges = validEdges.map(e => ({
            ...e,
            appProps: this.decodeAndFilterProperties(e.type, e.props, 'RelationshipType')
        }));

        return { lensedNodes, lensedEdges };
    }
}
