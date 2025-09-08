import { Currency } from "../types";

export function validateId(id: string | null): string | null {
    if (!id || typeof id !== 'string') return null;

    const idPattern = /^[a-zA-Z0-9-_]{1,50}$/;
    if (!idPattern.test(id)) return null;
    
    return id.trim();
}

export function getCurrency(currency: Currency | string, key: keyof Currency): string {
    if (typeof currency === 'object' && key in currency) {
        return currency[key] as string;
    }
    return typeof currency === 'string' ? currency : 'USD';
}

export function formatPrice(amount: number, currency: string): string {
    return amount.toLocaleString(undefined, { style: "currency", currency: currency });
}

export const getCurrencyCode = (currency: string | Currency | undefined): string => {
    
    if (!currency) return 'USD';

    if (typeof currency === 'string') return currency;

    return currency.code || 'USD';
};

export const deepClone = <T>(obj: T): T => {

    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any;
    if (typeof obj === 'object') {
        const cloned = {} as T;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
};