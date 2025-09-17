'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/contexts/AuthContext';
import { toastError } from '@/utils/libs/toastify';
import { Building2, User as UserIcon, DollarSign, FileText, Settings } from 'lucide-react';
import Alert from '@/components/Errors/Alert';
import userService from '@/api/user.service';
import SkeletonLoader from '@/components/customs/Parametres/SkeletonLoader';
import SuccessAnimation from '@/components/customs/Parametres/SuccessAnimation';
import EntrepriseForm from '@/components/customs/Parametres/EntrepriseForm';
import UserForm from '@/components/customs/Parametres/UserForm';
import ConditionsForm from '@/components/customs/Parametres/ConditionsForm';
import CurrencyForm from '@/components/customs/Parametres/CurrencyForm';
import { User } from '@/utils/types';

type Tab = 'entreprise' | 'utilisateur' | 'conditions' | 'devises';

const animations = {
    fadeIn: "opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]",
    slideIn: "transform translate-y-4 opacity-0 animate-[slideIn_0.4s_ease-out_forwards]",
    scaleIn: "transform scale-95 opacity-0 animate-[scaleIn_0.3s_ease-out_forwards]",
};

export default function ParametresPage() {
    const { user: authUser, entreprise: authEntreprise, setUser, setEntreprise } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('entreprise');
    const [isLoading, setIsLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(true);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const tabs = [
        { id: 'entreprise', label: 'Entreprise', icon: Building2, color: 'text-blue-600' },
        { id: 'utilisateur', label: 'Utilisateur', icon: UserIcon, color: 'text-green-600' },
        { id: 'conditions', label: 'Conditions', icon: FileText, color: 'text-purple-600' },
        { id: 'devises', label: 'Devises', icon: DollarSign, color: 'text-orange-600' }
    ];

    useEffect(() => {
        if (authUser?.id) {
            setIsLoading(true);
            userService.getById(authUser.id)
                .then(response => {
                    if (response.data?.error || !response.data?.data) {
                        throw new Error('Utilisateur non trouvé');
                    }
                    const USER = response.data.data;
                    setUser(USER);
                    if (USER.entreprise) {
                        setEntreprise(USER.entreprise);
                    }
                })
                .catch(error => {
                    console.error('Erreur chargement utilisateur:', error);
                    toastError({ message: 'Erreur lors du chargement des données utilisateur.' });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [authUser?.id, setUser, setEntreprise]);

    const handleSuccess = () => {
        setShowSuccessAnimation(true);
    };

    const updateUser = (data: Partial<User>) => {

        if (authUser) {
            setUser({
                ...authUser,
                ...data
            });
        }

    }

    // Loading state
    if (isLoading) {
        return (
            <div className={`space-y-6 ${animations.fadeIn}`}>
                <div className="space-y-4">
                    <SkeletonLoader height="h-10" width="w-80" />
                    <SkeletonLoader height="h-6" width="w-96" />
                </div>
                <div className="border-b border-gray-200 mb-8">
                    <div className="flex space-x-1">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonLoader key={i} height="h-12" width="w-32" className="rounded-t-xl" />
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <SkeletonLoader height="h-5" width="w-32" />
                                <SkeletonLoader height="h-12" width="w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${animations.fadeIn}`}>
            <SuccessAnimation
                show={showSuccessAnimation}
                onComplete={() => setShowSuccessAnimation(false)}
            />

            {/* Header */}
            <div className={animations.slideIn}>
                <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
                        <p className="text-gray-600 mt-1">Personnalisez votre espace et gérez vos préférences</p>
                    </div>
                </div>
            </div>

            {showAlert && (
                <div className={animations.slideIn}>
                    <Alert
                        type="info"
                        message="💡 Les modifications seront appliquées immédiatement à votre compte et votre entreprise."
                        onClose={() => setShowAlert(false)}
                    />
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`
                                    group inline-flex items-center py-4 px-6 font-medium text-sm rounded-t-2xl transition-all duration-300 relative
                                    ${isActive
                                        ? `bg-white ${tab.color} border-t-2 border-x-2 border-current shadow-sm transform translate-y-0`
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 transform translate-y-1'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 mr-2 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${animations.scaleIn}`}>
                <div className="p-8">
                    {activeTab === 'entreprise' && (
                        <EntrepriseForm
                            entreprise={authEntreprise}
                            onSuccess={handleSuccess}
                            onUpdate={setEntreprise}
                        />
                    )}

                    {activeTab === 'utilisateur' && (
                        <UserForm
                            user={authUser}
                            onSuccess={handleSuccess}
                            onUpdate={updateUser}
                        />
                    )}

                    {activeTab === 'conditions' && (
                        <ConditionsForm
                            entreprise={authEntreprise}
                            onSuccess={handleSuccess}
                            onUpdate={setEntreprise}
                        />
                    )}

                    {activeTab === 'devises' && (
                        <CurrencyForm
                            entreprise={authEntreprise}
                            onSuccess={handleSuccess}
                            onUpdate={setEntreprise}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
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
    );
}
