import { ConfigEntreprise } from '@/utils/types';
export const AUTH_STORAGE_KEY: string = "auth";

export const FORMAT_DATE = (created_at: string | number | Date, lang: string = 'fr-FR') => {

    return new Date(created_at).toLocaleDateString(lang, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
} 

export const configEntreprise: ConfigEntreprise = {
    nom: 'Screentech',
    logo: '/logo.png',
    adresse: 'Meydan road, Nad Al, Sheba, Dubai, UAE',
    telephone: '+971566661051',
    email: 'contact@screentech.com',
    siret: '12345678901234',
    tauxTVADefaut: 20,
    couleurPrimaire: '#3b82f6',
    couleurSecondaire: '#64748b'
};
