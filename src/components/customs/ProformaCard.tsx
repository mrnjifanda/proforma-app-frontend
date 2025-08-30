import { Proforma, Client } from "@/utils/types";
import { FileText, Eye, Download, Check, Ban, Trash2, User, Calendar, AlertTriangle } from "lucide-react";

const ProformaCard = ({
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
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
            isExpired ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                            isExpired ? 'bg-red-200' : 'bg-indigo-100'
                        }`}>
                            <FileText className={`w-5 h-5 ${
                                isExpired ? 'text-red-600' : 'text-indigo-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className={`font-bold ${
                                isExpired ? 'text-red-800' : 'text-gray-900'
                            }`}>
                                {proforma.numero}
                            </h3>
                            <div className="flex gap-2 items-center mt-1">
                                {getStatusBadge(proforma.statut)}
                                {isExpiredToday && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                        Expire aujourd&apos;hui
                                    </span>
                                )}
                                {isExpired && !isExpiredToday && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                        Expiré
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onDelete}
                        disabled={actionLoading === `delete-${proforma.numero}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Informations client */}
                <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 mr-2" />
                        {client ? (
                            <span className="font-medium text-gray-900">{client.nom}</span>
                        ) : (
                            <span className="italic">Client non trouvé</span>
                        )}
                    </div>
                    {client && (
                        <div className="text-xs text-gray-500 ml-6">
                            <div>{client.email}</div>
                            <div>{client.ville}</div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-100' : 'bg-gray-50'}`}>
                        <div className="text-xs text-gray-500 mb-1">Validité</div>
                        <div className={`font-semibold flex items-center text-sm ${
                            isExpired ? 'text-red-600' : 'text-gray-900'
                        }`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(proforma.validite).toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-100' : 'bg-gray-50'}`}>
                        <div className="text-xs text-gray-500 mb-1">Total HT</div>
                        <div className="font-semibold text-sm">
                            {formatCurrency(proforma.totalHT)}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-100' : 'bg-gray-50'}`}>
                        <div className="text-xs text-gray-500 mb-1">TVA</div>
                        <div className="font-semibold text-sm">
                            {formatCurrency(proforma.totalTVA)}
                        </div>
                    </div>
                    <div className={`rounded-lg p-3 ${
                        isExpired ? 'bg-red-200' : 'bg-indigo-50'
                    }`}>
                        <div className={`text-xs mb-1 ${
                            isExpired ? 'text-red-700' : 'text-indigo-600'
                        }`}>Total TTC</div>
                        <div className={`font-bold text-sm ${
                            isExpired ? 'text-red-700' : 'text-indigo-600'
                        }`}>
                            {formatCurrency(proforma.totalTTC)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={onPreview}
                        disabled={actionLoading === `preview-${proforma.numero}`}
                        className="flex-1 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center disabled:opacity-50 text-sm"
                        title="Aperçu"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        <span>Aperçu</span>
                    </button>

                    <button
                        onClick={onDownloadPDF}
                        disabled={actionLoading === `pdf-${proforma.numero}` || !proforma.proforma_pdf}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 text-sm"
                        title="Télécharger PDF"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        <span>PDF</span>
                    </button>

                    {proforma.statut === 'en_attente' && (
                        <>
                            <button
                                onClick={onAccept}
                                disabled={actionLoading === `status-${proforma.numero}`}
                                className="flex-1 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center disabled:opacity-50 text-sm"
                                title="Marquer comme accepté"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                <span>Accepter</span>
                            </button>
                            <button
                                onClick={onReject}
                                disabled={actionLoading === `status-${proforma.numero}`}
                                className="flex-1 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50 text-sm"
                                title="Marquer comme refusé"
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                <span>Refuser</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Avertissement d'expiration */}
                {isExpired && (
                    <div className="mt-3 flex items-center text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Ce proforma a expiré
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProformaCard;