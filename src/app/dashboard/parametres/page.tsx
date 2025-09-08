'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/utils/contexts/AuthContext';
import { ConfigEntreprise, User, Currency } from '@/utils/types';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import { Building, User as UserIcon, DollarSign, FileText, Save, RotateCcw, Upload, Plus, Trash2, X, Check, Key, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import QuillEditor from '@/components/Forms/QuillEditor';
import { configEntreprise } from '@/utils/constants';
import Alert from '@/components/Errors/Alert';

type Tab = 'entreprise' | 'utilisateur' | 'conditions' | 'devises';

const Info = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function ParametresPage() {

    const { user, entreprise, setUser, setEntreprise } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('entreprise');
    const [isSaving, setIsSaving] = useState(false);
    const [showAlert, setShowAlert] = useState(true);

    // États pour l'entreprise
    const [entrepriseForm, setEntrepriseForm] = useState<Partial<ConfigEntreprise>>({});
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // États pour l'utilisateur
    const [userForm, setUserForm] = useState<Partial<User>>({});
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // États pour les conditions par défaut
    const [defaultConditions, setDefaultConditions] = useState<string>(`<p><strong>Conditions générales de vente :</strong></p><ul><li>Paiement net à 30 jours fin de mois.</li><li>Tout retard de paiement entraîne l'application d'une pénalité de 10% du montant restant dû.</li><li>Les marchandises voyagent aux risques et périls du destinataire.</li></ul>`);

    // États pour les devises
    const [currencies, setCurrencies] = useState<Currency[]>([
        { _id: 'usd', name: 'Dollar américain', code: 'USD', symbol: '$', flag: '🇺🇸', rate: 1 },
        { _id: 'eur', name: 'Euro', code: 'EUR', symbol: '€', flag: '🇪🇺', rate: 0.93 },
        { _id: 'gbp', name: 'Livre sterling', code: 'GBP', symbol: '£', flag: '🇬🇧', rate: 0.79 },
        { _id: 'jpy', name: 'Yen japonais', code: 'JPY', symbol: '¥', flag: '🇯🇵', rate: 155.20 }
    ]);
    const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
    const [showAddCurrency, setShowAddCurrency] = useState(false);
    const [newCurrency, setNewCurrency] = useState<Partial<Currency>>({
        name: '',
        code: '',
        symbol: '',
        flag: '🌍',
        rate: 1
    });

    // Initialiser les formulaires
    useEffect(() => {
        if (entreprise) {
            setEntrepriseForm({
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email,
                siret: entreprise.siret,
                tauxTVADefaut: entreprise.tauxTVADefaut,
                couleurPrimaire: entreprise.couleurPrimaire,
                couleurSecondaire: entreprise.couleurSecondaire
            });
            setLogoPreview(entreprise.logo || null);
            if (Array.isArray(entreprise.currency)) {
                setSelectedCurrencies(
                    entreprise.currency.map(c => typeof c === 'string' ? c : c._id)
                );
            }
        }
        if (user) {
            setUserForm({
                last_name: user.last_name,
                first_name: user.first_name,
                username: user.username,
                email: user.email
            });
        }
    }, [entreprise, user]);

    // Gestion logo
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Gestion devises
    const handleCurrencyToggle = (currencyId: string) => {
        setSelectedCurrencies(prev =>
            prev.includes(currencyId)
                ? prev.filter(id => id !== currencyId)
                : [...prev, currencyId]
        );
    };

    const handleAddCurrency = () => {
        if (!newCurrency.name || !newCurrency.code || !newCurrency.symbol) {
            toastError({ message: 'Veuillez remplir tous les champs obligatoires.' });
            return;
        }

        const currencyToAdd: Currency = {
            _id: (newCurrency.code || '').toLowerCase(),
            name: newCurrency.name,
            code: newCurrency.code || '',
            symbol: newCurrency.symbol || '',
            flag: newCurrency.flag || '🌍',
            rate: newCurrency.rate || 1
        };

        setCurrencies(prev => [...prev, currencyToAdd]);
        setSelectedCurrencies(prev => [...prev, currencyToAdd._id]);
        setNewCurrency({ name: '', code: '', symbol: '', flag: '🌍', rate: 1 });
        setShowAddCurrency(false);
        toastSuccess({ message: 'Devise ajoutée avec succès !' });
    };

    const handleRemoveCurrency = (currencyId: string) => {
        setCurrencies(prev => prev.filter(c => c._id !== currencyId));
        setSelectedCurrencies(prev => prev.filter(id => id !== currencyId));
    };

    // Sauvegardes
    const handleSaveEntreprise = async () => {
        if (!entreprise) return;
        // setIsSaving(true);

        // try {
        //     let logoUrl = entreprise.logo;
        //     if (logoFile) {
        //         const uploadResult = await settingsService.uploadLogo(logoFile);
        //         if (!uploadResult.error && uploadResult.url) {
        //             logoUrl = uploadResult.url;
        //         }
        //     }

        //     const dataToSave = {
        //         ...entrepriseForm,
        //         logo: logoUrl,
        //         currency: selectedCurrencies
        //     };

        //     const result = await settingsService.updateEntreprise(dataToSave);
        //     if (!result.error && result.data) {
        //         setEntreprise(result.data);
        //         toastSuccess({ message: 'Informations de l\'entreprise mises à jour !' });
        //     } else {
        //         throw new Error('Erreur lors de la mise à jour');
        //     }
        // } catch (error) {
        //     toastError({ message: 'Erreur lors de la mise à jour de l\'entreprise.' });
        // } finally {
        //     setIsSaving(false);
        // }
    };

    const handleSaveUser = async () => {
        if (!user) return;
        setIsSaving(true);

        // try {
        //     const result = await settingsService.updateUser(userForm);
        //     if (!result.error && result.data) {
        //         setUser(result.data);
        //         toastSuccess({ message: 'Informations utilisateur mises à jour !' });
        //     } else {
        //         throw new Error('Erreur lors de la mise à jour');
        //     }
        // } catch (error) {
        //     toastError({ message: 'Erreur lors de la mise à jour de l\'utilisateur.' });
        // } finally {
        //     setIsSaving(false);
        // }
    };

    const handleSavePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toastError({ message: 'Les mots de passe ne correspondent pas.' });
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toastError({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
            return;
        }

        setIsSaving(true);

        // try {
        //     const result = await settingsService.updatePassword({
        //         currentPassword: passwordForm.currentPassword,
        //         newPassword: passwordForm.newPassword
        //     });

        //     if (result.error) {
        //         toastError({ message: result.message || 'Erreur lors de la mise à jour du mot de passe.' });
        //     } else {
        //         toastSuccess({ message: 'Mot de passe mis à jour avec succès !' });
        //         setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        //     }
        // } catch (error) {
        //     toastError({ message: 'Erreur serveur. Veuillez réessayer.' });
        // } finally {
        //     setIsSaving(false);
        // }
    };

    const handleSaveDefaultConditions = () => {
        toastSuccess({ message: 'Conditions par défaut mises à jour !' });
        console.log('Conditions sauvegardées:', defaultConditions);
    };

    const handleSaveCurrencies = () => {
        toastSuccess({ message: 'Devises par défaut mises à jour !' });
        console.log('Devises sélectionnées:', selectedCurrencies);
    };

    // Reset
    const resetEntrepriseForm = () => {
        if (entreprise) {
            setEntrepriseForm({
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email,
                siret: entreprise.siret,
                tauxTVADefaut: entreprise.tauxTVADefaut,
                couleurPrimaire: entreprise.couleurPrimaire,
                couleurSecondaire: entreprise.couleurSecondaire
            });
            setLogoPreview(entreprise.logo || null);
            setLogoFile(null);
        }
    };

    const resetUserForm = () => {
        if (user) {
            setUserForm({
                last_name: user.last_name,
                first_name: user.first_name,
                username: user.username,
                email: user.email
            });
        }
    };

    const resetPasswordForm = () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const resetConditions = () => {
        setDefaultConditions(`<p><strong>Conditions générales de vente :</strong></p><ul><li>Paiement net à 30 jours fin de mois.</li><li>Tout retard de paiement entraîne l'application d'une pénalité de 10% du montant restant dû.</li><li>Les marchandises voyagent aux risques et périls du destinataire.</li></ul>`);
    };

    const resetCurrencies = () => {
        setSelectedCurrencies(['usd', 'eur']);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-gray-600 mt-2">Personnalisez votre espace et gérez vos préférences</p>
            </div>

            {showAlert && (
                <Alert
                    type="warning"
                    message="Cette page n'est pas encore totalement fonctionnelle. Certaines fonctionnalités sont en cours de développement."
                    onClose={() => setShowAlert(false)}
                    // autoClose={10000}
                />
            )}

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'entreprise', label: 'Entreprise', icon: Building },
                        { id: 'utilisateur', label: 'Utilisateur', icon: UserIcon },
                        { id: 'conditions', label: 'Conditions', icon: FileText },
                        { id: 'devises', label: 'Devises', icon: DollarSign }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5 mr-2" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="p-8">
                    {activeTab === 'entreprise' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <Building className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Informations de l&apos;entreprise</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Logo de l&apos;entreprise</label>
                                        <div className="flex items-center space-x-6 p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-gray-400 transition-colors">
                                            {logoPreview ? (
                                                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                                                    <Image
                                                        src={logoPreview}
                                                        alt="Logo"
                                                        width={96}
                                                        height={96}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                                    <Upload className="w-10 h-10 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF jusqu&apos;à 10MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Nom de l&apos;entreprise</label>
                                        <input
                                            type="text"
                                            value={entrepriseForm.nom || ''}
                                            onChange={(e) => setEntrepriseForm({ ...entrepriseForm, nom: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Adresse</label>
                                        <input
                                            type="text"
                                            value={entrepriseForm.adresse || ''}
                                            onChange={(e) => setEntrepriseForm({ ...entrepriseForm, adresse: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Téléphone</label>
                                            <input
                                                type="text"
                                                value={entrepriseForm.telephone || ''}
                                                onChange={(e) => setEntrepriseForm({ ...entrepriseForm, telephone: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Email</label>
                                            <input
                                                type="email"
                                                value={entrepriseForm.email || ''}
                                                onChange={(e) => setEntrepriseForm({ ...entrepriseForm, email: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">SIRET/NIU</label>
                                        <input
                                            type="text"
                                            value={entrepriseForm.siret || ''}
                                            onChange={(e) => setEntrepriseForm({ ...entrepriseForm, siret: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">TVA par défaut (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={entrepriseForm.tauxTVADefaut || ''}
                                            onChange={(e) => setEntrepriseForm({ ...entrepriseForm, tauxTVADefaut: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Couleurs de marque</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-2">Couleur primaire</label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={entrepriseForm.couleurPrimaire || '#3b82f6'}
                                                        onChange={(e) => setEntrepriseForm({ ...entrepriseForm, couleurPrimaire: e.target.value })}
                                                        className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
                                                    />
                                                    <span className="font-mono text-sm">{entrepriseForm.couleurPrimaire || '#3b82f6'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-2">Couleur secondaire</label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={entrepriseForm.couleurSecondaire || '#8b5cf6'}
                                                        onChange={(e) => setEntrepriseForm({ ...entrepriseForm, couleurSecondaire: e.target.value })}
                                                        className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
                                                    />
                                                    <span className="font-mono text-sm">{entrepriseForm.couleurSecondaire || '#8b5cf6'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
                                        <h3 className="font-semibold text-indigo-800 mb-3 flex items-center">
                                            <Info className="w-5 h-5 mr-2" />
                                            Conseils de personnalisation
                                        </h3>
                                        <ul className="text-sm text-indigo-700 space-y-1">
                                            <li>• Utilisez des couleurs qui reflètent votre marque</li>
                                            <li>• Le logo apparaîtra sur tous vos documents</li>
                                            <li>• La TVA par défaut s&apos;applique aux nouveaux produits</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-8 border-t">
                                <button
                                    onClick={resetEntrepriseForm}
                                    disabled={isSaving}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>Annuler</span>
                                </button>
                                <button
                                    onClick={handleSaveEntreprise}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>Enregistrer les modifications</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'utilisateur' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <UserIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Profil utilisateur</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Informations personnelles */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-3">Informations personnelles</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                                            <input
                                                type="text"
                                                value={userForm.first_name || ''}
                                                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                                            <input
                                                type="text"
                                                value={userForm.last_name || ''}
                                                onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nom d&apos;utilisateur</label>
                                            <input
                                                type="text"
                                                value={userForm.username || ''}
                                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={userForm.email || ''}
                                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mot de passe */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-3 flex items-center">
                                        <Key className="w-5 h-5 mr-2" />
                                        Sécurité du compte
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword.current ? 'text' : 'password'}
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword.new ? 'text' : 'password'}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                                                    minLength={8}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword.confirm ? 'text' : 'password'}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={resetPasswordForm}
                                            disabled={isSaving}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
                                        >
                                            {isSaving ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            <span>Mettre à jour le mot de passe</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-8 border-t">
                                <button
                                    onClick={resetUserForm}
                                    disabled={isSaving}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>Annuler</span>
                                </button>
                                <button
                                    onClick={handleSaveUser}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>Enregistrer les modifications</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'conditions' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <FileText className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Conditions par défaut</h2>
                            </div>

                            <div className="prose prose-indigo max-w-none">
                                <p className="text-gray-600">Ces conditions seront automatiquement appliquées à tous vos nouveaux proformas et factures.</p>
                            </div>

                            <div className="bg-white rounded-2xl p-1">
                                <QuillEditor
                                    value={defaultConditions}
                                    onChange={setDefaultConditions}
                                    placeholder="Entrez vos conditions générales par défaut..."
                                    height="300px"
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-8 mt-4">
                                <button
                                    onClick={resetConditions}
                                    disabled={isSaving}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>Réinitialiser</span>
                                </button>
                                <button
                                    onClick={handleSaveDefaultConditions}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Enregistrer les conditions</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'devises' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-100 rounded-xl">
                                        <DollarSign className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Gestion des devises</h2>
                                </div>
                                <button
                                    onClick={() => setShowAddCurrency(true)}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Ajouter une devise</span>
                                </button>
                            </div>

                            <div className="prose prose-indigo max-w-none">
                                <p className="text-gray-600">Toutes les devises disponibles dans votre entreprise. Le taux de change est exprimé en dollars américains (USD).</p>
                            </div>

                            {/* Formulaire d'ajout (Modal style) */}
                            {showAddCurrency && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-900">Ajouter une nouvelle devise</h3>
                                            <button
                                                onClick={() => setShowAddCurrency(false)}
                                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la devise *</label>
                                                <input
                                                    type="text"
                                                    value={newCurrency.name}
                                                    onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="Ex: Euro"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Code ISO *</label>
                                                <input
                                                    type="text"
                                                    value={newCurrency.code}
                                                    onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="Ex: EUR"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Symbole *</label>
                                                <input
                                                    type="text"
                                                    value={newCurrency.symbol}
                                                    onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="Ex: €"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Drapeau (emoji)</label>
                                                <input
                                                    type="text"
                                                    value={newCurrency.flag}
                                                    onChange={(e) => setNewCurrency({ ...newCurrency, flag: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="Ex: 🇪🇺"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Taux de change (1 USD = ?)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        min="0.0001"
                                                        value={newCurrency.rate}
                                                        onChange={(e) => setNewCurrency({ ...newCurrency, rate: parseFloat(e.target.value) })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent pr-20"
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                        {newCurrency.code || 'DEV'} / USD
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Ex: 1 USD = 0.93 EUR</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                                            <button
                                                onClick={() => setShowAddCurrency(false)}
                                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleAddCurrency}
                                                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                                            >
                                                <Check className="w-5 h-5" />
                                                <span>Ajouter la devise</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Liste des devises */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currencies.map(currency => (
                                    <div
                                        key={currency._id}
                                        className={`p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${selectedCurrencies.includes(currency._id)
                                            ? 'border-green-500 bg-green-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                                            }`}
                                        onClick={() => handleCurrencyToggle(currency._id)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-3xl">{currency.flag}</span>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{currency.name}</div>
                                                    <div className="text-sm text-gray-500">{currency.code} ({currency.symbol})</div>
                                                </div>
                                            </div>
                                            {selectedCurrencies.includes(currency._id) && (
                                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Taux de change:</span>
                                                <span className="font-medium">
                                                    1 USD = {currency.rate} {currency.symbol}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Inverse:</span>
                                                <span className="font-medium">
                                                    1 {currency.symbol} = {(1 / currency.rate).toFixed(4)} USD
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCurrencies.includes(currency._id)
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {selectedCurrencies.includes(currency._id) ? 'Activée' : 'Désactivée'}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveCurrency(currency._id);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
                                                title="Supprimer cette devise"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-4 pt-8 border-t">
                                <button
                                    onClick={resetCurrencies}
                                    disabled={isSaving}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>Réinitialiser</span>
                                </button>
                                <button
                                    onClick={handleSaveCurrencies}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Enregistrer les modifications</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
