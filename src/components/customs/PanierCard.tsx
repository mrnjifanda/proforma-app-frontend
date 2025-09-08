import { Panier, Client, Currency } from "@/utils/types";
import { ShoppingCart, Edit, Trash2, Archive, Eye, User, Package, AlertCircle } from "lucide-react";

const PanierCard = ({
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
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${isArchived ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
            }`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${isArchived ? 'bg-gray-200' : 'bg-blue-100'
                            }`}>
                            <ShoppingCart className={`w-5 h-5 ${isArchived ? 'text-gray-500' : 'text-blue-600'
                                }`} />
                        </div>
                        <div>
                            <h3 className={`font-bold ${isArchived ? 'text-gray-600' : 'text-gray-900'
                                }`}>
                                {panier.nom || `Devis ${panier._id?.slice(-6)}`}
                            </h3>
                            <div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 ${isArchived
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                {isArchived ? 'Archivé' : 'Actif'}
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-1">
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
                            title="Modifier le devis"
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
                </div>

                {/* Informations client */}
                <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 mr-2" />
                        {client ? (
                            <span className="font-medium text-gray-900">{client.nom}</span>
                        ) : (
                            <span className="italic">Aucun client assigné</span>
                        )}
                    </div>
                    {client && (
                        <div className="text-xs text-gray-500 ml-6">
                            {client.email}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`rounded-lg p-3 ${isArchived ? 'bg-gray-100' : 'bg-gray-50'
                        }`}>
                        <div className="text-xs text-gray-500 mb-1">Lignes</div>
                        <div className={`font-semibold flex items-center ${isEmpty ? 'text-red-600' : ''
                            }`}>
                            <Package className="w-4 h-4 mr-1" />
                            {panier.lignes ? panier.lignes.length : 0}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${isArchived ? 'bg-gray-100' : 'bg-gray-50'
                        }`}>
                        <div className="text-xs text-gray-500 mb-1">Total HT</div>
                        <div className="font-semibold">
                            {formatCurrency(panier.totalHT || 0)}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${isArchived ? 'bg-gray-100' : 'bg-gray-50'
                        }`}>
                        <div className="text-xs text-gray-500 mb-1">TVA</div>
                        <div className="font-semibold">
                            {formatCurrency(panier.totalTVA || 0)}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${isArchived ? 'bg-blue-100' : 'bg-blue-50'
                        }`}>
                        <div className={`text-xs mb-1 ${isArchived ? 'text-blue-700' : 'text-blue-600'
                            }`}>Total TTC</div>
                        <div className={`font-bold ${isArchived ? 'text-blue-700' : 'text-blue-600'
                            }`}>
                            {formatCurrency(panier.totalTTC || 0)}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100">
                    {/* Date de création */}
                    {panier.created_at && (
                        <div className="text-xs text-gray-500 pt-3">
                            Créé le {new Date(panier.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </div>
                    )}

                    {/* Indicateurs d'état */}
                    {isEmpty && (
                        <div className="pt-3">
                            <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Devis vide
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PanierCard;