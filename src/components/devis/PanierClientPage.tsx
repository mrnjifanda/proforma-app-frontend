'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ShoppingCart, Trash2, User, FileText, Package, ArrowLeft, FilePlus, Info, Save, RotateCcw } from "lucide-react";
import { Panier } from '@/utils/types';
import { FORMAT_DATE } from '@/utils/constants';
import TVASummary from './TVASummary';
import LigneProduit from './LigneProduit';
import { toastError, toastInfo, toastSuccess } from '@/utils/libs/toastify';
import ConfirmationModal from '@/components/customs/ConfirmationModal';
import proformaService from '@/api/proforma.service';
import panierService from '@/api/panier.service';

export default function PanierClientPage({ initialPanier }: { initialPanier: Panier }) {

    const router = useRouter();
    const [isLoadCreateProforma, setIsLoadCreateProforma] = useState<boolean>(false);
    const [panier, setPanier] = useState<Panier>(initialPanier);
    const [originalPanier, setOriginalPanier] = useState<Panier>(() => JSON.parse(JSON.stringify(initialPanier)));
    const [countLignes, setCountLignes] = useState<number>(initialPanier.lignes?.length ?? 0);
    const [hasModifications, setHasModifications] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [modifiedLines, setModifiedLines] = useState<Map<string, number>>(new Map());

    // Modal states
    const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
    const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);
    const [showResetChangesModal, setShowResetChangesModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    const recalculateTotals = useCallback((updatedPanier: Panier) => {
        let totalHT = 0;
        let totalTVA = 0;

        updatedPanier.lignes.forEach((ligne) => {
            const montantHT = ligne.prixUnitaireHT * ligne.quantite;
            const montantTVA = montantHT * ligne.tauxTVA / 100;
            totalHT += montantHT;
            totalTVA += montantTVA;
        });

        const totalTTC = totalHT + totalTVA;

        return {
            ...updatedPanier,
            totalHT,
            totalTVA,
            totalTTC
        };
    }, []);

    const handleQuantityChange = useCallback((produitId: string, newQuantity: number) => {
        if (!panier || newQuantity < 1) return;

        setPanier(prevPanier => {
            if (!prevPanier) return prevPanier;

            const updatedLignes = prevPanier.lignes.map(ligne =>
                ligne.produit._id === produitId
                    ? { ...ligne, quantite: newQuantity }
                    : ligne
            );

            const updatedPanier = recalculateTotals({
                ...prevPanier,
                lignes: updatedLignes
            });

            return updatedPanier;
        });

        setModifiedLines(prev => new Map(prev).set(produitId, newQuantity));
        setHasModifications(true);
    }, [panier, recalculateTotals]);

    const handleRemoveProduct = useCallback((produitId: string) => {
        if (!panier) return;

        setProductToDelete(produitId);
        setShowDeleteProductModal(true);
    }, [panier]);

    const confirmRemoveProduct = useCallback(() => {
        if (!panier || !productToDelete) return;

        setPanier(prevPanier => {
            if (!prevPanier) return prevPanier;

            const updatedLignes = prevPanier.lignes.filter(ligne =>
                ligne.produit._id !== productToDelete
            );

            const updatedPanier = recalculateTotals({
                ...prevPanier,
                lignes: updatedLignes
            });

            setCountLignes(updatedLignes.length);
            return updatedPanier;
        });

        setModifiedLines(prev => new Map(prev).set(productToDelete, 0));
        setHasModifications(true);
        setShowDeleteProductModal(false);
        setProductToDelete(null);
    }, [panier, productToDelete, recalculateTotals]);

    const handleEmptyCart = useCallback(() => {
        if (!panier || panier.lignes.length === 0) return;

        setShowEmptyCartModal(true);
    }, [panier]);

    const confirmEmptyCart = useCallback(() => {
        if (!panier || panier.lignes.length === 0) return;

        const allProductIds = panier.lignes.map(ligne => ligne.produit._id);
        const newModifiedLines = new Map(modifiedLines);
        allProductIds.forEach(id => newModifiedLines.set(id, 0));

        setModifiedLines(newModifiedLines);

        setPanier(prevPanier => {
            if (!prevPanier) return prevPanier;

            const updatedPanier = recalculateTotals({
                ...prevPanier,
                lignes: []
            });

            setCountLignes(0);
            return updatedPanier;
        });

        setHasModifications(true);
        setShowEmptyCartModal(false);
    }, [panier, modifiedLines, recalculateTotals]);

    const handleSaveChanges = useCallback(async () => {

        if (!panier || !hasModifications || modifiedLines.size === 0) return;

        setIsSaving(true);

        try {

            const modificationsData = {
                panierId: panier._id,
                modifications: Array.from(modifiedLines.entries()).map(([produitId, quantite]) => ({
                    id: produitId,
                    quantite
                }))
            };

            await panierService.saveUpdate(panier._id, modificationsData);

            setModifiedLines(new Map());
            setHasModifications(false);
            setOriginalPanier(JSON.parse(JSON.stringify(panier)));
            toastSuccess({ message: 'Modifications sauvegardées avec succès !' });
        } catch (error) {
            console.error('Error saving changes:', error);
            toastError({ message: 'Erreur lors de la sauvegarde. Veuillez réessayer.' });
        } finally {
            setIsSaving(false);
        }
    }, [panier, hasModifications, modifiedLines]);

    const handleResetChanges = useCallback(() => {
        if (!hasModifications || !originalPanier) return;

        setShowResetChangesModal(true);
    }, [hasModifications, originalPanier]);

    const confirmResetChanges = useCallback(() => {
        if (!hasModifications || !originalPanier) return;

        setPanier(JSON.parse(JSON.stringify(originalPanier)));
        setCountLignes(originalPanier.lignes?.length ?? 0);
        setModifiedLines(new Map());
        setHasModifications(false);
        setShowResetChangesModal(false);
    }, [hasModifications, originalPanier]);

    const handleCreateProforma = useCallback(async () => {

        setIsLoadCreateProforma(true);
        proformaService.create({ panierId: initialPanier._id })
            .then(response => {
                toastSuccess({ message: "Proforma créé avec succès" });
                router.push('/dashboard/proformas/')
            })
            .catch(error => {

                if (error.response?.data?.message === 'A quote already exists in the cart') {

                    const shouldCreateNew = confirm('Un proforma existe déjà pour ce devis. Voulez-vous en créer un nouveau ?');
                    if (shouldCreateNew) {
                        proformaService.create({ panierId: initialPanier._id }, true)
                            .then(response => {
                                toastSuccess({ message: "Nouveau proforma créé avec succès" });
                                router.push('/dashboard/proformas/');
                            })
                            .catch(forceError => {
                                toastError({ message: forceError.response?.data?.message || 'Erreur lors de la création du proforma' });
                            })
                            .finally(() => {
                                setIsLoadCreateProforma(false);
                            });
                        return;
                    } else {
                        toastInfo({ message: "Création de proforma annulée" });
                    }
                } else {
                    toastError({ message: error.response?.data?.message || 'Erreur lors de la création du proforma' });
                }
            })
            .finally(() => {
                setIsLoadCreateProforma(false);
            })
    }, [initialPanier._id, router]);

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/devis')}
                        className="text-blue-600 hover:text-blue-800 flex items-center mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour aux devis
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShoppingCart className="w-6 h-6 mr-2 text-blue-600" />
                        {panier?.nom}
                    </h1>
                    <p className="text-gray-600">
                        {countLignes} produit{countLignes > 1 ? 's' : ''}
                        {hasModifications && (
                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Non sauvegardé
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <span className="truncate max-w-[120px]">{panier?.client?.nom}</span>
                        </div>
                    </div>

                    {hasModifications && (
                        <>
                            <button
                                onClick={handleResetChanges}
                                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 flex items-center transition-colors"
                                title="Annuler toutes les modifications non sauvegardées"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Annuler
                            </button>

                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </>
                    )}

                    {countLignes > 0 && (
                        <button
                            onClick={handleEmptyCart}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 flex items-center transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Vider le devis
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des produits */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900">Produits</h2>
                        <div className="text-sm text-gray-600">
                            Client: {panier?.client?.nom}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {countLignes > 0 ? (
                            panier?.lignes.map((ligne) => (
                                <LigneProduit
                                    key={ligne.produit._id}
                                    ligne={ligne}
                                    onQuantityChange={(newQty) => handleQuantityChange(ligne.produit._id, newQty)}
                                    onRemove={() => handleRemoveProduct(ligne.produit._id)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <Package className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Votre devis est vide
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Ajoutez des produits pour commencer à créer un devis ou proforma.
                                </p>
                                <button
                                    onClick={() => router.push('/dashboard/produits')}
                                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                                >
                                    <Package className="w-5 h-5 mr-2" />
                                    Parcourir les produits
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Résumé du panier */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                Résumé du devis
                            </h3>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sous-total HT:</span>
                                    <span className="font-medium">
                                        {panier?.totalHT?.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">TVA:</span>
                                    <span className="font-medium">
                                        {panier?.totalTVA?.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                                    </span>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-gray-900">Total TTC:</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {panier?.totalTTC?.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {countLignes > 0 && (
                                <TVASummary lignes={panier?.lignes ?? []} />
                            )}

                            <div className="pt-4 space-y-3">
                                <button
                                    onClick={() => router.push('/dashboard/produits')}
                                    className="w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Continuer mes achats
                                </button>

                                {countLignes > 0 && (
                                    <button
                                        onClick={handleCreateProforma}
                                        className="relative w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-3 justify-center transition-colors"
                                    >
                                        {isLoadCreateProforma ? (
                                            <>
                                                <div className="loading-spinner"></div>
                                                <span>Creation en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FilePlus className="w-4 h-4 mr-2" />
                                                Créer un proforma
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>


                            {/* Informations sur les produits */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600 space-y-2">
                                    <div className="font-medium flex items-center">
                                        <Info className="w-4 h-4 mr-2" />
                                        Détails du devis
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Articles totaux:</span>
                                        <span>{panier?.lignes.reduce((acc, ligne) => acc + ligne.quantite, 0) ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Produits différents:</span>
                                        <span>{countLignes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date de création:</span>
                                        <span>{panier?.created_at ? FORMAT_DATE(panier.created_at as Date) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modaux de confirmation */}
            <ConfirmationModal
                isOpen={showDeleteProductModal}
                onClose={() => setShowDeleteProductModal(false)}
                onConfirm={confirmRemoveProduct}
                title="Supprimer le produit"
                message="Êtes-vous sûr de vouloir supprimer ce produit du devis ?"
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={showEmptyCartModal}
                onClose={() => setShowEmptyCartModal(false)}
                onConfirm={confirmEmptyCart}
                title="Vider le devis"
                message="Êtes-vous sûr de vouloir vider ce devis ? Cette action supprimera tous les produits."
                confirmText="Vider le devis"
                cancelText="Annuler"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={showResetChangesModal}
                onClose={() => setShowResetChangesModal(false)}
                onConfirm={confirmResetChanges}
                title="Annuler les modifications"
                message="Êtes-vous sûr de vouloir annuler toutes vos modifications non sauvegardées ?"
                confirmText="Annuler les modifications"
                cancelText="Conserver"
                variant="warning"
            />
        </div>
    );
}