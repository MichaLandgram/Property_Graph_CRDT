export class SchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SchemaError";
        Object.setPrototypeOf(this, SchemaError.prototype);
    }
}


export function getOrThrow<T>(value: T | undefined | null, errorMessage: string): NonNullable<T> {
    if (value === undefined || value === null) {
        throw new SchemaError(errorMessage);
    }
    return value as NonNullable<T>;
}