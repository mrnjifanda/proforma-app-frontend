import { Produit } from "@/utils/types";
import { Package, Edit, Trash2, Percent, Box, ShoppingCart, ToggleLeft, ToggleRight } from "lucide-react";

const ProductCard = ({
    produit,
    onEdit,
    onDelete,
    onToggleActive,
    onAddToCart
}: {
    produit: Produit;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onAddToCart: () => void;
}) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{produit.nom}</h3>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 ${produit.actif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {produit.actif ? 'Actif' : 'Inactif'}
                        </div>
                    </div>
                </div>
                <div className="flex space-x-1">
                    <button
                        onClick={onEdit}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        {produit.prixUnitaireHT.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
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
                        {(produit.prixUnitaireHT * (1 + produit.tauxTVA / 100)).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                    </div>
                </div>
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={onAddToCart}
                    disabled={!produit.actif || produit.stock === 0}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${produit.actif && produit.stock > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                    Ajouter au panier
                </button>
                <button
                    onClick={onToggleActive}
                    className={`p-2 rounded-lg ${produit.actif
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

export default ProductCard;