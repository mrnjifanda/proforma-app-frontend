import { useState, useCallback, useMemo } from 'react';
import { Client } from "@/utils/types";
import { Mail, Phone, MapPin, FileDigit, Star, Check, AlertCircle, User, Building } from "lucide-react";
import { toastError } from '@/utils/libs/toastify';
import FormField from '../Forms/FormField';

interface ClientFormProps {
    formData: Client;
    setFormData: React.Dispatch<React.SetStateAction<Client>>;
    onSubmit: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    isLoading?: boolean;
}

interface FormErrors {
    nom?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
    siret?: string;
}

const ClientForm = ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    isEditing,
    isLoading = false
}: ClientFormProps) => {

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback((name: string, value: string): string => {
        switch (name) {
            case 'nom':
                if (!value.trim()) return 'Le nom est obligatoire';
                if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
                if (value.trim().length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
                return '';

            case 'email':
                if (!value.trim()) return 'L\'email est obligatoire';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Format d\'email invalide';
                if (value.length > 100) return 'L\'email ne peut pas dépasser 100 caractères';
                return '';

            case 'telephone':
                if (!value.trim()) return 'Le téléphone est obligatoire';
                // Validation universelle pour les numéros de téléphone internationaux
                const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,20}$/;
                if (!phoneRegex.test(value)) {
                    return 'Format de téléphone invalide. Exemples: +33123456789, +1 (123) 456-7890';
                }
                return '';

            case 'adresse':
                if (!value.trim()) return 'L\'adresse est obligatoire';
                if (value.trim().length < 5) return 'L\'adresse doit contenir au moins 5 caractères';
                if (value.trim().length > 200) return 'L\'adresse ne peut pas dépasser 200 caractères';
                return '';

            case 'ville':
                if (!value.trim()) return 'La ville est obligatoire';
                if (value.trim().length < 2) return 'La ville doit contenir au moins 2 caractères';
                if (value.trim().length > 50) return 'La ville ne peut pas dépasser 50 caractères';
                return '';

            case 'codePostal':
                if (!value.trim()) return 'Le code postal est obligatoire';
                // Accepte chiffres, lettres et symboles -_
                const postalRegex = /^[a-zA-Z0-9\-_\s]{2,10}$/;
                if (!postalRegex.test(value)) return 'Le code postal contient des caractères non autorisés';
                return '';

            case 'siret':
                if (value && value.trim()) {
                    // Plage 4 à 50 caractères, accepte chiffres et lettres
                    if (value.length < 4 || value.length > 50) {
                        return 'Le SIRET doit contenir entre 4 et 50 caractères';
                    }
                    const siretRegex = /^[a-zA-Z0-9\-_\s]+$/;
                    if (!siretRegex.test(value)) {
                        return 'Le SIRET ne peut contenir que des chiffres, des lettres et les symboles -_';
                    }
                }
                return '';

            default:
                return '';
        }
    }, []);

    // Validation complète du formulaire
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};
        const fields = ['nom', 'email', 'telephone', 'adresse', 'ville', 'codePostal'];

        fields.forEach(field => {
            const error = validateField(field, formData[field as keyof Client] as string || '');
            if (error) newErrors[field as keyof FormErrors] = error;
        });

        // Validation SIRET optionnel
        if (formData.siret) {
            const siretError = validateField('siret', formData.siret);
            if (siretError) newErrors.siret = siretError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, validateField]);

    // Gestion des changements de champs avec useCallback
    const handleFieldChange = useCallback((field: keyof Client, value: string) => {
        // Nettoyage automatique pour certains champs
        let cleanedValue = value;

        if (field === 'siret') {
            // Accepte chiffres, lettres et symboles -_
            cleanedValue = value.replace(/[^a-zA-Z0-9\-_\s]/g, '');
        } else if (field === 'codePostal') {
            // Accepte chiffres, lettres et symboles -_
            cleanedValue = value.replace(/[^a-zA-Z0-9\-_\s]/g, '');
        } else if (field === 'telephone') {
            // Formatage automatique du téléphone - accepte les formats internationaux
            cleanedValue = value.replace(/[^0-9+()\-\.\s]/g, '');
        }

        setFormData((prev) => ({ ...prev, [field]: cleanedValue }));

        // Validation en temps réel si le champ a été touché
        if (touched[field]) {
            const error = validateField(field, cleanedValue);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    }, [formData, touched, validateField, setFormData]);

    // Gestion de la perte de focus avec useCallback
    const handleBlur = useCallback((field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field as keyof Client] as string || '');
        setErrors(prev => ({ ...prev, [field]: error }));
    }, [formData, validateField]);

    // Soumission du formulaire
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || isLoading) return;

        // Marquer tous les champs comme touchés
        const allFields = ['nom', 'email', 'telephone', 'adresse', 'ville', 'codePostal', 'siret'];
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
                message: `Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} du client.`
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, isLoading, validateForm, onSubmit, isEditing]);

    // Mémorisation des erreurs actives pour éviter les re-calculs
    const hasActiveErrors = useMemo(() => {
        return Object.keys(errors).some(key => errors[key as keyof FormErrors] && touched[key]);
    }, [errors, touched]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className={i === 0 ? 'md:col-span-2' : ''}>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-12 bg-gray-200 rounded-lg"></div>
                        </div>
                    ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <FormField
                        label="Nom / Raison sociale"
                        name="nom"
                        placeholder="Nom complet ou raison sociale"
                        icon={formData.siret ? Building : User}
                        required
                        maxLength={100}
                        value={formData.nom || ''}
                        onChange={(value) => handleFieldChange('nom', value)}
                        onBlur={() => handleBlur('nom')}
                        error={errors.nom}
                        isTouched={touched.nom || false}
                        disabled={isSubmitting || isLoading}
                    />
                </div>

                <FormField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="email@exemple.com"
                    icon={Mail}
                    required
                    maxLength={100}
                    value={formData.email || ''}
                    onChange={(value) => handleFieldChange('email', value)}
                    onBlur={() => handleBlur('email')}
                    error={errors.email}
                    isTouched={touched.email || false}
                    disabled={isSubmitting || isLoading}
                />

                <FormField
                    label="Téléphone"
                    name="telephone"
                    type="tel"
                    placeholder="+33123456789 ou +1 (123) 456-7890"
                    icon={Phone}
                    required
                    value={formData.telephone || ''}
                    onChange={(value) => handleFieldChange('telephone', value)}
                    onBlur={() => handleBlur('telephone')}
                    error={errors.telephone}
                    isTouched={touched.telephone || false}
                    disabled={isSubmitting || isLoading}
                />

                <div className="md:col-span-2">
                    <FormField
                        label="Adresse"
                        name="adresse"
                        placeholder="Adresse complète"
                        icon={MapPin}
                        required
                        maxLength={200}
                        value={formData.adresse || ''}
                        onChange={(value) => handleFieldChange('adresse', value)}
                        onBlur={() => handleBlur('adresse')}
                        error={errors.adresse}
                        isTouched={touched.adresse || false}
                        disabled={isSubmitting || isLoading}
                    />
                </div>

                <FormField
                    label="Ville"
                    name="ville"
                    placeholder="Ville"
                    required
                    maxLength={50}
                    value={formData.ville || ''}
                    onChange={(value) => handleFieldChange('ville', value)}
                    onBlur={() => handleBlur('ville')}
                    error={errors.ville}
                    isTouched={touched.ville || false}
                    disabled={isSubmitting || isLoading}
                />

                <FormField
                    label="Code postal"
                    name="codePostal"
                    placeholder="75000 ou NW1 6XE"
                    required
                    maxLength={10}
                    value={formData.codePostal || ''}
                    onChange={(value) => handleFieldChange('codePostal', value)}
                    onBlur={() => handleBlur('codePostal')}
                    error={errors.codePostal}
                    isTouched={touched.codePostal || false}
                    disabled={isSubmitting || isLoading}
                />

                <div className="md:col-span-2">
                    <FormField
                        label="NIU (optionnel)"
                        name="siret"
                        placeholder="12345678901234 ou ABC-123-DEF"
                        icon={FileDigit}
                        maxLength={50}
                        value={formData.siret || ''}
                        onChange={(value) => handleFieldChange('siret', value)}
                        onBlur={() => handleBlur('siret')}
                        error={errors.siret}
                        isTouched={touched.siret || false}
                        disabled={isSubmitting || isLoading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Le NIU permet d&apos;identifier votre client comme une entreprise (4 à 50 caractères, chiffres, lettres et symboles -_)
                    </p>
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
                                {isEditing ? 'Mettre à jour' : 'Créer le client'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ClientForm;