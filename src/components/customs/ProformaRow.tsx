import { Proforma, Client } from "@/utils/types";
import { FileText, Eye, Download, Check, Ban, Trash2, User, AlertTriangle } from "lucide-react";

const ProformaRow = ({
    proforma,
    onPreview,
    onDownloadPDF,
    onAccept,
    onReject,
    onDelete,
    actionLoading
}: {
    proforma: Proforma;
    onPreview: () => void;
    onDownloadPDF: () => void;
    onAccept: () => void;
    onReject: () => void;
    onDelete: () => void;
    actionLoading: string;
}) => {
    const client = typeof proforma.client === 'object' ? proforma.client as Client : null;
    const isExpired = new Date(proforma.validite) < new Date();
    const isExpiredToday = (() => {
        const today = new Date();
        const validite = new Date(proforma.validite);
        return validite.toDateString() === today.toDateString() && validite < today;
    })();

    const getStatusBadge = (status: Proforma['statut']) => {
        const badges = {
            en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepte: 'bg-green-100 text-green-800 border-green-200',
            refuse: 'bg-red-100 text-red-800 border-red-200',
            expire: 'bg-gray-100 text-gray-800 border-gray-200'
        };

        const labels = {
            en_attente: 'En attente',
            accepte: 'Accepté',
            refuse: 'Refusé',
            expire: 'Expiré'
        };

        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${badges[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const formatCurrency = (amount: number): string => {
        return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' });
    };

    return (
        <tr className={`transition-colors ${
            isExpired ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
        }`}>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                        isExpired ? 'bg-red-200' : 'bg-indigo-100'
                    }`}>
                        <FileText className={`w-5 h-5 ${
                            isExpired ? 'text-red-600' : 'text-indigo-600'
                        }`} />
                    </div>
                    <div>
                        <div className={`font-medium ${
                            isExpired ? 'text-red-800' : 'text-gray-900'
                        }`}>
                            {proforma.numero}
                        </div>
                        <div className="flex gap-2 items-center mt-1">
                            {isExpiredToday && (
                                <span className="text-xs text-orange-600 font-medium">
                                    Expire aujourd&apos;hui
                                </span>
                            )}
                            {isExpired && !isExpiredToday && (
                                <div className="flex items-center text-xs text-red-600">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Expiré
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
                        {client.ville && (
                            <div className="text-xs text-gray-500">{client.ville}</div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 italic flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Client non trouvé
                    </div>
                )}
            </td>
            <td className="px-6 py-4">
                <div className={`text-sm ${
                    isExpired ? 'text-red-600 font-medium' : 'text-gray-900'
                }`}>
                    {new Date(proforma.validite).toLocaleDateString('fr-FR')}
                    {isExpired && (
                        <div className="text-xs text-red-500 flex items-center mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expiré
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(proforma.totalTTC)}
                </div>
                <div className="text-xs text-gray-500">
                    HT: {formatCurrency(proforma.totalHT)}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2 flex-wrap">
                    {getStatusBadge(proforma.statut)}
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={onPreview}
                        disabled={actionLoading === `preview-${proforma.numero}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Aperçu"
                    >
                        <Eye className="w-5 h-5" />
                    </button>

                    <button
                        onClick={onDownloadPDF}
                        disabled={actionLoading === `pdf-${proforma.numero}` || !proforma.proforma_pdf}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Télécharger PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>

                    {proforma.statut === 'en_attente' && (
                        <>
                            <button
                                onClick={onAccept}
                                disabled={actionLoading === `status-${proforma.numero}`}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Marquer comme accepté"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onReject}
                                disabled={actionLoading === `status-${proforma.numero}`}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Marquer comme refusé"
                            >
                                <Ban className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <button
                        onClick={onDelete}
                        disabled={actionLoading === `delete-${proforma.numero}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ProformaRow;