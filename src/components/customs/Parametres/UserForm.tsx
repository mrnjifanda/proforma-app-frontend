import { useState, useEffect } from 'react';
import { User } from '@/utils/types';
import { toastError, toastInfo, toastSuccess } from '@/utils/libs/toastify';
import { User as UserIcon, Save, RotateCcw, Shield, Edit3, Key } from 'lucide-react';
import userService from '@/api/user.service';
import FormField from '@/components/Forms/FormField';

interface UserFormProps {
    user: User | null;
    onSuccess: () => void;
    onUpdate: (data: Partial<User>) => void;
}

interface FormErrors {
    [key: string]: string;
}

interface TouchedFields {
    [key: string]: boolean;
}

export default function UserForm({ user, onSuccess, onUpdate }: UserFormProps) {
    const [userForm, setUserForm] = useState<Partial<User>>({});
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        confirm_password: ''
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [errorsUser, setErrorsUser] = useState<FormErrors>({});
    const [errorsPassword, setErrorsPassword] = useState<FormErrors>({});
    const [touchedUser, setTouchedUser] = useState<TouchedFields>({});
    const [touchedPassword, setTouchedPassword] = useState<TouchedFields>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setUserForm({
                last_name: user.last_name,
                first_name: user.first_name,
                username: user.username,
                email: user.email
            });
        }
    }, [user]);

    // Validations
    const validateUser = () => {
        const errors: FormErrors = {};
        if (!userForm.first_name?.trim()) errors.first_name = 'Le prénom est requis';
        if (!userForm.last_name?.trim()) errors.last_name = 'Le nom de famille est requis';
        if (!userForm.email?.trim()) {
            errors.email = 'L\'adresse email est requise';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
            errors.email = 'Format d\'email invalide';
        }

        if (userForm.username !== undefined && userForm.username !== null && userForm.username.trim().length < 3) {
            errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        }
        setErrorsUser(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePassword = () => {
        const errors: FormErrors = {};
        if (!passwordForm.current_password?.trim()) {
            errors.current_password = 'Le mot de passe actuel est requis';
        }
        if (!passwordForm.password?.trim()) {
            errors.password = 'Le nouveau mot de passe est requis';
        } else if (passwordForm.password.length < 8) {
            errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if (passwordForm.password !== passwordForm.confirm_password) {
            errors.confirm_password = 'Les mots de passe ne correspondent pas';
        }
        setErrorsPassword(errors);
        return Object.keys(errors).length === 0;
    };

    // Gestion des champs utilisateur
    const handleUserFieldChange = (field: string, value: any) => {
        setUserForm(prev => ({ ...prev, [field]: value }));
        if (errorsUser[field]) {
            setErrorsUser(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleUserBlur = (field: string) => {
        setTouchedUser(prev => ({ ...prev, [field]: true }));
    };

    // Gestion des champs mot de passe
    const handlePasswordFieldChange = (field: string, value: string) => {
        setPasswordForm(prev => ({ ...prev, [field]: value }));
        if (errorsPassword[field]) {
            setErrorsPassword(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handlePasswordBlur = (field: string) => {
        setTouchedPassword(prev => ({ ...prev, [field]: true }));
    };

    // Sauvegarde utilisateur
    const handleSaveUser = async () => {

        if (!validateUser() || !user?._id) return;

        setIsSaving(true);
        try {

            const { email, ...userData } = userForm;
            const response = await userService.update(user._id, userData);
            if (response.data?.error) {
                throw new Error(response.data.message || 'Erreur lors de la mise à jour');
            }

            onUpdate({
                last_name: userData.last_name,
                first_name: userData.first_name,
                username: userData.username
            });
            onSuccess();
            toastSuccess({ message: 'Profil utilisateur mis à jour avec succès !' });
        } catch (error: any) {
            console.error('Erreur sauvegarde utilisateur:', error);
            if (error.response?.data?.errors) {
                setErrorsUser(error.response.data.errors);
            } else {
                toastError({ message: error.message || 'Erreur lors de la mise à jour du profil.' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Changement mot de passe
    const handleSavePassword = async () => {
        if (!validatePassword() || !user?._id) return;

        setIsSaving(true);
        try {
            const response = await userService.changePassword(user._id, {
                current_password: passwordForm.current_password,
                password: passwordForm.password,
                confirm_password: passwordForm.confirm_password
            });

            if (response.data?.error) {
                throw new Error(response.data.message || 'Erreur lors du changement de mot de passe');
            }

            setPasswordForm({ current_password: '', password: '', confirm_password: '' });
            setTouchedPassword({});
            setErrorsPassword({});
            onSuccess();
            toastSuccess({ message: 'Mot de passe mis à jour avec succès !' });
        } catch (error: any) {
            console.error('Erreur changement mot de passe:', error);
            toastError({ message: error.message || 'Erreur lors du changement de mot de passe.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reset
    const resetUserForm = () => {
        if (user) {
            setUserForm({
                last_name: user.last_name,
                first_name: user.first_name,
                username: user.username,
                email: user.email
            });
            setErrorsUser({});
            setTouchedUser({});
        }
    };

    const resetPasswordForm = () => {
        setPasswordForm({ current_password: '', password: '', confirm_password: '' });
        setErrorsPassword({});
        setTouchedPassword({});
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                    <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Profil utilisateur</h2>
                    <p className="text-gray-600">Gérez vos informations personnelles et votre sécurité</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations personnelles */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 pb-3 border-b flex items-center">
                        <Edit3 className="w-5 h-5 mr-2 text-green-600" />
                        Informations personnelles
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Prénom */}
                        <FormField
                            label="Prénom"
                            name="first_name"
                            type="text"
                            placeholder="Votre prénom"
                            icon={UserIcon}
                            required
                            value={userForm.first_name || ''}
                            onChange={(value) => handleUserFieldChange('first_name', value)}
                            onBlur={() => handleUserBlur('first_name')}
                            error={errorsUser.first_name}
                            isTouched={touchedUser.first_name}
                            disabled={isSaving}
                        />

                        {/* Nom de famille */}
                        <FormField
                            label="Nom de famille"
                            name="last_name"
                            type="text"
                            placeholder="Votre nom de famille"
                            icon={UserIcon}
                            required
                            value={userForm.last_name || ''}
                            onChange={(value) => handleUserFieldChange('last_name', value)}
                            onBlur={() => handleUserBlur('last_name')}
                            error={errorsUser.last_name}
                            isTouched={touchedUser.last_name}
                            disabled={isSaving}
                        />
                    </div>

                    {/* Nom d'utilisateur (optionnel) */}
                    <FormField
                        label="Nom d'utilisateur"
                        name="username"
                        type="text"
                        icon={UserIcon}
                        placeholder="Nom d'utilisateur"
                        value={userForm.username || ''}
                        onChange={(value) => handleUserFieldChange('username', value)}
                        onBlur={() => handleUserBlur('username')}
                        error={errorsUser.username}
                        isTouched={touchedUser.username}
                        disabled={isSaving}
                    />

                    {/* Email */}
                    <FormField
                        label="Adresse email"
                        name="email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        required
                        value={userForm.email || ''}
                        onChange={() => { toastInfo({ message: "Vous ne pouvez pas modifier l'adresse e-mail." }) }}
                        onBlur={() => handleUserBlur('email')}
                        error={errorsUser.email}
                        isTouched={touchedUser.email}
                        disabled={true}
                    />

                    {/* Boutons pour les informations personnelles */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            onClick={resetUserForm}
                            disabled={isSaving}
                            className="px-4 py-2 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm hover:scale-105 flex items-center space-x-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Réinitialiser</span>
                        </button>
                        <button
                            onClick={handleSaveUser}
                            disabled={isSaving || !userForm.first_name || !userForm.last_name || !userForm.email}
                            className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 text-sm font-medium flex items-center space-x-2 hover:scale-105 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                        </button>
                    </div>
                </div>

                {/* Sécurité du compte */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 pb-3 border-b flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-green-600" />
                        Sécurité du compte
                    </h3>

                    <div className="space-y-4">
                        {/* Mot de passe actuel */}
                        <FormField
                            label="Mot de passe actuel"
                            name="current_password"
                            placeholder="Votre mot de passe actuel"
                            icon={Key}
                            required
                            value={passwordForm.current_password}
                            onChange={(value) => handlePasswordFieldChange('current_password', value)}
                            onBlur={() => handlePasswordBlur('current_password')}
                            error={errorsPassword.current_password}
                            isTouched={touchedPassword.current_password}
                            disabled={isSaving}
                            showPasswordToggle
                        />

                        {/* Nouveau mot de passe */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Nouveau mot de passe"
                                name="password"
                                placeholder="Nouveau mot de passe sécurisé"
                                icon={Key}
                                required
                                value={passwordForm.password}
                                onChange={(value) => handlePasswordFieldChange('password', value)}
                                onBlur={() => handlePasswordBlur('password')}
                                error={errorsPassword.password}
                                isTouched={touchedPassword.password}
                                disabled={isSaving}
                                showPasswordToggle
                                maxLength={64}
                            />

                            {/* Confirmation mot de passe */}
                            <FormField
                                label="Confirmer le nouveau mot de passe"
                                name="confirm_password"
                                placeholder="Confirmez votre nouveau mot de passe"
                                icon={Key}
                                required
                                value={passwordForm.confirm_password}
                                onChange={(value) => handlePasswordFieldChange('confirm_password', value)}
                                onBlur={() => handlePasswordBlur('confirm_password')}
                                error={errorsPassword.confirm_password}
                                isTouched={touchedPassword.confirm_password}
                                disabled={isSaving}
                                showPasswordToggle
                            />
                        </div>

                        {/* Boutons changement mot de passe */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                onClick={resetPasswordForm}
                                disabled={isSaving}
                                className="px-4 py-2 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm hover:scale-105 flex items-center space-x-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Réinitialiser</span>
                            </button>
                            <button
                                onClick={handleSavePassword}
                                disabled={isSaving || !passwordForm.current_password || !passwordForm.password || !passwordForm.confirm_password}
                                className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 text-sm font-medium flex items-center space-x-2 hover:scale-105 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{isSaving ? 'Changement...' : 'Changer le mot de passe'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}