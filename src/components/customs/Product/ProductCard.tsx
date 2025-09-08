import { Produit } from "@/utils/types";
import { Package, Edit, Trash2, Percent, Box, ShoppingCart, ToggleLeft, ToggleRight, Eye } from "lucide-react";

const ProductCard = ({
    produit,
    onEdit,
    onDelete,
    onToggleActive,
    onAddToCart,
    onView
}: {
    produit: Produit;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onAddToCart: () => void;
    onView: () => void;
}) => {
    // Récupérer la devise du produit
    const currency = typeof produit.currency === 'object' ? produit.currency : null;
    const currencySymbol = currency?.symbol || '$';
    const currencyCode = currency?.code || 'USD';

    // Récupérer la première image du produit
    const firstImage = produit.files && produit.files.length > 0 
        ? produit.files.find(file => file.type?.startsWith('image/'))
        : null;

    // Formatter le prix avec la devise appropriée
    const formatPrice = (price: number) => {
        return `${currencySymbol} ${price.toLocaleString('fr-FR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })}`;
    };

    // Calculer le prix TTC
    const ttcPrice = produit.prixUnitaireHT * (1 + produit.tauxTVA / 100);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Image ou icône du produit */}
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                {firstImage ? (
                    <img
                        src={firstImage.link}
                        alt={produit.nom}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div className={`${firstImage ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                    <div className="bg-blue-100 p-4 rounded-full">
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                
                {/* Badge de statut */}
                <div className="absolute top-3 right-3">
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${produit.actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {produit.actif ? 'Actif' : 'Inactif'}
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{produit.nom}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Réf: {produit.reference}
                        </p>
                        {currency && (
                            <div className="flex items-center text-xs text-gray-500">
                                <span className="mr-1">{currency.flag}</span>
                                <span>{currency.name} ({currencyCode})</span>
                            </div>
                        )}
                    </div>
                    <div className="flex space-x-1">
                        <button
                            onClick={onView}
                            className="p-2 cursor-pointer text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Voir les détails"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 cursor-pointer text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {produit.description || "Aucune description"}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Prix HT</div>
                        <div className="font-semibold">
                            {formatPrice(produit.prixUnitaireHT)}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">TVA</div>
                        <div className="font-semibold flex items-center">
                            <Percent className="w-4 h-4 mr-1" />
                            {produit.tauxTVA}%
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Stock</div>
                        <div className={`font-semibold ${produit.stock <= 5 ? 'text-red-600' : ''}`}>
                            <Box className="w-4 h-4 inline-block mr-1" />
                            {produit.stock}
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600 mb-1">Prix TTC</div>
                        <div className="font-bold text-blue-600">
                            {formatPrice(ttcPrice)}
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={onAddToCart}
                        disabled={!produit.actif || produit.stock === 0}
                        className={`cursor-pointer flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${produit.actif && produit.stock > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                        Ajouter au panier
                    </button>
                    <button
                        onClick={onToggleActive}
                        className={`cursor-pointer p-2 rounded-lg ${produit.actif
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={produit.actif ? 'Désactiver' : 'Activer'}
                    >
                        {produit.actif ? (
                            <ToggleLeft className="w-4 h-4" />
                        ) : (
                            <ToggleRight className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;