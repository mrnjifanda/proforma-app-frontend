import { useState, useCallback, useMemo } from 'react';
import { Produit } from "@/utils/types";
import { Check, ChevronDown, Star, AlertCircle, Package, FileText, DollarSign, Percent, Hash, Archive } from "lucide-react";
import { toastError } from '@/utils/libs/toastify';
import FormField from '../Forms/FormField';

interface ProductFormProps {
    formData: Produit;
    setFormData: React.Dispatch<React.SetStateAction<Produit>>;
    onSubmit: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    isLoading?: boolean;
}

interface FormErrors {
    nom?: string;
    reference?: string;
    description?: string;
    prixUnitaireHT?: string;
    tauxTVA?: string;
    stock?: string;
}

const ProductForm = ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    isEditing,
    isLoading = false
}: ProductFormProps) => {

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback((name: string, value: string | number | boolean): string => {
        switch (name) {
            case 'nom':
                const nomStr = String(value);
                if (!nomStr.trim()) return 'Le nom du produit est obligatoire';
                if (nomStr.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
                if (nomStr.trim().length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
                return '';

            case 'reference':
                const refStr = String(value);
                if (!refStr.trim()) return 'La référence est obligatoire';
                if (refStr.trim().length < 1) return 'La référence ne peut pas être vide';
                if (refStr.trim().length > 50) return 'La référence ne peut pas dépasser 50 caractères';
                // Vérifier que la référence ne contient que des caractères autorisés
                const refRegex = /^[a-zA-Z0-9\-_]+$/;
                if (!refRegex.test(refStr.trim())) return 'La référence ne peut contenir que des lettres, chiffres, tirets et underscores';
                return '';

            case 'description':
                const descStr = String(value);
                if (descStr.length > 500) return 'La description ne peut pas dépasser 500 caractères';
                return '';

            case 'prixUnitaireHT':
                const prix = Number(value);
                if (isNaN(prix) || prix < 0) return 'Le prix doit être un nombre positif';
                if (prix === 0) return 'Le prix ne peut pas être nul';
                if (prix > 999999.99) return 'Le prix ne peut pas dépasser 999 999,99';
                return '';

            case 'tauxTVA':
                const taux = Number(value);
                const validTaux = [0, 5, 5.5, 10, 20];
                if (!validTaux.includes(taux)) return 'Veuillez sélectionner un taux de TVA valide';
                return '';

            case 'stock':
                const stock = Number(value);
                if (isNaN(stock) || stock < 0) return 'Le stock doit être un nombre positif ou nul';
                if (!Number.isInteger(stock)) return 'Le stock doit être un nombre entier';
                if (stock > 999999) return 'Le stock ne peut pas dépasser 999 999';
                return '';

            default:
                return '';
        }
    }, []);

    // Validation complète du formulaire
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};
        const fields = ['nom', 'reference', 'prixUnitaireHT', 'tauxTVA', 'stock'];

        fields.forEach(field => {
            let fieldValue: string | number;
            if (field === 'prixUnitaireHT' || field === 'tauxTVA' || field === 'stock') {
                fieldValue = formData[field as keyof Produit] as number;
            } else {
                fieldValue = formData[field as keyof Produit] as string || '';
            }
            
            const error = validateField(field, fieldValue);
            if (error) newErrors[field as keyof FormErrors] = error;
        });

        // Validation description optionnelle
        if (formData.description) {
            const descError = validateField('description', formData.description);
            if (descError) newErrors.description = descError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, validateField]);

    // Gestion des changements de champs avec useCallback
    const handleFieldChange = useCallback((field: keyof Produit, value: string | number | boolean) => {
        let cleanedValue = value;

        if (field === 'reference' && typeof value === 'string') {
            // Nettoyage automatique pour la référence
            cleanedValue = value.replace(/[^a-zA-Z0-9\-_]/g, '');
        } else if (field === 'nom' && typeof value === 'string') {
            // Nettoyage des espaces multiples
            cleanedValue = value.replace(/\s+/g, ' ');
        } else if (field === 'prixUnitaireHT' || field === 'stock') {
            // S'assurer que les nombres sont valides
            const numValue = Number(value);
            cleanedValue = isNaN(numValue) ? 0 : numValue;
        }

        setFormData((prev) => ({ ...prev, [field]: cleanedValue }));

        // Validation en temps réel si le champ a été touché
        if (touched[field]) {
            const error = validateField(field, cleanedValue);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    }, [touched, validateField, setFormData]);

    // Gestion de la perte de focus avec useCallback
    const handleBlur = useCallback((field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        let fieldValue: string | number;
        if (field === 'prixUnitaireHT' || field === 'tauxTVA' || field === 'stock') {
            fieldValue = formData[field as keyof Produit] as number;
        } else {
            fieldValue = formData[field as keyof Produit] as string || '';
        }
        const error = validateField(field, fieldValue);
        setErrors(prev => ({ ...prev, [field]: error }));
    }, [formData, validateField]);

    // Soumission du formulaire
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || isLoading) return;

        // Marquer tous les champs comme touchés
        const allFields = ['nom', 'reference', 'description', 'prixUnitaireHT', 'tauxTVA', 'stock'];
        setTouched(Object.fromEntries(allFields.map(field => [field, true])));

        if (!validateForm()) {
            toastError({ message: 'Veuillez corriger les erreurs dans le formulaire.' });
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            toastError({
                message: `Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} du produit.`
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, isLoading, validateForm, onSubmit, isEditing]);

    // Mémorisation des erreurs actives pour éviter les re-calculs
    const hasActiveErrors = useMemo(() => {
        return Object.keys(errors).some(key => errors[key as keyof FormErrors] && touched[key]);
    }, [errors, touched]);

    // Calcul du prix TTC
    const ttcPrice = useMemo(() => {
        return formData.prixUnitaireHT * (1 + formData.tauxTVA / 100);
    }, [formData.prixUnitaireHT, formData.tauxTVA]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i}>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-12 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i}>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-12 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <div className="h-12 bg-gray-200 rounded-lg w-24"></div>
                    <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        label="Nom du produit"
                        name="nom"
                        placeholder="Nom du produit"
                        icon={Package}
                        required
                        maxLength={100}
                        value={formData.nom || ''}
                        onChange={(value) => handleFieldChange('nom', value)}
                        onBlur={() => handleBlur('nom')}
                        error={errors.nom}
                        isTouched={touched.nom || false}
                        disabled={isSubmitting || isLoading}
                    />

                    <FormField
                        label="Référence produit"
                        name="reference"
                        placeholder="REF-001"
                        icon={Hash}
                        required
                        maxLength={50}
                        value={formData.reference || ''}
                        onChange={(value) => handleFieldChange('reference', value)}
                        onBlur={() => handleBlur('reference')}
                        error={errors.reference}
                        isTouched={touched.reference || false}
                        disabled={isSubmitting || isLoading}
                    />

                    <FormField
                        label="Stock initial"
                        name="stock"
                        type="number"
                        placeholder="0"
                        icon={Archive}
                        required
                        value={formData.stock?.toString() || '0'}
                        onChange={(value) => handleFieldChange('stock', parseInt(value) || 0)}
                        onBlur={() => handleBlur('stock')}
                        error={errors.stock}
                        isTouched={touched.stock || false}
                        disabled={isSubmitting || isLoading}
                    />
                </div>

                <FormField
                    label="Description"
                    name="description"
                    type="textarea"
                    placeholder="Description du produit"
                    icon={FileText}
                    maxLength={500}
                    value={formData.description || ''}
                    onChange={(value) => handleFieldChange('description', value)}
                    onBlur={() => handleBlur('description')}
                    error={errors.description}
                    isTouched={touched.description || false}
                    disabled={isSubmitting || isLoading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                                Prix unitaire HT ($) <span className="text-red-500">*</span>
                            </div>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 transform text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="999999.99"
                                value={formData.prixUnitaireHT || ''}
                                onChange={(e) => handleFieldChange('prixUnitaireHT', parseFloat(e.target.value) || 0)}
                                onBlur={() => handleBlur('prixUnitaireHT')}
                                className={`w-full pl-8 pr-4 py-3 rounded-lg border transition-colors ${
                                    errors.prixUnitaireHT && touched.prixUnitaireHT
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                } ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                required
                                disabled={isSubmitting || isLoading}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.prixUnitaireHT && touched.prixUnitaireHT && (
                            <p className="mt-1 text-sm text-red-600">{errors.prixUnitaireHT}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center">
                                <Percent className="w-4 h-4 mr-2 text-gray-500" />
                                Taux TVA (%) <span className="text-red-500">*</span>
                            </div>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.tauxTVA}
                                onChange={(e) => handleFieldChange('tauxTVA', parseFloat(e.target.value))}
                                onBlur={() => handleBlur('tauxTVA')}
                                className={`w-full pl-3 pr-8 py-3 rounded-lg border appearance-none transition-colors ${
                                    errors.tauxTVA && touched.tauxTVA
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                } ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                required
                                disabled={isSubmitting || isLoading}
                            >
                                <option value={0}>0% (Exonéré)</option>
                                <option value={5}>5% (Taux réduit)</option>
                                <option value={5.5}>5,5% (Taux réduit)</option>
                                <option value={10}>10% (Taux intermédiaire)</option>
                                <option value={20}>20% (Taux normal)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 transform w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.tauxTVA && touched.tauxTVA && (
                            <p className="mt-1 text-sm text-red-600">{errors.tauxTVA}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                        type="checkbox"
                        id="produitActif"
                        checked={formData.actif}
                        onChange={(e) => handleFieldChange('actif', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        disabled={isSubmitting || isLoading}
                    />
                    <label htmlFor="produitActif" className="text-sm font-medium text-gray-700">
                        Produit actif (visible dans le catalogue)
                    </label>
                </div>

                {/* Aperçu du prix */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <div className="text-sm font-medium text-indigo-800">Prix HT</div>
                            <div className="text-lg font-bold">
                                {(formData.prixUnitaireHT || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                            </div>
                        </div>
                        <div className="col-span-1">
                            <div className="text-sm font-medium text-indigo-800">TVA</div>
                            <div className="text-lg font-bold">
                                {formData.tauxTVA}%
                            </div>
                        </div>
                        <div className="col-span-1">
                            <div className="text-sm font-medium text-indigo-800">Prix TTC</div>
                            <div className="text-xl font-bold text-indigo-600">
                                {ttcPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Résumé des erreurs */}
            {hasActiveErrors && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <h4 className="text-sm font-medium text-red-800">
                            Veuillez corriger les erreurs suivantes :
                        </h4>
                    </div>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([field, error]) =>
                            error && touched[field] && (
                                <li key={field}>{error}</li>
                            )
                        )}
                    </ul>
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500">
                    <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-100" />
                    <span>Les champs marqués d&apos;un * sont obligatoires</span>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || hasActiveErrors}
                        className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                {isEditing ? 'Mise à jour...' : 'Création...'}
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                {isEditing ? 'Mettre à jour' : 'Créer le produit'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ProductForm;