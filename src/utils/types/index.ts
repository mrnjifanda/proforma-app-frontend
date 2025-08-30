export interface Client {
    _id: string;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    ville: string;
    codePostal: string;
    siret?: string;
    created_at: Date;
}

export interface Produit {
    reference: string;
    _id: string;
    nom: string;
    description: string;
    prixUnitaireHT: number;
    tauxTVA: number; // en pourcentage (ex: 20 pour 20%)
    stock: number;
    actif: boolean;
    __v?: string,
    updated_at?: string;
    entreprise?: string;
    deleted_at?: string;
    created_at?: Date;
}

export interface ProduitAvecVentes extends Produit {
    quantiteVendue: number;
    totalCA: number;
}

export interface LignePanier {
    _id?: string;
    produit: Produit;
    quantite: number;
    prixUnitaireHT: number;
    tauxTVA: number;
}

export interface Panier {
    _id?: string
    lignes: LignePanier[];
    nom?: string;
    client?: Client;
    totalHT?: number;
    totalTVA?: number;
    totalTTC?: number;
    statut?: boolean;
    __v?: string;
    updated_at?: string;
    entreprise?: string;
    deleted_at?: string;
    created_at?: Date;
}

export interface ContenuItem {
    produit: string;
    reference: string;
    nom: string;
    description?: string | null;
    prixUnitaireHT: number;
    tauxTVA: number;
    quantite: number;
    totalLigneHT: number;
    totalLigneTVA: number;
    totalLigneTTC: number;
}

export interface Proforma {
    _id?: string;
    numero: string;
    client: Client | string;
    panier: Panier | string;
    contenu: ContenuItem[];
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    produits: string[];
    validite: Date;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'expire';
    proforma_pdf?: string | null;
    facture_pdf?: string | null;
    conditions?: string | null;
    entreprise: ConfigEntreprise | string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Devis {
    id: string;
    numero: string;
    proformaId: string;
    client: Client;
    panier: Panier;
    dateCreation: Date;
    validite: Date;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'expire';
    conditions: string;
}

export interface User {
    id: string;
    last_name: string | null;
    first_name: string | null;
    username: string | null;
    email: string,
    role: "ADMIN"
}

export interface AuthContextType {
    entreprise: ConfigEntreprise | null;
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

export interface ConfigEntreprise {
    _id?: string;
    nom: string;
    logo: string;
    adresse: string;
    telephone: string;
    email: string;
    siret: string;
    tauxTVADefaut: number;
    couleurPrimaire: string;
    couleurSecondaire: string;
}

export type LoadingState = 'loading' | 'success' | 'error' | 'not-found';

export type FilterProduct = 'all' | 'active' | 'inactive' | 'low-stock' | 'out-of-stock';

export interface PaginationInfo {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
}
