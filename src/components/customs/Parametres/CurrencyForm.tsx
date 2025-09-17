import { useState, useEffect } from 'react';
import { ConfigEntreprise, Currency } from '@/utils/types';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import {
    DollarSign,
    Save,
    RotateCcw,
    Plus,
    Trash2,
    X,
    Check,
    AlertCircle,
    Globe,
    CreditCard
} from 'lucide-react';
import entrepriseService from '@/api/entreprise.service';

interface CurrencyFormProps {
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

export default function CurrencyForm({ entreprise, onSuccess, onUpdate }: CurrencyFormProps) {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
    const [showAddCurrency, setShowAddCurrency] = useState(false);
    const [newCurrency, setNewCurrency] = useState<Partial<Currency>>({
        name: '',
        code: '',
        symbol: '',
        flag: '🌍',
        rate: 1
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<TouchedFields>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialiser avec les devises de l'entreprise
    useEffect(() => {
        if (entreprise?.currency && Array.isArray(entreprise.currency)) {
            const currencyArray = entreprise.currency.map((c: any) => ({
                _id: typeof c === 'string' ? c : c._id || c.code?.toLowerCase(),
                ...c
            }));
            setCurrencies(currencyArray);
            setSelectedCurrencies(currencyArray.map((c: any) => c._id));
        }
    }, [entreprise]);

    // Validation
    const validateCurrency = () => {
        const newErrors: FormErrors = {};
        if (!newCurrency.name?.trim()) newErrors.name = 'Le nom de la devise est requis';
        if (!newCurrency.code?.trim()) {
            newErrors.code = 'Le code ISO est requis';
        } else if (newCurrency.code.length !== 3) {
            newErrors.code = 'Le code doit contenir exactement 3 caractères';
        }
        if (!newCurrency.symbol?.trim()) newErrors.symbol = 'Le symbole est requis';
        if (typeof newCurrency.rate !== 'number' || newCurrency.rate <= 0) {
            newErrors.rate = 'Le taux de change doit être supérieur à 0';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Gestion des champs
    const handleFieldChange = (field: string, value: any) => {
        setNewCurrency(prev => ({ ...prev, [field]: value }));
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

    // Gestion des devises
    const handleCurrencyToggle = (currencyId: string) => {
        setSelectedCurrencies(prev =>
            prev.includes(currencyId)
                ? prev.filter(id => id !== currencyId)
                : [...prev, currencyId]
        );
    };

    const handleAddCurrency = async () => {
        if (!validateCurrency()) return;

        const currency: Currency = {
            _id: newCurrency.code!.toLowerCase(),
            name: newCurrency.name!,
            code: newCurrency.code!.toUpperCase(),
            symbol: newCurrency.symbol!,
            flag: newCurrency.flag || '🌍',
            rate: newCurrency.rate!
        };

        setCurrencies(prev => [...prev, currency]);
        setSelectedCurrencies(prev => [...prev, currency._id]);
        setNewCurrency({ name: '', code: '', symbol: '', flag: '🌍', rate: 1 });
        setShowAddCurrency(false);
        setTouched({});
        setErrors({});
        toastSuccess({ message: 'Devise ajoutée avec succès' });
    };

    const handleRemoveCurrency = (currencyId: string) => {
        setCurrencies(prev => prev.filter(c => c._id !== currencyId));
        setSelectedCurrencies(prev => prev.filter(id => id !== currencyId));
        toastSuccess({ message: 'Devise supprimée' });
    };

    // Sauvegarde
    const handleSave = async () => {
        if (!entreprise?._id) return;

        setIsSaving(true);
        try {
            const activeCurrencies = currencies.filter(c => selectedCurrencies.includes(c._id));
            const response = await entrepriseService.update(entreprise._id, {
                currency: activeCurrencies
            });

            if (response.data?.error) {
                throw new Error(response.data.message || 'Erreur lors de la mise à jour');
            }

            const updatedEntreprise = { ...entreprise, currency: activeCurrencies };
            onUpdate(updatedEntreprise);
            onSuccess();
            toastSuccess({ message: 'Configuration des devises mise à jour avec succès !' });
        } catch (error: any) {
            console.error('Erreur sauvegarde devises:', error);
            toastError({ message: error.message || 'Erreur lors de la mise à jour des devises.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reset
    const resetCurrencies = () => {
        if (entreprise?.currency && Array.isArray(entreprise.currency)) {
            const currencyArray = entreprise.currency.map((c: any) => ({
                _id: typeof c === 'string' ? c : c._id || c.code?.toLowerCase(),
                ...c
            }));
            setCurrencies(currencyArray);
            setSelectedCurrencies(currencyArray.map((c: any) => c._id));
        }
    };

    return (
        <>

            <div className="space-y-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-orange-500 rounded-2xl shadow-lg">
                            <DollarSign className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Gestion des devises</h2>
                            <p className="text-gray-600">Configurez les devises disponibles pour votre entreprise</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddCurrency(true)}
                        className="px-6 py-3 cursor-pointer bg-blue-500 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 font-medium hover:scale-105 hover:shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Ajouter une devise</span>
                    </button>
                </div>

                {/* Liste des devises */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currencies.map(currency => (
                        <div
                            key={currency._id}
                            className={`
                            p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] group
                            ${selectedCurrencies.includes(currency._id)
                                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md ring-2 ring-green-200'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }
                        `}
                            onClick={() => handleCurrencyToggle(currency._id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`text-3xl p-2 rounded-xl transition-all duration-300 ${selectedCurrencies.includes(currency._id) ? 'bg-green-100 scale-110' : 'bg-gray-100 group-hover:bg-gray-200'
                                        }`}>
                                        {currency.flag}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{currency.name}</div>
                                        <div className="text-sm text-gray-500">{currency.code} ({currency.symbol})</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {selectedCurrencies.includes(currency._id) && (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveCurrency(currency._id);
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                        title="Supprimer cette devise"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-white/80 rounded-lg p-3 border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Taux de change:</span>
                                        <span className="font-medium text-gray-900">
                                            1 USD = {currency.rate} {currency.symbol}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Inverse:</span>
                                        <span className="font-medium text-gray-900">
                                            1 {currency.symbol} = {(1 / currency.rate).toFixed(4)} USD
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedCurrencies.includes(currency._id)
                                        ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {selectedCurrencies.includes(currency._id) ? '✓ Activée' : 'Désactivée'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {currencies.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune devise configurée</h3>
                        <p className="text-gray-600 mb-4">Commencez par ajouter des devises pour votre entreprise</p>
                        <button
                            onClick={() => setShowAddCurrency(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 mx-auto hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Ajouter la première devise</span>
                        </button>
                    </div>
                )}

                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                    <button
                        onClick={resetCurrencies}
                        disabled={isSaving}
                        className="px-6 py-3 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:scale-105"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Réinitialiser</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || selectedCurrencies.length === 0}
                        className="px-8 py-3 cursor-pointer bg-orange-600 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Enregistrement...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Enregistrer la configuration</span>
                            </>
                        )}
                    </button>
                </div>

                <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1); 
                    }
                }
            `}</style>
            </div>

            {/* Modal Ajout Devise */}
            {showAddCurrency && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl animate-[scaleIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Globe className="w-6 h-6 mr-2 text-green-600" />
                                Ajouter une nouvelle devise
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddCurrency(false);
                                    setNewCurrency({ name: '', code: '', symbol: '', flag: '🌍', rate: 1 });
                                    setErrors({});
                                    setTouched({});
                                }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de la devise <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.name || ''}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    onBlur={() => handleBlur('name')}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    placeholder="Ex: Euro"
                                    disabled={isSaving}
                                />
                                {errors.name && touched.name && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center animate-[fadeIn_0.3s_ease-out]">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Code ISO (3 lettres) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.code || ''}
                                    onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                                    onBlur={() => handleBlur('code')}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    placeholder="Ex: EUR"
                                    disabled={isSaving}
                                    maxLength={3}
                                />
                                {errors.code && touched.code && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center animate-[fadeIn_0.3s_ease-out]">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Symbole <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.symbol || ''}
                                    onChange={(e) => handleFieldChange('symbol', e.target.value)}
                                    onBlur={() => handleBlur('symbol')}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.symbol ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    placeholder="Ex: €"
                                    disabled={isSaving}
                                />
                                {errors.symbol && touched.symbol && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center animate-[fadeIn_0.3s_ease-out]">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.symbol}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Drapeau (emoji)
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.flag || ''}
                                    onChange={(e) => handleFieldChange('flag', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    placeholder="Ex: 🇪🇺"
                                    disabled={isSaving}
                                    maxLength={4}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Taux de change (1 USD = ?) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0.0001"
                                        value={newCurrency.rate || ''}
                                        onChange={(e) => handleFieldChange('rate', parseFloat(e.target.value) || 0)}
                                        onBlur={() => handleBlur('rate')}
                                        className={`w-full px-4 py-3 pl-12 pr-20 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.rate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        placeholder="Ex: 0.93"
                                        disabled={isSaving}
                                    />
                                    <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                                        {newCurrency.code || 'DEV'} / USD
                                    </div>
                                </div>
                                {errors.rate && touched.rate && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center animate-[fadeIn_0.3s_ease-out]">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.rate}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">Exemple : 1 USD = 0.93 EUR (taux au {new Date().toLocaleDateString('fr-FR')})</p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowAddCurrency(false);
                                    setNewCurrency({ name: '', code: '', symbol: '', flag: '🌍', rate: 1 });
                                    setErrors({});
                                    setTouched({});
                                }}
                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium hover:scale-105"
                                disabled={isSaving}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddCurrency}
                                disabled={isSaving}
                                className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 hover:scale-105 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Check className="w-5 h-5" />
                                )}
                                <span>Ajouter la devise</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}