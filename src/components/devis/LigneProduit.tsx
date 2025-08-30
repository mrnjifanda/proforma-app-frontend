import { LignePanier } from "@/utils/types";
import { Minus, Package, Percent, Plus, Trash2 } from "lucide-react";

interface LigneProduitProps {
    ligne: LignePanier;
    onQuantityChange: (newQuantity: number) => void;
    onRemove: () => void;
}

const LigneProduit = ({ ligne, onQuantityChange, onRemove }: LigneProduitProps) => {

    if (!ligne || !ligne.produit) {
        return null;
    }

    const {
        produit,
        quantite,
        prixUnitaireHT,
        tauxTVA
    } = ligne;

    const montantHT = (prixUnitaireHT || 0) * (quantite || 0);
    const montantTVA = montantHT * ((tauxTVA || 0) / 100);
    const montantTTC = montantHT + montantTVA;

    const handleDecrease = () => {
        if (quantite > 1) {
            onQuantityChange(quantite - 1);
        }
    };

    const handleIncrease = () => {
        onQuantityChange(quantite + 1);
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            {/* Icône produit */}
            <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
            </div>

            {/* Informations produit */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">
                    {produit.nom || 'Produit sans nom'}
                </h3>
                {produit.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {produit.description}
                    </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Prix HT:</span> {prixUnitaireHT?.toLocaleString('fr-FR', { 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 2 
                        }) || '0,00 $'}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center">
                        <Percent className="w-3 h-3 mr-1" />
                        TVA {(tauxTVA || 0).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Contrôles de quantité */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button
                        onClick={handleDecrease}
                        disabled={quantite <= 1}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                        aria-label="Diminuer la quantité"
                    >
                        <Minus className="w-4 h-4" />
                    </button>

                    <div className="px-3 py-2 font-medium w-16 text-center border-x border-gray-300">
                        {quantite || 0}
                    </div>

                    <button
                        onClick={handleIncrease}
                        className="p-2 hover:bg-gray-50 transition-colors rounded-r-lg"
                        aria-label="Augmenter la quantité"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Prix total */}
                <div className="text-right min-w-[120px]">
                    <div className="font-bold text-gray-900">
                        {montantTTC.toLocaleString('fr-FR', { 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 2 
                        })}
                        <span className="text-xs font-normal text-gray-500 ml-1">TTC</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        {montantHT.toLocaleString('fr-FR', { 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 2 
                        })} HT
                    </div>
                    {tauxTVA > 0 && (
                        <div className="text-xs text-gray-500">
                            TVA: {montantTVA.toLocaleString('fr-FR', { 
                                style: 'currency', 
                                currency: 'USD',
                                minimumFractionDigits: 2 
                            })}
                        </div>
                    )}
                </div>

                {/* Bouton supprimer */}
                <button
                    onClick={onRemove}
                    className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors flex-shrink-0"
                    title={`Supprimer ${produit.nom} du panier`}
                    aria-label={`Supprimer ${produit.nom} du panier`}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default LigneProduit;
