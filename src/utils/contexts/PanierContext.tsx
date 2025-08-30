'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Panier, LignePanier, Produit } from '@/utils/types';

interface PanierContextType {
    panier: Panier;
    ajouterProduit: (produit: Produit, quantite: number) => void;
    modifierQuantite: (produitId: string, quantite: number) => void;
    supprimerProduit: (produitId: string) => void;
    viderPanier: () => void;
    calculerTotaux: () => void;
}

const PanierContext = createContext<PanierContextType | undefined>(undefined);

interface PanierProviderProps {
    children: ReactNode;
}

export const PanierProvider: React.FC<PanierProviderProps> = ({ children }) => {
    const [panier, setPanier] = useState<Panier>({
        lignes: [],
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0
    });

    const calculerTotaux = () => {
        setPanier(prevPanier => {
            const totalHT = prevPanier.lignes.reduce((sum, ligne) =>
                sum + (ligne.prixUnitaireHT * ligne.quantite), 0
            );

            const totalTVA = prevPanier.lignes.reduce((sum, ligne) =>
                sum + (ligne.prixUnitaireHT * ligne.quantite * ligne.tauxTVA / 100), 0
            );

            const totalTTC = totalHT + totalTVA;

            return {
                ...prevPanier,
                totalHT: Math.round(totalHT * 100) / 100,
                totalTVA: Math.round(totalTVA * 100) / 100,
                totalTTC: Math.round(totalTTC * 100) / 100
            };
        });
    };

    const ajouterProduit = (produit: Produit, quantite: number) => {
        setPanier(prevPanier => {
            const ligneExistante = prevPanier.lignes.find(ligne => ligne.produit._id === produit._id);

            if (ligneExistante) {
                // Mettre à jour la quantité si le produit existe déjà
                const nouvellesLignes = prevPanier.lignes.map(ligne =>
                    ligne.produit._id === produit._id
                        ? { ...ligne, quantite: ligne.quantite + quantite }
                        : ligne
                );
                return { ...prevPanier, lignes: nouvellesLignes };
            } else {
                // Ajouter une nouvelle ligne
                const nouvelleLigne: LignePanier = {
                    produit,
                    quantite,
                    prixUnitaireHT: produit.prixUnitaireHT,
                    tauxTVA: produit.tauxTVA
                };
                return { ...prevPanier, lignes: [...prevPanier.lignes, nouvelleLigne] };
            }
        });
    };

    const modifierQuantite = (produitId: string, quantite: number) => {
        if (quantite <= 0) {
            supprimerProduit(produitId);
            return;
        }

        setPanier(prevPanier => ({
            ...prevPanier,
            lignes: prevPanier.lignes.map(ligne =>
                ligne.produit._id === produitId
                    ? { ...ligne, quantite }
                    : ligne
            )
        }));
    };

    const supprimerProduit = (produitId: string) => {
        setPanier(prevPanier => ({
            ...prevPanier,
            lignes: prevPanier.lignes.filter(ligne => ligne.produit._id !== produitId)
        }));
    };

    const viderPanier = () => {
        setPanier({
            lignes: [],
            totalHT: 0,
            totalTVA: 0,
            totalTTC: 0
        });
    };

    // Recalculer les totaux à chaque changement des lignes
    React.useEffect(() => {
        calculerTotaux();
    }, [panier.lignes]);

    return (
        <PanierContext.Provider value={{
            panier,
            ajouterProduit,
            modifierQuantite,
            supprimerProduit,
            viderPanier,
            calculerTotaux
        }}>
            {children}
        </PanierContext.Provider>
    );
};

export const usePanier = (): PanierContextType => {
    const context = useContext(PanierContext);
    if (context === undefined) {
        throw new Error('usePanier must be used within a PanierProvider');
    }
    return context;
};
