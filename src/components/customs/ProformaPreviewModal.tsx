'use client';

import { Proforma, ConfigEntreprise } from "@/utils/types";
import { X, Download, Send, Eye, Calendar, User, MapPin, Phone, Mail, Building, FileText, DollarSign, Edit2, Save } from "lucide-react";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import 'quill/dist/quill.snow.css';
import Quill from 'quill';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import proformaService from "@/api/proforma.service";
import { formatPrice, getCurrencyCode, getLogoLink } from "@/utils/helpers";

interface ProformaPreviewModalProps {
    proforma: Proforma;
    entreprise: ConfigEntreprise | null;
    isOpen: boolean;
    actionLoading: string;
    onClose: () => void;
    onDownloadPDF: () => void;
    onGenerateAndDownloadPDF: () => void;
    onSendByEmail: () => void;
    onConditionsUpdate?: (data: { conditions: string, _id: string }) => void;
}

const ProformaPreviewModal = ({
    proforma,
    entreprise,
    isOpen,
    onClose,
    onDownloadPDF,
    onGenerateAndDownloadPDF,
    onSendByEmail,
    actionLoading,
    onConditionsUpdate
}: ProformaPreviewModalProps) => {

    const getStatusBadge = (status: Proforma['statut']) => {
        const variants = {
            en_attente: 'bg-amber-50 text-amber-700 border-amber-200',
            accepte: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            refuse: 'bg-red-50 text-red-700 border-red-200',
            expire: 'bg-gray-50 text-gray-700 border-gray-200'
        };

        const labels = {
            en_attente: 'En attente',
            accepte: 'Accepté',
            refuse: 'Refusé',
            expire: 'Expiré'
        };

        return (
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${variants[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const [isEditingConditions, setIsEditingConditions] = useState(false);
    const [editorContent, setEditorContent] = useState(proforma.conditions || '');
    const [isSavingConditions, setIsSavingConditions] = useState(false);

    useEffect(() => {
        if (!isEditingConditions) {
            setEditorContent(proforma.conditions || '');
        }
    }, [proforma.conditions, isEditingConditions]);

    const isExpired = new Date(proforma.validite) < new Date();
    const isFasture = proforma.statut === 'accepte';

    let currencyCode = 'USD';
    if (typeof proforma?.panier === "object" && typeof proforma.panier?.currency === "object") {

        currencyCode = getCurrencyCode(proforma.panier.currency);
    }

    if (!isOpen) return null;

    const handleSaveConditions = async () => {

        if (!proforma._id) return;

        setIsSavingConditions(true);
        proformaService.update(proforma._id, {
            conditions: editorContent,
            statut: proforma.statut
        })
            .then(response => {
                toastSuccess({ message: 'Conditions mises à jour avec succès !' });
                setIsEditingConditions(false);
                if (onConditionsUpdate) {
                    onConditionsUpdate({ conditions: editorContent, _id: proforma._id as string });
                }
            }).catch(error => {
                console.error('Erreur sauvegarde conditions:', error);
                toastError({ message: 'Erreur lors de la sauvegarde des conditions.' });
            }).finally(() => {
                setIsSavingConditions(false);
            });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 no-print">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Aperçu {isFasture ? 'de la facture' : 'du proforma'}</h3>
                                <p className="text-indigo-100 text-sm">{proforma.numero}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onSendByEmail}
                                disabled={actionLoading === `email-${proforma.numero}`}
                                className="px-4 py-2.5 cursor-pointer bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center space-x-2 disabled:opacity-50 transition-all duration-200"
                            >
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:block">Envoyer</span>
                            </button>

                            <button
                                onClick={proforma.proforma_pdf ? onDownloadPDF : onGenerateAndDownloadPDF}
                                disabled={actionLoading === `pdf-${proforma.numero}`}
                                className="px-4 py-2.5 cursor-pointer bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 font-medium"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:block">
                                    {proforma.proforma_pdf ? 'Télécharger' : 'Générer PDF'}
                                </span>
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content with improved layout */}
                <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                    {/* Status Banner */}
                    {(isExpired || proforma.statut !== 'en_attente') && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {getStatusBadge(proforma.statut)}
                                    {isExpired && (
                                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                                            Expiré
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Validité: {new Date(proforma.validite).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-8">
                        {/* Modern Header Design */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8 border border-indigo-100">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Company Info */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-start space-x-4">
                                        {entreprise?.logo && (
                                            <div className="flex-shrink-0">
                                                <Image
                                                    src={getLogoLink(entreprise.logo)}
                                                    alt={`Logo de ${entreprise.nom}`}
                                                    width={80}
                                                    height={80}
                                                    className="object-contain rounded-xl bg-white p-2 shadow-sm"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                                {entreprise?.nom}
                                            </h1>
                                            <div className="space-y-2 text-gray-600">
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                                    <span>{entreprise?.adresse}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Phone className="w-4 h-4 text-indigo-500" />
                                                    <span>{entreprise?.telephone}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="w-4 h-4 text-indigo-500" />
                                                    <span>{entreprise?.email}</span>
                                                </div>
                                                {entreprise?.siret && (
                                                    <div className="flex items-center space-x-2">
                                                        <Building className="w-4 h-4 text-indigo-500" />
                                                        <span>NIU: {entreprise.siret}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Document Info */}
                                <div className="text-right">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-200">
                                        <div className="flex items-center justify-end space-x-2 mb-3">
                                            <FileText className="w-6 h-6 text-indigo-600" />
                                            <h2 className="text-2xl font-bold text-gray-900">{isFasture ? 'FACTURE' : 'PROFORMA'}</h2>
                                        </div>
                                        <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                                            {isFasture ? proforma.numero.replace('PRO-', 'FAC-') : proforma.numero}
                                        </p>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div>Date: {new Date().toLocaleDateString('fr-FR')}</div>
                                            <div>Validité: {new Date(proforma.validite).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Client Information Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
                            <div className="flex items-center space-x-2 mb-4">
                                <User className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-gray-900 text-lg">Informations client</h3>
                            </div>

                            {typeof proforma.client === 'object' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Nom</p>
                                            <p className="font-semibold text-gray-900">{proforma.client.nom}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Adresse</p>
                                            <p className="text-gray-900">{proforma.client.adresse}</p>
                                            <p className="text-gray-900">{proforma.client.codePostal} {proforma.client.ville}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Contact</p>
                                            <p className="text-gray-900">{proforma.client.telephone}</p>
                                            <p className="text-gray-900">{proforma.client.email}</p>
                                        </div>
                                        {proforma.client.siret && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">SIRET</p>
                                                <p className="text-gray-900">{proforma.client.siret}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Informations client non disponibles</p>
                            )}
                        </div>

                        {/* Modern Products Table */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                                <h3 className="font-bold text-gray-900 text-lg">Détail des prestations</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Qté</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Prix unit. HT</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">TVA</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total HT</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total TTC</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {proforma.contenu.map((item, index) => (
                                            <tr key={index} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.nom}</div>
                                                        {item.description && (
                                                            <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium">{item.quantite}</td>
                                                <td className="px-6 py-4 text-right font-medium">
                                                    {formatPrice(item.prixUnitaireHT, currencyCode)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                                        {item.tauxTVA}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium">
                                                    {formatPrice(item.totalLigneHT, currencyCode)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold">
                                                    {formatPrice(item.totalLigneTTC, currencyCode)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Enhanced Totals Section */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full max-w-md">
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <DollarSign className="w-5 h-5 text-indigo-600" />
                                        <h4 className="font-bold text-gray-900">Récapitulatif</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-600">Total HT:</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatPrice(proforma.totalHT, currencyCode)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-600">Total TVA:</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatPrice(proforma.totalTVA, currencyCode)}
                                            </span>
                                        </div>
                                        <div className="border-t border-indigo-200 pt-3">
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-lg font-bold text-gray-900">Total TTC:</span>
                                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    {formatPrice(proforma.totalTTC, currencyCode)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conditions Générales - Version éditable */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900">Conditions générales</h4>
                                {!isEditingConditions && (
                                    <button
                                        onClick={() => {
                                            setEditorContent(proforma.conditions || '');
                                            setIsEditingConditions(true);
                                        }}
                                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                    >
                                        <Edit2 className="w-4 h-4 mr-1" />
                                        Modifier
                                    </button>
                                )}
                            </div>

                            {isEditingConditions ? (
                                <div className="space-y-4">
                                    {/* Quill Editor Container */}
                                    <div className="bg-white rounded-lg border border-gray-300">
                                        <div
                                            ref={(el) => {
                                                if (el && !el.hasChildNodes()) {
                                                    // Créer l'éditeur si pas encore créé
                                                    const editor = document.createElement('div');
                                                    el.appendChild(editor);

                                                    const quill = new Quill(editor, {
                                                        theme: 'snow',
                                                        modules: {
                                                            toolbar: [
                                                                [{ 'header': [1, 2, 3, false] }],
                                                                ['bold', 'italic'],
                                                                [{ 'color': ['#000000', '#e60000', '#0066cc', '#009900'] }],
                                                                [{ 'size': ['small', false, 'large'] }],
                                                                ['clean']
                                                            ],
                                                        },
                                                        placeholder: 'Saisissez les conditions générales...',
                                                    });

                                                    // Charger contenu initial
                                                    quill.root.innerHTML = editorContent;

                                                    // Écouter les changements
                                                    quill.on('text-change', () => {
                                                        setEditorContent(quill.root.innerHTML);
                                                    });

                                                    // Sauvegarder référence pour cleanup
                                                    (el as any).quill = quill;
                                                }
                                            }}
                                            style={{ minHeight: '200px' }}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => setIsEditingConditions(false)}
                                            disabled={isSavingConditions}
                                            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSaveConditions}
                                            disabled={isSavingConditions}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                                        >
                                            {isSavingConditions ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Enregistrement...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span>Enregistrer</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                proforma.conditions ? (
                                    <div
                                        className="text-sm text-gray-700 leading-relaxed ql-editor"
                                        dangerouslySetInnerHTML={{ __html: proforma.conditions }}
                                    />
                                ) : (
                                    <p className="text-gray-500 italic">Aucune condition définie.</p>
                                )
                            )}
                        </div>

                        {/* Signature Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-12">Signature du client</p>
                                <div className="border-b-2 border-gray-300 w-full"></div>
                                <p className="text-xs text-gray-400 mt-2">Bon pour accord</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-12">Pour {entreprise?.nom}</p>
                                <div className="border-b-2 border-gray-300 w-full"></div>
                                <p className="text-xs text-gray-400 mt-2">Signature et cachet</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProformaPreviewModal;