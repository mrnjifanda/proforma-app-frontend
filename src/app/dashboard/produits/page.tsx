'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Panier, Produit, PaginationInfo, FilterProduct } from '@/utils/types';
import produitService from '@/api/produit.service';
import { Plus, Search, X, Package, Filter, Grid, List, RefreshCw, AlertCircle, Download, TrendingUp, Eye } from "lucide-react";
import ProductCard from '@/components/customs/ProductCard';
import ProductRow from '@/components/customs/ProductRow';
import ProductForm from '@/components/customs/ProductForm';
import AddToCartModal from '@/components/customs/AddToCartModal';
import ConfirmationModal from '@/components/customs/ConfirmationModal';
import Pagination from '@/components/customs/Pagination';
import panierService from '@/api/panier.service';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import { FORMAT_DATE } from '@/utils/constants';

export default function ProduitsPage() {

    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isLoadingAddLine, setIsLoadingAddLine] = useState<boolean>(false);
    const [paniers, setPaniers] = useState<Panier[]>([]);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddToCartModal, setShowAddToCartModal] = useState(false);
    const [produitToDelete, setProduitToDelete] = useState<Produit | null>(null);
    const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
    const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [activeFilter, setActiveFilter] = useState<FilterProduct>('all');
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
        total: 0,
        limit: 10,
        page: 1,
        totalPages: 1
    });

    const defaultFormData = useMemo<Produit>(() => ({
        reference: '',
        _id: '',
        nom: '',
        description: '',
        prixUnitaireHT: 0,
        tauxTVA: 20,
        stock: 0,
        actif: true
    }), []);

    const [formData, setFormData] = useState<Produit>(defaultFormData);
    const [formAddLine, setFormAddLine] = useState<{ panierId: string; quantite: number; }>({ panierId: '', quantite: 1 });

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

            const [produitsResponse, paniersResponse] = await Promise.all([
                produitService.getAll({ page, limit: paginationInfo.limit }),
                panierService.getAll({ limit: 1000 })
            ]);

            const data = produitsResponse.data.data;
            if (!data || !data.content) {
                throw new Error('Format de réponse invalide');
            }

            setProduits(data.content);
            setPaginationInfo({
                total: data.paginate.total,
                limit: data.paginate.limit,
                page: data.paginate.page,
                totalPages: Math.ceil(data.paginate.total / data.paginate.limit)
            });
            setCurrentPage(page);

            setPaniers(paniersResponse.data.data.content);

            if (paniersResponse.data.data.content.length > 0) {
                setFormAddLine(prev => ({
                    ...prev,
                    panierId: paniersResponse.data.data.content[0]._id
                }));
            }
        } catch (err: unknown) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Impossible de charger les données. Veuillez réessayer.');
            toastError({ message: 'Erreur lors du chargement des données.' });
        } finally {
            setIsLoadingData(false);
            setIsRefreshing(false);
        }
    }, [paginationInfo.limit]);

    useEffect(() => {
        fetchData(1);
    }, []);

    // Filtrer les produits avec useMemo pour optimiser les performances
    const filteredProduits = useMemo(() => {
        return produits.filter(produit => {
            const matchesSearch =
                produit.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (produit.description && produit.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                (produit.reference && produit.reference.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

            const matchesFilter =
                activeFilter === 'all' ? true :
                activeFilter === 'active' ? produit.actif :
                activeFilter === 'inactive' ? !produit.actif :
                activeFilter === 'low-stock' ? produit.stock <= 10 && produit.stock > 0 :
                activeFilter === 'out-of-stock' ? produit.stock === 0 : true;

            return matchesSearch && matchesFilter;
        });
    }, [produits, debouncedSearchTerm, activeFilter]);

    // Calculer les statistiques avec useMemo
    const statistics = useMemo(() => {
        const activeProductsCount = produits.filter(p => p.actif).length;
        const inactiveProductsCount = produits.filter(p => !p.actif).length;
        const lowStockProductsCount = produits.filter(p => p.stock <= 10 && p.stock > 0).length;
        const outOfStockProductsCount = produits.filter(p => p.stock === 0).length;
        const totalValue = produits.reduce((sum, p) => sum + (p.prixUnitaireHT * p.stock), 0);
        const avgPrice = produits.length > 0 ? produits.reduce((sum, p) => sum + p.prixUnitaireHT, 0) / produits.length : 0;

        return { 
            activeProductsCount, 
            inactiveProductsCount,
            lowStockProductsCount, 
            outOfStockProductsCount,
            totalValue,
            avgPrice
        };
    }, [produits]);

    const openModal = useCallback((produit?: Produit) => {
        if (produit) {
            setEditingProduit(produit);
            setFormData({
                reference: produit.reference,
                _id: produit._id,
                nom: produit.nom,
                description: produit.description || '',
                prixUnitaireHT: produit.prixUnitaireHT,
                tauxTVA: produit.tauxTVA,
                stock: produit.stock,
                actif: produit.actif
            });
        } else {
            setEditingProduit(null);
            setFormData(defaultFormData);
        }
        setShowModal(true);
    }, [defaultFormData]);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingProduit(null);
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            if (editingProduit) {
                const { _id, __v, updated_at, entreprise, deleted_at, created_at, ...data } = formData;
                await produitService.update(editingProduit._id, data);
                toastSuccess({ message: 'Produit mis à jour avec succès.' });
            } else {
                const { _id, ...data } = formData;
                await produitService.create(data);
                toastSuccess({ message: 'Produit créé avec succès.' });
            }
            await fetchData(currentPage);
            closeModal();
        } catch (err: unknown) {
            console.error('Erreur lors de la sauvegarde:', err);
            const message = err instanceof Error ? err.message :
                `Erreur lors de ${editingProduit ? 'la mise à jour' : 'la création'} du produit.`;
            toastError({ message });
        }
    }, [editingProduit, formData, currentPage, fetchData, closeModal]);

    const openDeleteModal = useCallback((produit: Produit) => {
        setProduitToDelete(produit);
        setShowDeleteModal(true);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!produitToDelete) return;

        try {
            await produitService.delete(produitToDelete._id);
            toastSuccess({ message: 'Produit supprimé avec succès.' });
            await fetchData(currentPage);
        } catch (err: unknown) {
            console.error('Erreur lors de la suppression:', err);
            const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du produit.';
            toastError({ message });
        } finally {
            setShowDeleteModal(false);
            setProduitToDelete(null);
        }
    }, [produitToDelete, currentPage, fetchData]);

    const toggleActif = useCallback(async (produit: Produit) => {
        try {
            const updatedProduit = { ...produit, actif: !produit.actif };
            const { _id, __v, updated_at, entreprise, deleted_at, created_at, ...data } = updatedProduit;
            await produitService.update(produit._id, data);
            await fetchData(currentPage, true);
            toastSuccess({ message: `Produit ${data.actif ? 'activé' : 'désactivé'} avec succès.` });
        } catch (err: unknown) {
            console.error('Erreur lors du changement d\'état:', err);
            toastError({ message: 'Erreur lors du changement d\'état du produit.' });
        }
    }, [currentPage, fetchData]);

    const openAddToCartModal = useCallback((produit: Produit) => {
        setSelectedProduit(produit);
        setFormAddLine({
            panierId: paniers.length > 0 ? paniers[0]._id as string : '',
            quantite: 1
        });
        setShowAddToCartModal(true);
    }, [paniers]);

    const handleAddToCart = useCallback(async () => {
        if (!selectedProduit) return;

        try {
            setIsLoadingAddLine(true);
            await panierService.addLigne(formAddLine.panierId, selectedProduit._id, formAddLine.quantite);
            toastSuccess({ message: "Produit ajouté au devis avec succès." });
            setShowAddToCartModal(false);
        } catch (err: unknown) {
            console.error('Erreur lors de l\'ajout au panier:', err);
            const message = err instanceof Error ? err.message : "Une erreur s'est produite lors de l'ajout au panier.";
            toastError({ message });
        } finally {
            setIsLoadingAddLine(false);
        }
    }, [selectedProduit, formAddLine]);

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
                ['Référence', 'Nom', 'Description', 'Prix HT', 'TVA (%)', 'Prix TTC', 'Stock', 'Statut', 'Date de création'].join(';'),
                ...filteredProduits.map(produit => [
                    produit.reference || '',
                    produit.nom,
                    produit.description || '',
                    produit.prixUnitaireHT.toString(),
                    produit.tauxTVA.toString(),
                    (produit.prixUnitaireHT * (1 + produit.tauxTVA / 100)).toString(),
                    produit.stock.toString(),
                    produit.actif ? 'Actif' : 'Inactif',
                    produit.created_at ? FORMAT_DATE(produit.created_at) : ''
                ].join(';'))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `produits_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toastSuccess({ message: 'Export réalisé avec succès.' });
        } catch (error) {
            toastError({ message: 'Erreur lors de l\'export.' });
        }
    }, [filteredProduits]);

    // Réinitialiser la pagination lors du changement de filtre/recherche
    useEffect(() => {
        if (currentPage > 1 && (debouncedSearchTerm || activeFilter !== 'all')) {
            setCurrentPage(1);
            fetchData(1);
        }
    }, [debouncedSearchTerm, activeFilter]);

    // Squelette de chargement pour les cartes
    const ProductCardSkeleton = () => (
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
        </div>
    );

    if (isLoadingData) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Package className="w-6 h-6 mr-2 text-blue-600" />
                            Produits
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
                        <ProductCardSkeleton key={i} />
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
                        <Package className="w-6 h-6 mr-2 text-blue-600" />
                        Produits
                        {isRefreshing && (
                            <RefreshCw className="w-4 h-4 ml-2 animate-spin text-blue-600" />
                        )}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {error ? (
                            'Erreur de chargement'
                        ) : (
                            <>
                                Gérez votre catalogue de {paginationInfo.total} produit{paginationInfo.total !== 1 ? 's' : ''}
                                {filteredProduits.length !== paginationInfo.total && (
                                    <span className="text-blue-600"> ({filteredProduits.length} affiché{filteredProduits.length !== 1 ? 's' : ''})</span>
                                )}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    {!isLoadingData && !error && produits.length > 0 && (
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
                                disabled={filteredProduits.length === 0}
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
                        <span>Nouveau produit</span>
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

            {/* Statistiques améliorées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-blue-600 font-bold text-2xl">{paginationInfo.total}</div>
                            <div className="text-sm text-blue-800">Produits au total</div>
                        </div>
                        <div className="bg-blue-200 p-2 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-green-600 font-bold text-2xl">
                                {statistics.activeProductsCount}
                            </div>
                            <div className="text-sm text-green-800">Produits actifs</div>
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
                                {statistics.lowStockProductsCount}
                            </div>
                            <div className="text-sm text-orange-800">Stock faible (≤10)</div>
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
                            <div className="text-sm text-purple-800">Valeur du stock</div>
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
                                placeholder="Rechercher par nom, description ou référence..."
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
                                    onChange={(e) => setActiveFilter(e.target.value as FilterProduct)}
                                    className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[180px]"
                                >
                                    <option value="all">Tous ({paginationInfo.total})</option>
                                    <option value="active">Actifs ({statistics.activeProductsCount})</option>
                                    <option value="inactive">Inactifs ({statistics.inactiveProductsCount})</option>
                                    <option value="low-stock">Stock faible ({statistics.lowStockProductsCount})</option>
                                    <option value="out-of-stock">Rupture ({statistics.outOfStockProductsCount})</option>
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
                                        activeFilter === 'inactive' ? 'Inactifs seulement' :
                                        activeFilter === 'low-stock' ? 'Stock faible' :
                                        activeFilter === 'out-of-stock' ? 'Rupture de stock' : ''
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

            {/* Liste des produits */}
            {filteredProduits.length > 0 ? (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredProduits.map((produit) => (
                                <ProductCard
                                    key={produit._id}
                                    produit={produit}
                                    onEdit={() => openModal(produit)}
                                    onDelete={() => openDeleteModal(produit)}
                                    onToggleActive={() => toggleActif(produit)}
                                    onAddToCart={() => openAddToCartModal(produit)}
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
                                                Produit
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Prix HT
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Prix TTC
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredProduits.map((produit) => (
                                            <ProductRow
                                                key={produit._id}
                                                produit={produit}
                                                onEdit={() => openModal(produit)}
                                                onDelete={() => openDeleteModal(produit)}
                                                onToggleActive={() => toggleActif(produit)}
                                                onAddToCart={() => openAddToCartModal(produit)}
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
                            <Package className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {debouncedSearchTerm || activeFilter !== 'all'
                            ? 'Aucun produit trouvé'
                            : 'Votre catalogue est vide'
                        }
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        {debouncedSearchTerm || activeFilter !== 'all'
                            ? `Aucun produit ne correspond aux critères${debouncedSearchTerm ? ` "${debouncedSearchTerm}"` : ''}.`
                            : 'Commencez par ajouter votre premier produit pour constituer votre catalogue.'}
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
                            Ajouter un produit
                        </button>
                    </div>
                </div>
            )}

            {/* Modal pour ajouter/modifier un produit */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Package className="w-5 h-5 mr-2 text-blue-600" />
                                {editingProduit ? 'Modifier le produit' : 'Nouveau produit'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <ProductForm
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleSubmit}
                                onCancel={closeModal}
                                isEditing={!!editingProduit}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal pour ajouter au panier */}
            {showAddToCartModal && selectedProduit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <AddToCartModal
                        produit={selectedProduit}
                        paniers={paniers}
                        formData={formAddLine}
                        isLoading={isLoadingAddLine}
                        onChange={setFormAddLine}
                        onAdd={handleAddToCart}
                        onClose={() => setShowAddToCartModal(false)}
                    />
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer le produit "${produitToDelete?.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />
        </div>
    );
}