import { useEffect, useState } from 'react';
import { Client, Currency, PartialPanier } from '@/utils/types';
import { ShoppingCart, User, X, Check, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/utils/contexts/AuthContext';
import currencyService from '@/api/currency.service';

interface PanierFormProps {
    formData: PartialPanier;
    setFormData: (data: PartialPanier) => void;
    clients: Client[];
    onSubmit: () => Promise<void>;
    onCancel: () => void;
    isEditing?: boolean;
}

const PanierForm = ({
    formData,
    setFormData,
    clients,
    onSubmit,
    onCancel,
    isEditing = false
}: PanierFormProps) => {

    const { entreprise } = useAuth();
    const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(true);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ nom?: string }>({});

    useEffect(() => {
        setIsLoadingCurrencies(true);
        currencyService.getAll({
            id: entreprise?._id
        }).then(response => {

            const currenciesData = response?.data?.data ?? [];
            setCurrencies(currenciesData);

            if (isEditing) {
                const id = typeof formData.currency === "object" ? formData.currency._id : formData.currency;
                const currencyExists = currenciesData.some((currency: Currency) => currency._id === id);
                if (!currencyExists) {
                    console.warn('La devise actuelle n\'existe pas dans les données reçues.');
                    // setFormData(prev => ({ ...prev, currency: currenciesData.length > 0 ? currenciesData[0]._id : '' }));
                    setFormData({ ...formData, currency: currenciesData.length > 0 ? currenciesData[0]._id : '' });                }
            } else {
                if (!formData.currency && currenciesData.length > 0) {
                    // setFormData(prev => ({ ...prev, currency: currenciesData[0]._id }));
                    setFormData({ ...formData, currency: currenciesData.length > 0 ? currenciesData[0]._id : '' });
                }
            }
        }).catch(error => {
            console.error('Erreur lors du chargement des devises:', error);
        }).finally(() => {
            setIsLoadingCurrencies(false);
        });
    }, []);

    const validateForm = (): boolean => {
        const newErrors: { nom?: string } = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom du devis est obligatoire';
        } else if (formData.nom.trim().length < 2) {
            newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
        } else if (formData.nom.trim().length > 100) {
            newErrors.nom = 'Le nom ne peut pas dépasser 100 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        if (!validateForm()) { return; }

        try {
            setIsSubmitting(true);
            await onSubmit();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNomChange = (value: string) => {

        setFormData({ ...formData, nom: value });
        if (errors.nom) {
            setErrors({ ...errors, nom: undefined });
        }
    };

    const handleClientChange = (clientId: string) => {
        const selectedClient = clientId ? clients.find(c => c._id === clientId) : undefined;
        setFormData({ ...formData, client: selectedClient });
    };

    const handleCurrencyChange = (currencyId: string) => {
        setFormData({ ...formData, currency: currencyId });
    };

    const getCurrentCurrencyId = (): string => {
        if (!formData.currency) return '';
        return typeof formData.currency === "object" ? formData.currency._id : formData.currency;
    };

    const getCurrentCurrencyName = (): string => {
        const currencyId = getCurrentCurrencyId();
        const currency = currencies.find(c => c._id === currencyId);
        return currency ? `${currency.flag} ${currency.name} ${currency.code} - ${currency.symbol}` : '';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom du panier */}
                <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                        <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                        Nom du devis <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <ShoppingCart className={`absolute left-3 top-4 transform w-5 h-5 ${errors.nom ? 'text-red-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => handleNomChange(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nom
                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="Ex: Devis client ABC, Commande été 2024..."
                            maxLength={100}
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>
                    {errors.nom && (
                        <div className="flex items-center mt-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.nom}
                        </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        {formData.nom.length}/100 caractères
                    </div>
                </div>

                {/* Sélection de la devise */}
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline-block mr-1" />
                        Devise <span className="text-red-500">*</span>
                    </label>
                    {isLoadingCurrencies ? (
                        <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 flex items-center">
                            <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500">Chargement des devises...</span>
                        </div>
                    ) : (
                        <select
                            id="currency"
                            value={getCurrentCurrencyId()}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={isSubmitting || currencies.length === 0}
                            required
                        >
                            {currencies.length === 0 ? (
                                <option value="">Aucune devise disponible</option>
                            ) : (
                                <>
                                    <option value="">Sélectionner une devise</option>
                                    {currencies.map((currency) => (
                                        <option key={currency._id} value={currency._id}>
                                            {currency.flag} {currency.name} ({currency.code}) - {currency.symbol}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    )}
                    {currencies.length === 0 && !isLoadingCurrencies && (
                        <div className="flex items-center mt-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Aucune devise disponible. Créez d&apos;abord des devises pour pouvoir créer des devis.
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Cette devise sera utilisée pour tous les montants du devis
                    </p>
                </div>
            </div>

            {/* Sélection du client */}
            <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline-block mr-1" />
                    Assigner à un client (optionnel)
                </label>
                <select
                    id="client"
                    value={formData.client?._id || ''}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isSubmitting}
                >
                    <option value="">Aucun client sélectionné</option>
                    {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                            {client.nom} - {client.email}
                        </option>
                    ))}
                </select>
                {clients.length === 0 && (
                    <div className="flex items-center mt-2 text-sm text-amber-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Aucun client disponible. Créez d&apos;abord des clients pour les assigner aux devis.
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Vous pourrez modifier cette assignation plus tard
                </p>
            </div>

            {/* Aperçu des informations */}
            {formData.nom.trim() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Aperçu du devis</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Nom:</span>
                            <span className="ml-1">{formData.nom}</span>
                        </div>
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Client:</span>
                            <span className="ml-1">
                                {formData.client ? formData.client.nom : 'Aucun client assigné'}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Devise:</span>
                            <span className="ml-1">
                                {getCurrentCurrencyName() || 'Aucune devise sélectionnée'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !formData.nom.trim() || !getCurrentCurrencyId() || isLoadingCurrencies}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isEditing ? 'Mise à jour...' : 'Création...'}
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            {isEditing ? 'Mettre à jour' : 'Créer le devis'}
                        </>
                    )}
                </button>
            </div>

            {/* Aide contextuelle */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Conseils</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Donnez un nom descriptif à votre devis pour le retrouver facilement</li>
                    <li>• L&apos;assignation à un client est optionnelle et peut être modifiée plus tard</li>
                    <li>• La devise choisie sera utilisée pour tous les calculs du devis</li>
                    <li>• Vous pourrez ajouter des produits au devis après sa création</li>
                    {!isEditing && (
                        <li>• Un devis vide peut être utilisé comme modèle pour de futurs devis</li>
                    )}
                </ul>
            </div>
        </form>
    );
};

export default PanierForm;
