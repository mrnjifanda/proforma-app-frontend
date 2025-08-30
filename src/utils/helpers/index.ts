export function validateId(id: string | null): string | null {
    if (!id || typeof id !== 'string') return null;

    const idPattern = /^[a-zA-Z0-9-_]{1,50}$/;
    if (!idPattern.test(id)) return null;
    
    return id.trim();
}