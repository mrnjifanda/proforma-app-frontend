import { formatPrice, getCurrency } from "@/utils/helpers";
import { Panier, Produit } from "@/utils/types";
import { ShoppingCart, X, Package, Minus, Plus, CheckCircle, AlertCircle, Info, Tag, TrendingUp } from "lucide-react";

interface FormData {
    panierId: string;
    quantite: number;
}

interface AddToCartModalProps {
    produit: Produit;
    paniers: Panier[];
    formData: FormData;
    isLoading: boolean;
    onChange: (e: FormData) => void;
    onAdd: () => void;
    onClose: () => void;
}

const AddToCartModal = ({
    produit,
    paniers,
    formData,
    isLoading,
    onChange,
    onAdd,
    onClose
}: AddToCartModalProps) => {

    const compatiblePaniers = paniers.filter(panier => {
        const panierCurrencyCode = typeof panier.currency === 'string' ? panier.currency : panier.currency?.code;
        const produitCurrencyCode = typeof produit.currency === 'string' ? produit.currency : produit.currency?.code;
        return panierCurrencyCode === produitCurrencyCode;
    });

    const ttcPrice = produit.prixUnitaireHT * (1 + produit.tauxTVA / 100);
    const totalPrice = ttcPrice * formData.quantite;
    const selectedPanier = compatiblePaniers.find(p => p._id === formData.panierId);

    const isOutOfStock = produit.stock === 0;
    const isLowStock = produit.stock <= 10 && produit.stock > 0;
    const canAddQuantity = formData.quantite < produit.stock;

    return (
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden mx-auto">
            {/* En-tête avec gradient */}
            <div className="bg-blue-600 text-white p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <div className="bg-white/20 p-3 rounded-xl mr-4">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Ajouter au devis</h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Sélectionnez la quantité et le devis
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Information produit */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex items-start">
                        <div className="bg-blue-100 p-3 rounded-xl mr-4 flex-shrink-0">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg mb-1">{produit.nom}</h4>
                                    {produit.reference && (
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Tag className="w-3 h-3 mr-1" />
                                            Réf: {produit.reference}
                                        </div>
                                    )}
                                    {produit.description && (
                                        <p className="text-gray-600 text-sm">{produit.description}</p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <div className="text-xl font-bold text-blue-600">
                                        {formatPrice(ttcPrice, getCurrency(produit.currency, 'code'))}
                                    </div>
                                    <div className="text-xs text-gray-500">TTC</div>
                                    <div className="text-xs text-gray-400">
                                        HT: {formatPrice(produit.prixUnitaireHT, getCurrency(produit.currency, 'code'))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statut du stock */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                            {isOutOfStock ? (
                                <div className="flex items-center text-red-600">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Rupture de stock</span>
                                </div>
                            ) : isLowStock ? (
                                <div className="flex items-center text-orange-600">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Stock faible</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">En stock</span>
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            <span className="font-medium">{produit.stock}</span> unité{produit.stock !== 1 ? 's' : ''} disponible{produit.stock !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Sélection du panier */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Sélectionnez un devis
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={formData.panierId}
                            onChange={e => onChange({ ...formData, panierId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 appearance-none bg-white"
                            required
                            disabled={compatiblePaniers.length === 0}
                        >
                            <option value="">Sélectionnez un devis</option>
                            {compatiblePaniers.map((panier: Panier) => (
                                <option key={panier._id} value={panier._id}>
                                    {panier.nom}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    {selectedPanier && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                            <div className="flex items-center text-blue-700">
                                <Info className="w-4 h-4 mr-1" />
                                <span className="font-medium">Devis sélectionné: {selectedPanier.nom}</span>
                            </div>
                        </div>
                    )}
                    {compatiblePaniers.length === 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            <div className="flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span>Aucun devis disponible dans la devise <strong>{getCurrency(produit.currency, 'code')}</strong>.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sélection de la quantité */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Quantité
                    </label>

                    <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 flex-wrap gap-4 md:gap-0">
                        <button
                            type="button"
                            onClick={() => onChange({ ...formData, quantite: Math.max(1, formData.quantite - 1) })}
                            disabled={formData.quantite <= 1 || isOutOfStock}
                            className="p-2 md:p-3 border-2 border-gray-200 rounded-xl hover:bg-white hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>

                        <div className="mx-2 md:mx-6 text-center">
                            <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                {formData.quantite}
                            </div>
                            <div className="text-xs text-gray-500">unité{formData.quantite !== 1 ? 's' : ''}</div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onChange({ ...formData, quantite: Math.min(produit.stock, formData.quantite + 1) })}
                            disabled={!canAddQuantity || isOutOfStock}
                            className="p-2 md:p-3 border-2 border-gray-200 rounded-xl hover:bg-white hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>

                    {produit.stock > 1 && (
                        <div className="flex justify-center mt-3">
                            <button
                                type="button"
                                onClick={() => onChange({ ...formData, quantite: produit.stock })}
                                disabled={isOutOfStock}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                            >
                                Quantité maximale ({produit.stock})
                            </button>
                        </div>
                    )}
                </div>

                {/* Récapitulatif du total */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-xl mb-6 border border-blue-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-start md:items-center">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-blue-800">Total TTC</div>
                                <div className="text-xs text-blue-600">
                                    {formData.quantite} × {formatPrice(ttcPrice, getCurrency(produit.currency, 'code'))}
                                </div>
                            </div>
                        </div>
                        <div className="text-right min-w-0">
                            <div className="text-xl md:text-2xl font-bold text-blue-600 whitespace-nowrap">
                                {formatPrice(totalPrice, getCurrency(produit.currency, 'code'))}
                            </div>
                            <div className="text-xs text-blue-500 whitespace-nowrap">
                                HT: {formatPrice((totalPrice / (1 + produit.tauxTVA / 100)), getCurrency(produit.currency, 'code'))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages d'avertissement */}
                {isOutOfStock && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
                        <div className="flex items-center text-red-800">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">
                                Ce produit n&apos;est pas disponible en stock.
                            </span>
                        </div>
                    </div>
                )}

                {formData.quantite > produit.stock && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6">
                        <div className="flex items-center text-orange-800">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">
                                Quantité supérieure au stock disponible.
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onAdd}
                        disabled={
                            isLoading ||
                            isOutOfStock ||
                            !formData.panierId ||
                            formData.quantite > produit.stock ||
                            compatiblePaniers.length === 0
                        }
                        className="flex-1 py-3 px-4 md:px-6 bg-blue-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 md:min-w-[140px]"                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>Ajout...</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Ajouter
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToCartModal;
