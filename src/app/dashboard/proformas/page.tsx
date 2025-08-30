'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Search, X, Grid, List, RefreshCw, AlertCircle, Download, TrendingUp, Eye, Filter } from "lucide-react";

import { Proforma, PaginationInfo } from '@/utils/types';
import { toastError, toastInfo, toastSuccess } from '@/utils/libs/toastify';
import { useAuth } from '@/utils/contexts/AuthContext';
import proformaService from '@/api/proforma.service';
import ProformaCard from '@/components/customs/ProformaCard';
import ProformaRow from '@/components/customs/ProformaRow';
import ConfirmationModal from '@/components/customs/ConfirmationModal';
import Pagination from '@/components/customs/Pagination';
import ProformaPreviewModal from '@/components/customs/ProformaPreviewModal';
import ProformaCardSkeleton from '@/components/customs/ProformaCardSkeleton';

type FilterProforma = 'all' | 'en_attente' | 'accepte' | 'refuse' | 'expire' | 'expired_today';

export default function ProformasPage() {
  const { entreprise } = useAuth();

  // States principaux
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewProforma, setPreviewProforma] = useState<Proforma | null>(null);
  const [proformaToDelete, setProformaToDelete] = useState<Proforma | null>(null);

  // Recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeFilter, setActiveFilter] = useState<FilterProforma>('all');

  // États de chargement pour les actions
  const [actionLoading, setActionLoading] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    page: 1,
    totalPages: 1
  });

  // Debounce pour la recherche
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

      const response = await proformaService.getAll({ page, limit: paginationInfo.limit });
      const data = response.data.data;

      if (!data || !data.content) {
        throw new Error('Format de réponse invalide');
      }

      setProformas(data.content);
      setPaginationInfo({
        total: data.paginate.total,
        limit: data.paginate.limit,
        page: data.paginate.page,
        totalPages: Math.ceil(data.paginate.total / data.paginate.limit)
      });
      setCurrentPage(page);

    } catch (err: unknown) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
      toastError({ message: 'Erreur lors du chargement des proformas.' });
    } finally {
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  }, [paginationInfo.limit]);

  useEffect(() => {
    fetchData(1);
  }, []);

  // Filtrer les proformas avec useMemo pour optimiser les performances
  const filteredProformas = useMemo(() => {
    return proformas.filter(proforma => {
      const client = typeof proforma.client === 'object' ? proforma.client : null;
      const clientNom = client?.nom || '';
      const clientEmail = client?.email || '';
      const clientVille = client?.ville || '';

      const matchesSearch = (
        proforma.numero.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        clientNom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        clientEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        clientVille.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );

      const matchesFilter = (() => {
        const today = new Date();
        const validite = new Date(proforma.validite);
        const isExpiredToday = validite.toDateString() === today.toDateString() && validite < today;

        switch (activeFilter) {
          case 'all': return true;
          case 'en_attente': return proforma.statut === 'en_attente';
          case 'accepte': return proforma.statut === 'accepte';
          case 'refuse': return proforma.statut === 'refuse';
          case 'expire': return proforma.statut === 'expire' || validite < today;
          case 'expired_today': return isExpiredToday;
          default: return true;
        }
      })();

      return matchesSearch && matchesFilter;
    });
  }, [proformas, debouncedSearchTerm, activeFilter]);

  // Calculer les statistiques avec useMemo
  const statistics = useMemo(() => {
    const today = new Date();
    const enAttenteCount = proformas.filter(p => p.statut === 'en_attente').length;
    const accepteCount = proformas.filter(p => p.statut === 'accepte').length;
    const refuseCount = proformas.filter(p => p.statut === 'refuse').length;
    const expiredCount = proformas.filter(p => new Date(p.validite) < today || p.statut === 'expire').length;
    const totalValue = proformas.reduce((sum, p) => sum + (p.totalTTC || 0), 0);

    return {
      enAttenteCount,
      accepteCount,
      refuseCount,
      expiredCount,
      totalValue
    };
  }, [proformas]);

  const openPreview = useCallback(async (proforma: Proforma) => {
    try {
      setActionLoading(`preview-${proforma.numero}`);
      setPreviewProforma(proforma);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement du détail:', error);
      toastError({ message: 'Erreur lors du chargement du proforma' });
    } finally {
      setActionLoading('');
    }
  }, []);

  const updateProformaStatus = useCallback(async (id: string, status: Proforma['statut']) => {
    try {

      setActionLoading(`status-${id}`);
      await proformaService.update(id, { statut: status });

      setProformas(prev => prev.map(p =>
        p._id === id ? { ...p, statut: status } : p
      ));

      const statusLabels = {
        en_attente: 'En attente',
        accepte: 'Accepté',
        refuse: 'Refusé',
        expire: 'Expiré'
      };

      toastSuccess({ message: `Statut mis à jour: ${statusLabels[status]}` });
      await fetchData(currentPage, true);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toastError({ message: 'Erreur lors de la mise à jour du statut' });
    } finally {
      setActionLoading('');
    }
  }, [currentPage, fetchData]);

  const openDeleteModal = useCallback((proforma: Proforma) => {
    setProformaToDelete(proforma);
    setShowDeleteModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!proformaToDelete) return;

    try {
      setActionLoading(`delete-${proformaToDelete.numero}`);
      await proformaService.delete(proformaToDelete._id as string);
      toastSuccess({ message: 'Proforma supprimé avec succès.' });
      await fetchData(currentPage);
    } catch (err: unknown) {
      console.error('Erreur lors de la suppression:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du proforma.';
      toastError({ message });
    } finally {
      setShowDeleteModal(false);
      setProformaToDelete(null);
      setActionLoading('');
    }
  }, [proformaToDelete, currentPage, fetchData]);

  const downloadPDF = useCallback(async (proforma: Proforma) => {
    try {
      if (!proforma?.proforma_pdf || proforma.proforma_pdf == null) {
        toastError({ message: 'Vous devez d\'abord générer le PDF' });
        return false;
      }

      setActionLoading(`pdf-${proforma.numero}`);
      const proforma_pdf = proforma.proforma_pdf;
      await proformaService.downloadPDF(proforma_pdf, `proforma-${proforma.numero}.pdf`);

      toastSuccess({ message: 'PDF téléchargé avec succès' });
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      toastError({ message: 'Erreur lors du téléchargement du PDF' });
    } finally {
      setActionLoading('');
    }
  }, []);

  const generateAndDownloadPDF = useCallback(async (proforma: Proforma) => {
    try {
      setActionLoading(`pdf-${proforma.numero}`);

      const generateResponse = await proformaService.generatePDF(proforma._id as string);
      const data = generateResponse.data.data;

      if (data?.url) {
        await proformaService.downloadPDF(data?.url, `proforma-${proforma.numero}.pdf`);
        toastSuccess({ message: 'PDF généré et téléchargé avec succès' });
      } else {
        throw new Error('URL du PDF non reçue');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toastError({ message: 'Erreur lors de la génération du PDF' });
    } finally {
      setActionLoading('');
    }
  }, []);

  const sendByEmail = useCallback(async (proforma: Proforma) => {
    try {
      
      setActionLoading(`send-email-${proforma.numero}`);
      await proformaService.sendMail(proforma._id as string);
      toastSuccess({ message: 'Email envoyé avec succès.' });
    } catch (error) {

      console.error('Erreur lors de l\'envoi de l\'email:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response;
        if (response && typeof response === 'object' && 'data' in response && response.data && typeof response.data === 'object' && 'message' in response.data) {
          toastInfo({ message: response.data.message as string || 'Erreur lors de l\'envoi de l\'email' });
        } else {
          toastError({ message: 'Erreur lors de l\'envoi de l\'email' });
        }
      } else {

        toastError({ message: 'Erreur lors de l\'envoi de l\'email' });
      }
    } finally {
      setActionLoading('');
    }
  }, []);

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
        ['Numéro', 'Client', 'Validité', 'Total HT', 'Total TTC', 'Statut', 'Date de création'].join(';'),
        ...filteredProformas.map(proforma => {
          const client = typeof proforma.client === 'object' ? proforma.client : null;
          return [
            proforma.numero || '',
            client?.nom || '',
            new Date(proforma.validite).toLocaleDateString('fr-FR'),
            (proforma.totalHT || 0).toString(),
            (proforma.totalTTC || 0).toString(),
            proforma.statut || '',
            proforma._id ? '' : '' // Vous pouvez ajouter created_at si disponible
          ].join(';');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `proformas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSuccess({ message: 'Export réalisé avec succès.' });
    } catch (error) {
      toastError({ message: 'Erreur lors de l\'export.' });
    }
  }, [filteredProformas]);

  // Réinitialiser la pagination lors du changement de filtre/recherche
  useEffect(() => {
    if (currentPage > 1 && (debouncedSearchTerm || activeFilter !== 'all')) {
      setCurrentPage(1);
      fetchData(1);
    }
  }, [debouncedSearchTerm, activeFilter]);

  const getFilterCount = (filter: FilterProforma): number => {
    switch (filter) {
      case 'all': return paginationInfo.total;
      case 'en_attente': return statistics.enAttenteCount;
      case 'accepte': return statistics.accepteCount;
      case 'refuse': return statistics.refuseCount;
      case 'expire': return statistics.expiredCount;
      case 'expired_today': return proformas.filter(p => {
        const today = new Date();
        const validite = new Date(p.validite);
        return validite.toDateString() === today.toDateString() && validite < today;
      }).length;
      default: return 0;
    }
  };

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-indigo-600" />
              Proformas
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
            <ProformaCardSkeleton key={i} />
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
            <FileText className="w-6 h-6 mr-2 text-indigo-600" />
            Proformas
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 ml-2 animate-spin text-indigo-600" />
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {error ? (
              'Erreur de chargement'
            ) : (
              <>
                Gérez vos {paginationInfo.total} proforma{paginationInfo.total !== 1 ? 's' : ''}
                {filteredProformas.length !== paginationInfo.total && (
                  <span className="text-indigo-600"> ({filteredProformas.length} affiché{filteredProformas.length !== 1 ? 's' : ''})</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          {!isLoadingData && !error && proformas.length > 0 && (
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
                disabled={filteredProformas.length === 0}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                title="Exporter en CSV"
              >
                <Download className="w-5 h-5 mr-2" />
                Exporter
              </button>
            </>
          )}
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
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-indigo-600 font-bold text-2xl">{paginationInfo.total}</div>
              <div className="text-sm text-indigo-800">Proformas au total</div>
            </div>
            <div className="bg-indigo-200 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-yellow-600 font-bold text-2xl">
                {statistics.enAttenteCount}
              </div>
              <div className="text-sm text-yellow-800">En attente</div>
            </div>
            <div className="bg-yellow-200 p-2 rounded-lg">
              <Eye className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 font-bold text-2xl">
                {statistics.accepteCount}
              </div>
              <div className="text-sm text-green-800">Acceptés</div>
            </div>
            <div className="bg-green-200 p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 font-bold text-2xl">
                {statistics.totalValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
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
                placeholder="Rechercher par numéro, client ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  onChange={(e) => setActiveFilter(e.target.value as FilterProforma)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-w-[180px]"
                >
                  <option value="all">Tous ({getFilterCount('all')})</option>
                  <option value="en_attente">En attente ({getFilterCount('en_attente')})</option>
                  <option value="accepte">Acceptés ({getFilterCount('accepte')})</option>
                  <option value="refuse">Refusés ({getFilterCount('refuse')})</option>
                  <option value="expire">Expirés ({getFilterCount('expire')})</option>
                  <option value="expired_today">Expirés aujourd&apos;hui ({getFilterCount('expired_today')})</option>
                </select>
                <Filter className="absolute right-3 top-3 transform w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 transition-colors ${viewMode === 'grid'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Vue grille"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 transition-colors border-l border-gray-300 ${viewMode === 'list'
                    ? 'bg-indigo-100 text-indigo-700'
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
                  Filtre: {
                    activeFilter === 'en_attente' ? 'En attente' :
                      activeFilter === 'accepte' ? 'Acceptés' :
                        activeFilter === 'refuse' ? 'Refusés' :
                          activeFilter === 'expire' ? 'Expirés' :
                            activeFilter === 'expired_today' ? 'Expirés aujourd\'hui' : ''
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

      {/* Liste des proformas */}
      {filteredProformas.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProformas.map((proforma) => (
                <ProformaCard
                  key={proforma.numero}
                  proforma={proforma}
                  onPreview={() => openPreview(proforma)}
                  onDownloadPDF={() => downloadPDF(proforma)}
                  onAccept={() => updateProformaStatus(proforma?._id as string, 'accepte')}
                  onReject={() => updateProformaStatus(proforma._id as string, 'refuse')}
                  onDelete={() => openDeleteModal(proforma)}
                  actionLoading={actionLoading}
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
                        Numéro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total TTC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProformas.map((proforma) => (
                      <ProformaRow
                        key={proforma.numero}
                        proforma={proforma}
                        onPreview={() => openPreview(proforma)}
                        onDownloadPDF={() => downloadPDF(proforma)}
                        onAccept={() => updateProformaStatus(proforma._id as string, 'accepte')}
                        onReject={() => updateProformaStatus(proforma._id as string, 'refuse')}
                        onDelete={() => openDeleteModal(proforma)}
                        actionLoading={actionLoading}
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
              <FileText className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {debouncedSearchTerm || activeFilter !== 'all'
              ? 'Aucun proforma trouvé'
              : 'Aucun proforma créé'
            }
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {debouncedSearchTerm || activeFilter !== 'all'
              ? `Aucun proforma ne correspond aux critères${debouncedSearchTerm ? ` "${debouncedSearchTerm}"` : ''}.`
              : 'Aucun proforma n\'a encore été créé.'}
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
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le proforma "${proformaToDelete?.numero}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Modal d'aperçu */}
      {showPreviewModal && previewProforma && (
        <ProformaPreviewModal
          proforma={previewProforma}
          entreprise={entreprise}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onDownloadPDF={() => downloadPDF(previewProforma)}
          onGenerateAndDownloadPDF={() => generateAndDownloadPDF(previewProforma)}
          onSendByEmail={() => sendByEmail(previewProforma)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}