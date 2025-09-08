import { Produit } from "@/utils/types";
import { Package, Percent, Box, ShoppingCart, Edit, Trash2, Eye } from "lucide-react";
import Image from "next/image";

const ProductRow = ({
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

    const currency = typeof produit.currency === 'object' ? produit.currency : null;
    const currencySymbol = currency?.symbol || '$';
    const currencyCode = currency?.code || 'USD';

    const firstImage = produit.files && produit.files.length > 0 
        ? produit.files.find(file => file.type?.startsWith('image/'))
        : null;

    const formatPrice = (price: number) => {
        return `${currencySymbol} ${price.toLocaleString('fr-FR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })}`;
    };

    const ttcPrice = produit.prixUnitaireHT * (1 + produit.tauxTVA / 100);

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center">
                    {/* Image ou icône du produit */}
                    <div className="w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                        {firstImage ? (
                            <Image
                                src={firstImage.link}
                                alt={produit.nom}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                                height={50}
                                width={50}
                            />
                        ) : null}
                        <div className={`${firstImage ? 'hidden' : 'flex'} w-12 h-12 items-center justify-center bg-blue-100 rounded-lg`}>
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    
                    <div>
                        <div className="font-medium text-gray-900">{produit.nom}</div>
                        <div className="text-sm text-gray-500 mb-1">
                            Réf: {produit.reference}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${produit.actif
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {produit.actif ? 'Actif' : 'Inactif'}
                            </div>
                            {currency && (
                                <div className="flex items-center text-xs text-gray-500">
                                    <span className="mr-1">{currency.flag}</span>
                                    <span>{currencyCode}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                    {formatPrice(produit.prixUnitaireHT)}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                    <Percent className="w-3 h-3 mr-1" />
                    TVA {produit.tauxTVA}%
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900 font-semibold">
                    {formatPrice(ttcPrice)}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className={`text-sm ${produit.stock <= 5 ? 'text-red-600 font-semibold' : ''}`}>
                    <Box className="w-4 h-4 inline-block mr-1" />
                    {produit.stock} unités
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={onAddToCart}
                        disabled={!produit.actif || produit.stock === 0}
                        className={`px-3 py-1.5 text-sm rounded cursor-pointer ${produit.actif && produit.stock > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                        Ajouter
                    </button>

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
            </td>
        </tr>
    );
};

export default ProductRow;