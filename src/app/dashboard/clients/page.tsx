'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Client, PaginationInfo } from '@/utils/types';
import { Plus, Search, X, Users, Frown, List, Grid, Filter, RefreshCw, Download, AlertCircle, CheckCircle, Edit, Trash2, User, Building } from "lucide-react";
import ClientCard from '@/components/customs/ClientCard';
import ClientForm from '@/components/customs/ClientForm';
import clientService from '@/api/client.service';
import { FORMAT_DATE } from '@/utils/constants';
import { toastSuccess, toastError } from '@/utils/libs/toastify';
import ConfirmationModal from '@/components/customs/ConfirmationModal';
import ClientCardSkeleton from '@/components/loaders/ClientCardSkeleton';
import Pagination from '@/components/customs/Pagination';

export default function ClientsPage() {

    const defaultClient = useMemo<Client>(() => ({
        _id: '',
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        codePostal: '',
        siret: '',
        created_at: new Date()
    }), []);

    const [clients, setClients] = useState<Client[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<Client>(defaultClient);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
        total: 0,
        limit: 10,
        page: 1,
        totalPages: 1
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredClients = useMemo(() => {

        let filtered = clients;
        if (debouncedSearchTerm.trim()) {
            const term = debouncedSearchTerm.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.nom.toLowerCase().includes(term) ||
                client.email.toLowerCase().includes(term) ||
                client.ville.toLowerCase().includes(term) ||
                client.telephone.replace(/\s/g, '').includes(term.replace(/\s/g, '')) ||
                (client.siret && client.siret.includes(term))
            );
        }

        if (activeFilter === 'with-siret') {
            filtered = filtered.filter(client => client.siret && client.siret.trim() !== '');
        } else if (activeFilter === 'recent') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            filtered = filtered.filter(client => new Date(client.created_at) > oneMonthAgo);
        }

        return filtered;
    }, [clients, debouncedSearchTerm, activeFilter]);

    const openModal = useCallback((client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                _id: client._id,
                nom: client.nom,
                email: client.email,
                telephone: client.telephone,
                adresse: client.adresse,
                ville: client.ville,
                codePostal: client.codePostal,
                siret: client.siret || '',
                created_at: client.created_at
            });
        } else {
            setEditingClient(null);
            setFormData(defaultClient);
        }
        setShowModal(true);
    }, [defaultClient]);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingClient(null);
        setFormData(defaultClient);
    }, [defaultClient]);

    const fetchClients = useCallback(async (page = 1, showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const response = await clientService.getAll({ page, limit: paginationInfo.limit });
            const data = response.data.data;

            if (!data || !data.content) {
                throw new Error('Format de réponse invalide');
            }

            setClients(data.content);
            setPaginationInfo({
                total: data.paginate.total,
                limit: data.paginate.limit,
                page: data.paginate.page,
                totalPages: Math.ceil(data.paginate.total / data.paginate.limit)
            });
            setCurrentPage(page);

        } catch (error: unknown) {
            console.error('Erreur lors du chargement des clients:', error);
            setError('Impossible de charger les clients. Veuillez réessayer.');
            toastError({
                message: 'Erreur lors du chargement des clients.'
            });
        } finally {
            setLoading(false);
            setInitialLoading(false);
            setIsRefreshing(false);
        }
    }, [paginationInfo.limit]);

    const handleSubmit = useCallback(async () => {
        try {
            const { _id, created_at, ...data } = formData;
            const cleanedData = {
                ...data,
                nom: data.nom.trim(),
                email: data.email.trim().toLowerCase(),
                telephone: data.telephone.trim(),
                adresse: data.adresse.trim(),
                ville: data.ville.trim(),
                codePostal: data.codePostal.trim(),
                siret: data.siret ? data.siret.trim() : ''
            };

            if (!cleanedData.nom || !cleanedData.email || !cleanedData.telephone) {
                toastError({ message: 'Veuillez remplir tous les champs obligatoires.' });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanedData.email)) {
                toastError({ message: 'Veuillez saisir un email valide.' });
                return;
            }

            if (editingClient) {
                await clientService.update(editingClient._id, cleanedData);
                toastSuccess({
                    message: `Client "${cleanedData.nom}" mis à jour avec succès.`
                });
            } else {
                await clientService.create(cleanedData);
                toastSuccess({
                    message: `Client "${cleanedData.nom}" ajouté avec succès.`
                });
            }

            await fetchClients(currentPage);
            closeModal();

        } catch (error: any) {
            console.error('Erreur lors de la sauvegarde:', error);
            const message = error.response?.data?.message || `Erreur lors de ${editingClient ? 'la mise à jour' : 'la création'} du client.`;
            toastError({ message });
            throw error;
        }
    }, [formData, editingClient, currentPage, fetchClients, closeModal]);

    const openDeleteModal = useCallback((client: Client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!clientToDelete) return;

        try {
            await clientService.delete(clientToDelete._id);
            toastSuccess({ message: `Client "${clientToDelete.nom}" supprimé avec succès.` });
            await fetchClients(currentPage);
        } catch (error: any) {
            console.error('Erreur lors de la suppression:', error);
            const message = error.response?.data?.message || 'Erreur lors de la suppression du client.';
            toastError({ message });
        } finally {
            setShowDeleteModal(false);
            setClientToDelete(null);
        }
    }, [clientToDelete, currentPage, fetchClients]);

    const handlePageChange = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= paginationInfo.totalPages && newPage !== currentPage) {
            fetchClients(newPage);
        }
    }, [paginationInfo.totalPages, currentPage, fetchClients]);

    const handleRefresh = useCallback(() => {
        fetchClients(currentPage, true);
    }, [currentPage, fetchClients]);

    const handleExport = useCallback(() => {
        try {
            const csvContent = [
                ['Nom', 'Email', 'Téléphone', 'Ville', 'Code Postal', 'NIU', 'Date de création'].join(';'),
                ...filteredClients.map(client => [
                    client.nom,
                    client.email,
                    client.telephone,
                    client.ville,
                    client.codePostal,
                    client.siret || '',
                    FORMAT_DATE(client.created_at)
                ].join(';'))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toastSuccess({ message: 'Export réalisé avec succès.' });
        } catch (error) {
            toastError({ message: 'Erreur lors de l\'export.' });
        }
    }, [filteredClients]);

    // Chargement initial
    useEffect(() => {
        fetchClients(1);
    }, [fetchClients]);

    // Réinitialiser la pagination lors du changement de filtre/recherche
    useEffect(() => {
        if (currentPage > 1 && (debouncedSearchTerm || activeFilter !== 'all')) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, activeFilter, currentPage]);

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Users className="w-6 h-6 mr-2 text-indigo-600" />
                        Clients
                        {isRefreshing && (
                            <RefreshCw className="w-4 h-4 ml-2 animate-spin text-indigo-600" />
                        )}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {initialLoading ? (
                            'Chargement...'
                        ) : error ? (
                            'Erreur de chargement'
                        ) : (
                            <>
                                Gérez votre base de {paginationInfo.total} client{paginationInfo.total !== 1 ? 's' : ''}
                                {filteredClients.length !== paginationInfo.total && (
                                    <span className="text-indigo-600"> ({filteredClients.length} affiché{filteredClients.length !== 1 ? 's' : ''})</span>
                                )}
                            </>
                        )}
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    {!initialLoading && !error && clients.length > 0 && (
                        <>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50"
                                title="Actualiser"
                            >
                                <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={filteredClients.length === 0}
                                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                                title="Exporter en CSV"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Exporter
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => openModal()}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center w-full md:w-auto justify-center disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <span>Nouveau client</span>
                    </button>
                </div>
            </div>

            {/* Message d'erreur global */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => fetchClients(currentPage)}
                            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {/* Barre de contrôle */}
            {!initialLoading && !error && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 transform w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email, ville, téléphone ou NIU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={loading}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-3 transform p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Effacer la recherche"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <select
                                    value={activeFilter}
                                    onChange={(e) => setActiveFilter(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-w-[160px]"
                                    disabled={loading}
                                >
                                    <option value="all">Tous les clients ({clients.length})</option>
                                    <option value="with-siret">
                                        Avec NIU ({clients.filter(c => c.siret).length})
                                    </option>
                                    <option value="recent">
                                        Ajoutés récemment ({clients.filter(c => {
                                            const oneMonthAgo = new Date();
                                            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                                            return new Date(c.created_at) > oneMonthAgo;
                                        }).length})
                                    </option>
                                </select>
                                <Filter className="absolute right-3 top-3 transform w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    disabled={loading}
                                    className={`px-3 py-2 transition-colors ${viewMode === 'grid'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                        } disabled:opacity-50`}
                                    title="Vue grille"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    disabled={loading}
                                    className={`px-3 py-2 transition-colors border-l border-gray-300 ${viewMode === 'list'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                        } disabled:opacity-50`}
                                    title="Vue liste"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Indicateurs de recherche active */}
                    {(debouncedSearchTerm || activeFilter !== 'all') && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                            {debouncedSearchTerm && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Recherche: &quot;{debouncedSearchTerm}&quot;
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="ml-1 p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {activeFilter !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Filtre: {activeFilter === 'with-siret' ? 'Avec NIU' : 'Récents'}
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className="ml-1 p-0.5 hover:bg-green-200 rounded-full transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Contenu principal */}
            {initialLoading ? (
                // Loader initial
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
                        <div className="flex gap-4">
                            <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
                            <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
                        </div>
                    </div>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <ClientCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                            <div className="p-4 space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : error ? (
                // État d'erreur
                <div className="bg-white rounded-xl shadow-sm border border-red-200 py-16 text-center">
                    <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Erreur de chargement
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        {error}
                    </p>
                    <button
                        onClick={() => fetchClients(1)}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center mx-auto"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Réessayer
                    </button>
                </div>
            ) : filteredClients.length > 0 ? (
                // Liste des clients
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredClients.map((client) => (
                                <ClientCard
                                    key={client._id}
                                    client={client}
                                    onEdit={() => openModal(client)}
                                    onDelete={() => openDeleteModal(client)}
                                    isLoading={loading}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Client
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Localisation
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                NIU
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Création
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredClients.map((client) => {
                                            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email);
                                            return (
                                                <tr key={client._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 flex-shrink-0">
                                                                {client.siret ? (
                                                                    <Building className="w-5 h-5 text-indigo-600" />
                                                                ) : (
                                                                    <User className="w-5 h-5 text-indigo-600" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-gray-900 truncate" title={client.nom}>
                                                                    {client.nom}
                                                                </div>
                                                                <div className={`text-sm truncate flex items-center ${!isValidEmail ? 'text-red-500' : 'text-gray-500'
                                                                    }`} title={client.email}>
                                                                    {!isValidEmail && (
                                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    {client.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900" title={client.telephone}>
                                                            {client.telephone}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900" title={client.ville}>
                                                            {client.ville}
                                                        </div>
                                                        {client.codePostal && (
                                                            <div className="text-sm text-gray-500">
                                                                {client.codePostal}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {client.siret ? (
                                                            <div className="text-sm font-mono text-gray-900 flex items-center">
                                                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                                                {client.siret}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Non renseigné</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {FORMAT_DATE(client.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => openModal(client)}
                                                                disabled={loading}
                                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Modifier"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(client)}
                                                                disabled={loading}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        paginationInfo={paginationInfo}
                        currentPage={currentPage}
                        loading={loading}
                        handlePageChange={handlePageChange}
                    />
                </>
            ) : (
                // État vide
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        {debouncedSearchTerm || activeFilter !== 'all' ? (
                            <Search className="w-12 h-12 text-gray-400" />
                        ) : (
                            <Frown className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {debouncedSearchTerm || activeFilter !== 'all'
                            ? 'Aucun client trouvé'
                            : 'Vous n\'avez pas encore de clients'
                        }
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        {debouncedSearchTerm || activeFilter !== 'all'
                            ? `Aucun client ne correspond aux critères${debouncedSearchTerm ? ` "${debouncedSearchTerm}"` : ''}.`
                            : 'Commencez par ajouter votre premier client pour gérer vos proformas.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {(debouncedSearchTerm || activeFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setActiveFilter('all');
                                }}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                            >
                                <X className="w-5 h-5 mr-2" />
                                Réinitialiser les filtres
                            </button>
                        )}
                        <button
                            onClick={() => openModal()}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Ajouter un client
                        </button>
                    </div>
                </div>
            )}

            {/* Modal pour ajouter/modifier un client */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                {editingClient?.siret ? (
                                    <Building className="w-5 h-5 mr-2 text-indigo-600" />
                                ) : (
                                    <User className="w-5 h-5 mr-2 text-indigo-600" />
                                )}
                                {editingClient ? `Modifier ${editingClient.nom}` : 'Nouveau client'}
                            </h3>
                            <button
                                onClick={closeModal}
                                disabled={loading}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                            <ClientForm
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleSubmit}
                                onCancel={closeModal}
                                isEditing={!!editingClient}
                                isLoading={loading}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete?.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />

            {/* Overlay pour fermer le modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={closeModal}
                />
            )}
        </div>
    );
}