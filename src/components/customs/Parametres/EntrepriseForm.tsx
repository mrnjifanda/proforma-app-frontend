import { useState, useCallback, useEffect } from 'react';
import { ConfigEntreprise, FileInterface } from '@/utils/types';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import { Building2, Save, RotateCcw, Trash2, AlertCircle, Palette, CreditCard, Phone, Mail, MapPin, Hash } from 'lucide-react';
import FileUploader from '@/components/Forms/FileUploader';
import FormField from '@/components/Forms/FormField';
import entrepriseService from '@/api/entreprise.service';

interface EntrepriseFormProps {
    entreprise: ConfigEntreprise | null;
    onSuccess: () => void;
    onUpdate: (entreprise: ConfigEntreprise) => void;
}

interface FormErrors {
    [key: string]: string;
}

interface TouchedFields {
    [key: string]: boolean;
}

export default function EntrepriseForm({ entreprise, onSuccess, onUpdate }: EntrepriseFormProps) {

    const [formData, setFormData] = useState<Partial<ConfigEntreprise>>({});
    const [logoFiles, setLogoFiles] = useState<FileInterface[]>([]);
    const [existingLogoFiles, setExistingLogoFiles] = useState<FileInterface[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<TouchedFields>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (entreprise) {
            setFormData({
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email,
                siret: entreprise.siret,
                tauxTVADefaut: entreprise.tauxTVADefaut,
                couleurPrimaire: entreprise.couleurPrimaire,
                couleurSecondaire: entreprise.couleurSecondaire
            });

            if (entreprise.logo) {
                if (Array.isArray(entreprise.logo)) {
                    setExistingLogoFiles(entreprise.logo);
                } else if (typeof entreprise.logo === 'string') {
                    setExistingLogoFiles([{
                        link: entreprise.logo,
                        type: 'image/png',
                        size: 0,
                        filename: 'logo.png'
                    }]);
                }
            }
        }
    }, [entreprise]);

    // Validation
    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!formData.nom?.trim()) newErrors.nom = 'Le nom de l\'entreprise est requis';
        if (!formData.adresse?.trim()) newErrors.adresse = 'L\'adresse est requise';
        if (!formData.email?.trim()) {
            newErrors.email = 'L\'email est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format d\'email invalide';
        }
        if (!formData.telephone?.trim()) newErrors.telephone = 'Le téléphone est requis';
        if (!formData.siret?.trim()) newErrors.siret = 'Le SIRET/NIU est requis';
        if (typeof formData.tauxTVADefaut !== 'number' || formData.tauxTVADefaut < 0 || formData.tauxTVADefaut > 100) {
            newErrors.tauxTVADefaut = 'Le taux de TVA doit être entre 0 et 100%';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Gestion des champs
    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur si le champ devient valide
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // Gestion logo
    const handleLogoUploadSuccess = useCallback((files: FileInterface[]) => {
        const file = files[0];
        setLogoFiles([file]);
        setFormData(prev => ({ ...prev, logo: [file] }));
    }, []);

    const handleRemoveLogo = useCallback(() => {
        setLogoFiles([]);
        setExistingLogoFiles([]);
        setFormData(prev => ({ ...prev, logo: undefined }));
        toastSuccess({ message: 'Logo supprimé avec succès' });
    }, []);

    // Sauvegarde
    const handleSave = async () => {

        if (!validateForm() || !entreprise?._id) return;

        console.log("entreprise: ", entreprise);
        console.log("updateData: ", formData);

        setIsSaving(true);
        try {
            const updateData = {
                ...formData,
                logo: logoFiles.length > 0 ? logoFiles[0] : (existingLogoFiles.length > 0 ? existingLogoFiles[0] : undefined)
            };

            const response = await entrepriseService.update(entreprise._id, updateData);
            if (response.data?.error) {
                throw new Error(response.data.message || 'Erreur lors de la mise à jour');
            }

            onUpdate(response.data.data);
            onSuccess();
            toastSuccess({ message: 'Informations de l\'entreprise mises à jour avec succès !' });
        } catch (error: any) {
            console.error('Erreur sauvegarde entreprise:', error);
            toastError({ message: error.message || 'Erreur lors de la mise à jour de l\'entreprise.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reset
    const resetForm = () => {
        if (entreprise) {
            setFormData({
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email,
                siret: entreprise.siret,
                tauxTVADefaut: entreprise.tauxTVADefaut,
                couleurPrimaire: entreprise.couleurPrimaire,
                couleurSecondaire: entreprise.couleurSecondaire
            });

            // Reset logo
            if (entreprise.logo) {
                if (Array.isArray(entreprise.logo)) {
                    setExistingLogoFiles(entreprise.logo);
                } else if (typeof entreprise.logo === 'string') {
                    setExistingLogoFiles([{
                        link: entreprise.logo,
                        type: 'image/png',
                        size: 0,
                        filename: 'logo.png'
                    }]);
                }
            } else {
                setExistingLogoFiles([]);
            }

            setLogoFiles([]);
            setErrors({});
            setTouched({});
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Informations de l&apos;entreprise</h2>
                    <p className="text-gray-600">Mettez à jour les informations de votre entreprise</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Logo */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Logo de l&apos;entreprise</label>
                        <FileUploader
                            multiple={false}
                            maxFiles={1}
                            maxFileSize={10}
                            acceptedTypes={['image/*']}
                            fileConfigs={[{
                                identifier: 'logo',
                                formats: ['png', 'jpg', 'jpeg', 'webp'],
                                category: 'logo',
                                priority: 'high'
                            }]}
                            onUploadSuccess={handleLogoUploadSuccess}
                            onUploadError={(error) => toastError({ message: `Erreur: ${error}` })}
                            existingFiles={existingLogoFiles}
                            showPreview={true}
                            placeholder="Glissez-déposez votre logo ou cliquez pour sélectionner"
                            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-blue-400 transition-colors duration-300 hover:bg-blue-50/20"
                        />
                        {(logoFiles.length > 0 || existingLogoFiles.length > 0) && (
                            <div className="flex flex-end">
                                <button
                                    onClick={handleRemoveLogo}
                                    disabled={isSaving}
                                    className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Supprimer le logo</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Nom Entreprise */}
                    <FormField
                        label="Nom de l'entreprise"
                        name="nom"
                        placeholder="Ex: Mon Entreprise SARL"
                        icon={Building2}
                        required
                        value={formData.nom || ''}
                        onChange={(value) => handleFieldChange('nom', value)}
                        onBlur={() => handleBlur('nom')}
                        error={errors.nom}
                        isTouched={touched.nom}
                        disabled={isSaving}
                    />

                    {/* Adresse */}
                    <FormField
                        label="Adresse complète"
                        name="adresse"
                        placeholder="123 Rue de la République"
                        icon={MapPin}
                        required
                        value={formData.adresse || ''}
                        onChange={(value) => handleFieldChange('adresse', value)}
                        onBlur={() => handleBlur('adresse')}
                        error={errors.adresse}
                        isTouched={touched.adresse}
                        disabled={isSaving}
                    />
                </div>

                {/* Actions */}
                <div className="space-y-3">

                    {/* Téléphone et Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                            label="Téléphone"
                            name="telephone"
                            type="tel"
                            placeholder="01 23 45 67 89"
                            icon={Phone}
                            required
                            value={formData.telephone || ''}
                            onChange={(value) => handleFieldChange('telephone', value)}
                            onBlur={() => handleBlur('telephone')}
                            error={errors.telephone}
                            isTouched={touched.telephone}
                            disabled={isSaving}
                        />
                        <FormField
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="contact@monentreprise.fr"
                            icon={Mail}
                            required
                            value={formData.email || ''}
                            onChange={(value) => handleFieldChange('email', value)}
                            onBlur={() => handleBlur('email')}
                            error={errors.email}
                            isTouched={touched.email}
                            disabled={isSaving}
                        />
                    </div>

                    {/* SIRET et TVA par défaut */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                            label="SIRET / NIU"
                            name="siret"
                            placeholder="12345678901234 ou ABC-123-DEF"
                            icon={Hash}
                            required
                            value={formData.siret || ''}
                            onChange={(value) => handleFieldChange('siret', value)}
                            onBlur={() => handleBlur('siret')}
                            error={errors.siret}
                            isTouched={touched.siret}
                            disabled={isSaving}
                        />

                        {/* TVA par défaut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Taux de TVA par défaut (%) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={formData.tauxTVADefaut || ''}
                                    onChange={(e) => handleFieldChange('tauxTVADefaut', parseFloat(e.target.value) || 0)}
                                    onBlur={() => handleBlur('tauxTVADefaut')}
                                    className={`w-full px-4 py-3 pl-10 pr-12 rounded-lg border transition-colors ${errors.tauxTVADefaut && touched.tauxTVADefaut
                                        ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                        : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                        }`}
                                    disabled={isSaving}
                                    placeholder="20.0"
                                />
                                <CreditCard className={`absolute left-3 top-4 w-5 h-5 ${errors.tauxTVADefaut && touched.tauxTVADefaut ? 'text-red-500' : 'text-gray-400'}`} />
                                <div
                                    className="absolute right-3 w-5 h-5 text-gray-500 font-medium"
                                    style={{ top: "14px" }}
                                >
                                    %
                                </div>
                                {errors.tauxTVADefaut && touched.tauxTVADefaut && (
                                    <AlertCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                                )}
                            </div>
                            {errors.tauxTVADefaut && touched.tauxTVADefaut && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.tauxTVADefaut}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Couleurs de marque */}
                        <div className="space-y-4 mb-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <Palette className="w-5 h-5 text-gray-600" />
                                <label className="text-sm font-medium text-gray-700">Couleurs de marque</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-500">Couleur primaire</label>
                                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                                        <input
                                            type="color"
                                            value={formData.couleurPrimaire || '#3b82f6'}
                                            onChange={(e) => handleFieldChange('couleurPrimaire', e.target.value)}
                                            className="w-10 h-10 rounded-lg border-0 cursor-pointer hover:scale-110 transition-transform"
                                            disabled={isSaving}
                                        />
                                        <div className="flex-1">
                                            <div className="font-mono text-sm font-medium">{formData.couleurPrimaire || '#3b82f6'}</div>
                                            <div className="text-xs text-gray-500">Pour boutons, liens</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-500">Couleur secondaire</label>
                                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                                        <input
                                            type="color"
                                            value={formData.couleurSecondaire || '#64748b'}
                                            onChange={(e) => handleFieldChange('couleurSecondaire', e.target.value)}
                                            className="w-10 h-10 rounded-lg border-0 cursor-pointer hover:scale-110 transition-transform"
                                            disabled={isSaving}
                                        />
                                        <div className="flex-1">
                                            <div className="font-mono text-sm font-medium">{formData.couleurSecondaire || '#64748b'}</div>
                                            <div className="text-xs text-gray-500">Pour textes, bordures</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conseils */}
                        <div className="p-6 rounded-2xl border border-blue-200">
                            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Conseils de personnalisation
                            </h3>
                            <ul className="text-sm text-purple-700 space-y-2">
                                <li className="flex items-start space-x-2">
                                    <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>Le logo sera utilisé sur tous vos documents commerciaux</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{`Les couleurs de marque personnalisent l'interface et les documents`}</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{`Le taux de TVA par défaut s'applique aux nouveaux produits`}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                <button
                    onClick={resetForm}
                    disabled={isSaving}
                    className="px-6 py-2 mr-4 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:scale-105"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Réinitialiser</span>
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 cursor-pointer text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Enregistrement...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Enregistrer</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
