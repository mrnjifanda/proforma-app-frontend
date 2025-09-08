'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Panier, Client, PaginationInfo, PartialPanier } from '@/utils/types';
import { Plus, Search, X, ShoppingCart, Filter, Grid, List, RefreshCw, AlertCircle, Download, TrendingUp, Eye } from "lucide-react";
import panierService from '@/api/panier.service';
import clientService from '@/api/client.service';
import PanierCard from '@/components/customs/PanierCard';
import PanierRow from '@/components/customs/PanierRow';
import PanierForm from '@/components/customs/PanierForm';
import ConfirmationModal from '@/components/customs/ConfirmationModal';
import Pagination from '@/components/customs/Pagination';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import { FORMAT_DATE } from '@/utils/constants';
import PanierCardSkeleton from '@/components/customs/PanierCardSkeleton';
import { useRouter } from 'next/navigation';

type FilterPanier = 'all' | 'active' | 'archived' | 'with-client' | 'without-client' | 'empty' | 'non-empty';

export default function PaniersPage() {

  const router = useRouter();
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [paniers, setPaniers] = useState<Panier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [panierToDelete, setPanierToDelete] = useState<Panier | null>(null);
  const [panierToArchive, setPanierToArchive] = useState<Panier | null>(null);
  const [editingPanier, setEditingPanier] = useState<Panier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeFilter, setActiveFilter] = useState<FilterPanier>('all');
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    page: 1,
    totalPages: 1
  });

  const defaultFormData: PartialPanier = useMemo(() => ({
    nom: '',
    client: undefined as Client | undefined,
    currency: ''
  }), []);

  const [formData, setFormData] = useState<PartialPanier>(defaultFormData);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async (page = 1, showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoadingData(true);
      }

      setError(null);

      const [paniersResponse, clientsResponse] = await Promise.all([
        panierService.getAll({ page, limit: paginationInfo.limit }),
        clientService.getAll({ limit: 1000 })
      ]);

      const data = paniersResponse.data.data;
      if (!data || !data.content) {
        throw new Error('Format de réponse invalide');
      }

      setPaniers(data.content);
      setPaginationInfo({
        total: data.paginate.total,
        limit: data.paginate.limit,
        page: data.paginate.page,
        totalPages: Math.ceil(data.paginate.total / data.paginate.limit)
      });
      setCurrentPage(page);

      setClients(clientsResponse.data.data.content || []);

    } catch (err: unknown) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
      toastError({ message: 'Erreur lors du chargement des données.' });
    } finally {
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  }, [paginationInfo.limit]);

  useEffect(() => { fetchData(1); }, []);

  // Filtrer les paniers avec useMemo pour optimiser les performances
  const filteredPaniers = useMemo(() => {
    return paniers.filter(panier => {
      const matchesSearch = (
        (panier.nom && panier.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (panier.client && typeof panier.client === 'object' &&
          panier.client.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (panier._id && panier._id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );

      const matchesFilter = (() => {
        switch (activeFilter) {
          case 'all': return true;
          case 'active': return panier.statut !== false;
          case 'archived': return panier.statut === false;
          case 'with-client': return !!panier.client;
          case 'without-client': return !panier.client;
          case 'empty': return !panier.lignes || panier.lignes.length === 0;
          case 'non-empty': return panier.lignes && panier.lignes.length > 0;
          default: return true;
        }
      })();

      return matchesSearch && matchesFilter;
    });
  }, [paniers, debouncedSearchTerm, activeFilter]);

  // Calculer les statistiques avec useMemo
  const statistics = useMemo(() => {
    const activePaniersCount = paniers.filter(p => p.statut !== false).length;
    const archivedPaniersCount = paniers.filter(p => p.statut === false).length;
    const withClientCount = paniers.filter(p => !!p.client).length;
    const emptyPaniersCount = paniers.filter(p => !p.lignes || p.lignes.length === 0).length;
    const totalValue = paniers.reduce((sum, p) => sum + (p.totalTTC || 0), 0);
    const avgValue = paniers.length > 0 ? totalValue / paniers.length : 0;

    return {
      activePaniersCount,
      archivedPaniersCount,
      withClientCount,
      emptyPaniersCount,
      totalValue,
      avgValue
    };
  }, [paniers]);

  const openModal = useCallback((panier?: Panier) => {
    if (panier) {
      setEditingPanier(panier);
      setFormData({
        nom: panier.nom || '',
        client: typeof panier.client === 'object' ? panier.client : undefined,
        currency: panier.currency || ''
      });
    } else {
      setEditingPanier(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  }, [defaultFormData]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingPanier(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {

      if (!formData.nom.trim()) {
        toastError({ message: 'Le nom du panier est obligatoire.' });
        return;
      }

      if (typeof formData.currency === "string" && !formData.currency.trim()) {
        toastError({ message: 'La monnaie du panier est obligatoire.' });
        return;
      }

      const data = {
        nom: formData.nom.trim(),
        client: formData.client?._id,
        currency: typeof formData.currency === "object" ? formData.currency._id : formData.currency
      };

      if (editingPanier) {
        await panierService.update(editingPanier._id!, data);
        toastSuccess({ message: 'Devis mis à jour avec succès.' });
      } else {
        await panierService.create(data);
        toastSuccess({ message: 'Devis créé avec succès.' });
      }
      await fetchData(currentPage);
      closeModal();
    } catch (err: unknown) {
      console.error('Erreur lors de la sauvegarde:', err);
      const message = err instanceof Error ? err.message :
        `Erreur lors de ${editingPanier ? 'la mise à jour' : 'la création'} du devis.`;
      toastError({ message });
    }
  }, [editingPanier, formData, currentPage, fetchData, closeModal]);

  const openDeleteModal = useCallback((panier: Panier) => {
    setPanierToDelete(panier);
    setShowDeleteModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!panierToDelete) return;

    try {
      await panierService.delete(panierToDelete._id!);
      toastSuccess({ message: 'Panier supprimé avec succès.' });
      await fetchData(currentPage);
    } catch (err: unknown) {
      console.error('Erreur lors de la suppression:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du panier.';
      toastError({ message });
    } finally {
      setShowDeleteModal(false);
      setPanierToDelete(null);
    }
  }, [panierToDelete, currentPage, fetchData]);

  const openArchiveModal = useCallback((panier: Panier) => {
    setPanierToArchive(panier);
    setShowArchiveModal(true);
  }, []);

  const handleArchive = useCallback(async () => {
    if (!panierToArchive) return;

    try {

      await panierService.update(panierToArchive._id!, {
        nom: panierToArchive.nom,
        client: panierToArchive.client?._id,
        currency: typeof panierToArchive.currency === "object" ? panierToArchive.currency._id : panierToArchive.currency,
        statut: panierToArchive.statut === false ? true : false
      });

      const action = panierToArchive.statut === false ? 'désarchivé' : 'archivé';
      toastSuccess({ message: `Devis ${action} avec succès.` });
      await fetchData(currentPage, true);
    } catch (err: unknown) {
      console.error('Erreur lors de l\'archivage:', err);
      toastError({ message: 'Erreur lors de l\'archivage du devis.' });
    } finally {
      setShowArchiveModal(false);
      setPanierToArchive(null);
    }
  }, [panierToArchive, currentPage, fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData(currentPage, true);
  }, [currentPage, fetchData]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= paginationInfo.totalPages && newPage !== currentPage) {
      fetchData(newPage);
    }
  }, [paginationInfo.totalPages, currentPage, fetchData]);

  const handleExport = useCallback(() => {
    try {
      const csvContent = [
        ['ID', 'Nom', 'Client', 'Nb Lignes', 'Total HT', 'Total TTC', 'Statut', 'Date de création'].join(';'),
        ...filteredPaniers.map(panier => [
          panier._id || '',
          panier.nom || '',
          typeof panier.client === 'object' ? panier.client.nom : '',
          panier.lignes ? panier.lignes.length.toString() : '0',
          (panier.totalHT || 0).toString(),
          (panier.totalTTC || 0).toString(),
          panier.statut === false ? 'Archivé' : 'Actif',
          panier.created_at ? FORMAT_DATE(panier.created_at) : ''
        ].join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `devis_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSuccess({ message: 'Export réalisé avec succès.' });
    } catch (error) {
      toastError({ message: 'Erreur lors de l\'export.' });
    }
  }, [filteredPaniers]);

  // Réinitialiser la pagination lors du changement de filtre/recherche
  useEffect(() => {
    if (currentPage > 1 && (debouncedSearchTerm || activeFilter !== 'all')) {
      setCurrentPage(1);
      fetchData(1);
    }
  }, [debouncedSearchTerm, activeFilter]);

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2 text-blue-600" />
              Devis
            </h1>
            <p className="text-gray-600 mt-1">Chargement en cours...</p>
          </div>
          <div className="w-40 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <PanierCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2 text-blue-600" />
            Devis
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 ml-2 animate-spin text-blue-600" />
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {error ? (
              'Erreur de chargement'
            ) : (
              <>
                Gérez vos {paginationInfo.total} devis{paginationInfo.total !== 1 ? 's' : ''}
                {filteredPaniers.length !== paginationInfo.total && (
                  <span className="text-blue-600"> ({filteredPaniers.length} affiché{filteredPaniers.length !== 1 ? 's' : ''})</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          {!isLoadingData && !error && paniers.length > 0 && (
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
                disabled={filteredPaniers.length === 0}
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
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>Nouveau devis</span>
          </button>
        </div>
      </div>

      {/* Message d'erreur global */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 font-bold text-2xl">{paginationInfo.total}</div>
              <div className="text-sm text-blue-800">Devis au total</div>
            </div>
            <div className="bg-blue-200 p-2 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 font-bold text-2xl">
                {statistics.activePaniersCount}
              </div>
              <div className="text-sm text-green-800">Devis actifs</div>
            </div>
            <div className="bg-green-200 p-2 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-600 font-bold text-2xl">
                {statistics.withClientCount}
              </div>
              <div className="text-sm text-orange-800">Avec client</div>
            </div>
            <div className="bg-orange-200 p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 font-bold text-2xl">
                {statistics.totalValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </div>
              <div className="text-sm text-purple-800">Valeur totale</div>
            </div>
            <div className="bg-purple-200 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de contrôle */}
      {!isLoadingData && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 transform w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, client ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  onChange={(e) => setActiveFilter(e.target.value as FilterPanier)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[180px]"
                >
                  <option value="all">Tous ({paginationInfo.total})</option>
                  <option value="active">Actifs ({statistics.activePaniersCount})</option>
                  <option value="archived">Archivés ({statistics.archivedPaniersCount})</option>
                  <option value="with-client">Avec client ({statistics.withClientCount})</option>
                  <option value="without-client">Sans client ({paginationInfo.total - statistics.withClientCount})</option>
                  <option value="empty">Vides ({statistics.emptyPaniersCount})</option>
                  <option value="non-empty">Non vides ({paginationInfo.total - statistics.emptyPaniersCount})</option>
                </select>
                <Filter className="absolute right-3 top-3 transform w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 transition-colors ${viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Vue grille"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 transition-colors border-l border-gray-300 ${viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Vue tableau"
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
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Recherche: &quot;{debouncedSearchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Filtre: {
                    activeFilter === 'active' ? 'Actifs seulement' :
                      activeFilter === 'archived' ? 'Archivés seulement' :
                        activeFilter === 'with-client' ? 'Avec client' :
                          activeFilter === 'without-client' ? 'Sans client' :
                            activeFilter === 'empty' ? 'Vides' :
                              activeFilter === 'non-empty' ? 'Non vides' : ''
                  }
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

      {/* Liste des paniers */}
      {filteredPaniers.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPaniers.map((panier) => (
                <PanierCard
                  key={panier._id}
                  panier={panier}
                  onOpen={() => { router.push(`/dashboard/devis/contenu/?id=${panier._id}`); }}
                  onEdit={() => openModal(panier)}
                  onArchive={() => openArchiveModal(panier)}
                  onDelete={() => openDeleteModal(panier)}
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
                        Devis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lignes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total TTC
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPaniers.map((panier) => (
                      <PanierRow
                        key={panier._id}
                        panier={panier}
                        onOpen={() => { router.push(`/dashboard/devis/contenu/?id=${panier._id}`); }}
                        onEdit={() => openModal(panier)}
                        onArchive={() => openArchiveModal(panier)}
                        onDelete={() => openDeleteModal(panier)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            paginationInfo={paginationInfo}
            currentPage={currentPage}
            loading={false}
            handlePageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
            {debouncedSearchTerm || activeFilter !== 'all' ? (
              <Search className="w-12 h-12 text-gray-400" />
            ) : (
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {debouncedSearchTerm || activeFilter !== 'all'
              ? 'Aucun devis trouvé'
              : 'Aucun devis créé'
            }
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {debouncedSearchTerm || activeFilter !== 'all'
              ? `Aucun devis ne correspond aux critères${debouncedSearchTerm ? ` "${debouncedSearchTerm}"` : ''}.`
              : 'Commencez par créer votre premier devis.'}
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
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer un devis
            </button>
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier un panier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
                {editingPanier ? 'Modifier le devis' : 'Nouveau devis'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <PanierForm
                formData={formData}
                setFormData={setFormData}
                clients={clients}
                onSubmit={handleSubmit}
                onCancel={closeModal}
                isEditing={!!editingPanier}
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
        message={`Êtes-vous sûr de vouloir supprimer le devis "${panierToDelete?.nom}" ? Cette action est irréversible et supprimera toutes les lignes associées.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Modal de confirmation d'archivage */}
      <ConfirmationModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchive}
        title={panierToArchive?.statut === false ? "Confirmer la désarchivage" : "Confirmer l'archivage"}
        message={`Êtes-vous sûr de vouloir ${panierToArchive?.statut === false ? 'désarchiver' : 'archiver'} le devis "${panierToArchive?.nom}" ?`}
        confirmText={panierToArchive?.statut === false ? "Désarchiver" : "Archiver"}
        cancelText="Annuler"
        variant={panierToArchive?.statut === false ? "success" : "warning"}
      />
    </div>
  );
}
