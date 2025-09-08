import { Panier, Client, Currency } from "@/utils/types";
import { ShoppingCart, User, Package, Edit, Trash2, Archive, Eye, AlertCircle } from "lucide-react";

const PanierRow = ({
    panier,
    onOpen,
    onEdit,
    onArchive,
    onDelete
}: {
    panier: Panier;
    onOpen: () => void;
    onEdit: () => void;
    onArchive: () => void;
    onDelete: () => void;
}) => {
    const client = typeof panier.client === 'object' ? panier.client as Client : null;
    const currency = typeof panier.currency === 'object' ? panier.currency as Currency : null;
    const isArchived = panier.statut === false;
    const isEmpty = !panier.lignes || panier.lignes.length === 0;

    const formatCurrency = (amount: number) => {
        if (currency) {
            return `${amount.toLocaleString('fr-FR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })} ${currency.symbol}`;
        }
        // Fallback si pas de devise
        return amount.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        });
    };

    return (
        <tr className={`transition-colors ${isArchived ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
            }`}>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${isArchived ? 'bg-gray-200' : 'bg-blue-100'
                        }`}>
                        <ShoppingCart className={`w-5 h-5 ${isArchived ? 'text-gray-500' : 'text-blue-600'
                            }`} />
                    </div>
                    <div>
                        <div className={`font-medium ${isArchived ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                            {panier.nom || `Devis ${panier._id?.slice(-6)}`}
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${isArchived
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                {isArchived ? 'Archivé' : 'Actif'}
                            </div>
                            {isEmpty && (
                                <div className="flex items-center text-xs text-orange-600 mt-1">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Vide
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                {client ? (
                    <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {client.nom}
                        </div>
                        <div className="text-xs text-gray-500">{client.email}</div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 italic flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Aucun client
                    </div>
                )}
            </td>
            <td className="px-6 py-4">
                <div className={`text-sm flex items-center ${isEmpty ? 'text-red-600 font-semibold' : 'text-gray-900'
                    }`}>
                    <Package className="w-4 h-4 mr-1" />
                    {panier.lignes ? panier.lignes.length : 0} ligne{panier.lignes && panier.lignes.length > 1 ? 's' : ''}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-900 font-medium">
                    {formatCurrency(panier.totalTTC || 0)}
                </div>
                <div className="text-xs text-gray-500">
                    HT: {formatCurrency(panier.totalHT || 0)}
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={onOpen}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Ouvrir le devis"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onArchive}
                        className={`p-2 rounded-lg transition-colors ${isArchived
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-orange-600 hover:bg-orange-50'
                            }`}
                        title={isArchived ? 'Désarchiver' : 'Archiver'}
                    >
                        <Archive className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default PanierRow;