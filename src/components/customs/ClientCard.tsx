import { useState } from 'react';
import { FORMAT_DATE } from "@/utils/constants";
import { Client } from "@/utils/types";
import { 
    User, 
    Mail, 
    Edit, 
    Trash2, 
    Phone, 
    MapPin, 
    Calendar, 
    FileDigit,
    MoreVertical,
    Eye
} from "lucide-react";
import { toastSuccess, toastError, toastInfo } from '@/utils/libs/toastify';

interface ClientCardProps {
    client: Client;
    onEdit: () => void;
    onDelete: () => void;
    onViewProformas?: () => void;
    isLoading?: boolean;
}

const ClientCard = ({
    client,
    onEdit,
    onDelete,
    onViewProformas,
    isLoading = false
}: ClientCardProps) => {
    const [showActions, setShowActions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isDeleting) return;

        const confirmed = window.confirm(
            `Êtes-vous sûr de vouloir supprimer le client "${client.nom}" ?\n\nCette action est irréversible.`
        );
        
        if (!confirmed) return;

        try {
            setIsDeleting(true);
            await onDelete();
            toastSuccess({ 
                message: `Client "${client.nom}" supprimé avec succès.` 
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toastError({ 
                message: 'Erreur lors de la suppression du client.' 
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit();
    };

    const handleViewProformas = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onViewProformas) {
            onViewProformas();
        } else {
            toastInfo({ message: 'Fonctionnalité bientôt disponible' });
        }
    };

    // Validation des données client
    const isValidEmail = client.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email);
    const hasRequiredFields = client.nom && client.email && client.telephone && client.ville;

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
                <div className="p-5">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center">
                            <div className="bg-gray-200 w-10 h-10 rounded-lg mr-3"></div>
                            <div>
                                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-40"></div>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md group">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center flex-1 min-w-0">
                        <div className="bg-indigo-100 p-2 rounded-lg mr-3 flex-shrink-0">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 text-lg truncate" title={client.nom}>
                                {client.nom}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Mail className={`w-4 h-4 mr-1 flex-shrink-0 ${!isValidEmail ? 'text-red-500' : ''}`} />
                                <span className={`truncate ${!isValidEmail ? 'text-red-500' : ''}`} title={client.email}>
                                    {client.email}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Actions desktop */}
                    <div className="hidden sm:flex space-x-1 ml-2">
                        <button
                            onClick={handleEdit}
                            disabled={isDeleting}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Modifier le client"
                            aria-label={`Modifier ${client.nom}`}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer le client"
                            aria-label={`Supprimer ${client.nom}`}
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Menu mobile */}
                    <div className="sm:hidden relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                            aria-label="Options"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showActions && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                <button
                                    onClick={handleEdit}
                                    disabled={isDeleting}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    )}
                                    Supprimer
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Indicateur de données manquantes */}
                {!hasRequiredFields && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            ⚠️ Informations incomplètes
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center min-w-0">
                        <Phone className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-sm truncate" title={client.telephone}>
                            {client.telephone || 'Non renseigné'}
                        </span>
                    </div>
                    <div className="flex items-center min-w-0">
                        <MapPin className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-sm truncate" title={`${client.ville} ${client.codePostal || ''}`}>
                            {client.ville} {client.codePostal && `(${client.codePostal})`}
                        </span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>Créé le {FORMAT_DATE(client.created_at)}</span>
                    </div>
                    {client.siret && (
                        <div className="text-sm flex items-center">
                            <FileDigit className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0" />
                            <span className="font-medium font-mono" title="Numéro SIRET">
                                {client.siret}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={handleViewProformas}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center group"
                    aria-label={`Voir les proformas de ${client.nom}`}
                >
                    <Eye className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Voir les proformas →
                </button>
            </div>

            {showActions && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowActions(false)}
                />
            )}
        </div>
    );
};

export default ClientCard;