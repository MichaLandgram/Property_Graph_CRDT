import { Schema_v1 } from '../1_Schema_CRDT/Schema/schema_v1';
import { whatToChange, PropertyLensMap, dataTypes } from '../0_Types/types';

// first DRAFT
export class SchemaLensEngine {
    private schemaCRDT: Schema_v1;
    // Cache the resolved JSON state to prevent expensive Yjs `.toJSON()` computations
    private cachedSchema: any | null = null;

    constructor(schemaCRDT: Schema_v1) {
        this.schemaCRDT = schemaCRDT;
        this.refreshCache(); // Initialize cache on startup
    }

    /**
     * Rebuilds the internal JSON lookup mapping. 
     * You should call this whenever your CRDT schema receives an update.
     */
    public refreshCache() {
        this.cachedSchema = this.schemaCRDT.transformToJSONCleanSchema();
    }

    public getPropertyLens(identifyingType: string, propertyKey: string, changeType: whatToChange): PropertyLensMap | undefined {
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
            return { value: rawLens as dataTypes };
        }

        return rawLens as PropertyLensMap;
    }


    public decodeStringFromGraph(identifyingType: string, propertyKey: string, rawString: string, changeType: whatToChange): any {
        const lens = this.getPropertyLens(identifyingType, propertyKey, changeType);
        
        if (!lens) {

            return rawString;
        }

        let translatedString = rawString;


        if (lens.transformerMap) {
            if (lens.transformerMap[rawString] !== undefined) {
                translatedString = lens.transformerMap[rawString];
            } else if (lens.transformerMap['default'] !== undefined) {
                translatedString = lens.transformerMap['default'];
            } else if (lens.default !== undefined) {
                translatedString = lens.default;
            }
        }


        switch (lens.value) {
            case 'number': {
                const parsedNum = Number(translatedString);
                return isNaN(parsedNum) ? translatedString : parsedNum;
            }
            case 'boolean': {
                if (translatedString === 'true' || translatedString === '1') return true;
                if (translatedString === 'false' || translatedString === '0') return false;
                return Boolean(translatedString); // Fallback
            }
            case 'date': {
                const parsedDate = new Date(translatedString);
                return isNaN(parsedDate.getTime()) ? translatedString : parsedDate;
            }
            case 'string':
            default:
                return translatedString;
        }
    }


    public encodeValueForGraph(identifyingType: string, propertyKey: string, rawAppValue: any, changeType: whatToChange): string {
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

    /**
     * Filters an array of Graph Database nodes, returning only those permitted by the schema.
     * @param nodes The raw graph nodes array
     * @param getType A callback to extract the IdentifyingType from your custom node structure
     */
    public filterAllowedNodes<T>(nodes: T[], getType: (node: T) => string): T[] {
        if (!this.cachedSchema) this.refreshCache();
        const allowedNodes = this.cachedSchema.nodeTypes || {};
        return nodes.filter(node => allowedNodes[getType(node)] !== undefined);
    }

    /**
     * Filters an array of Graph Database relationships, returning only those permitted by the schema.
     * @param relationships The raw graph relationships array
     * @param getType A callback to extract the IdentifyingEdge from your custom relationship structure
     */
    public filterAllowedRelationships<T>(relationships: T[], getType: (rel: T) => string): T[] {
        if (!this.cachedSchema) this.refreshCache();
        const allowedEdges = this.cachedSchema.relationshipTypes || {};
        return relationships.filter(rel => allowedEdges[getType(rel)] !== undefined);
    }
}
