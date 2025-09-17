'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { configEntreprise } from '@/utils/constants';
import { getLogoLink } from '@/utils/helpers';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const success = await login(email, password);
            if (success) {
                router.push('/dashboard');
            } else {
                setError('Email ou mot de passe incorrect');
            }
        } catch (err) {
            console.log('Login error:', err);
            setError('Erreur de connexion. Veuillez réessayer.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-800 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                {/* Animated gradient orbs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 0)`,
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    {/* Login Card */}
                    <div className="bg-secondary-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary-500/20 p-8 relative overflow-hidden">
                        {/* Card glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-primary-500/5 rounded-2xl"></div>

                        {/* Header */}
                        <div className="relative text-center mb-8">
                            {/* Logo avec effet de lueur */}
                            <div className="mx-auto w-20 h-20 flex items-center justify-center mb-6 relative">
                                <Image
                                    src={getLogoLink(configEntreprise.logo)}
                                    alt="Logo de l'entreprise"
                                    width={80}
                                    height={80}
                                    className="relative z-10 object-contain"
                                    loading="eager"
                                    priority
                                />
                            </div>

                            <h1 className="text-3xl font-bold text-or mb-2">
                                {configEntreprise.nom}
                            </h1>

                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="form-label flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-primary-500" />
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-screentech pl-10"
                                        placeholder="admin@screentech.com"
                                        required
                                    />
                                    <Mail className="absolute left-3 mt-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="form-label flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary-500" />
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-screentech pl-10 pr-10"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                    <Lock className="absolute left-3 mt-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 mt-2 transform -translate-y-1/2 text-secondary-400 hover:text-primary-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm fade-in">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        {error}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-secondary-900 font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:glow-gold relative overflow-hidden group"
                            >
                                {/* Button glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-primary-600/20 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300"></div>

                                <div className="relative z-10 flex items-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            <span>Connexion en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Se connecter</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8">
                        <p className="text-secondary-400 text-sm">
                            © 2025 {configEntreprise.nom}. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}