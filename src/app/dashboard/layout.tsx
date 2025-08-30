'use client';

import { useAuth } from '@/utils/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePanier } from '@/utils/contexts/PanierContext';
import { Home, Users, FileText, Store, Calculator, X, Menu, LogOut } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

const menuItems = [
    {
        name: 'Tableau de bord',
        href: '/dashboard',
        icon: <Home className="w-5 h-5" />
    },
    {
        name: 'Clients',
        href: '/dashboard/clients',
        icon: <Users className="w-5 h-5" />
    },
    {
        name: 'Produits',
        href: '/dashboard/produits',
        icon: <Store className="w-5 h-5" />
    },
    {
        name: 'Devis',
        href: '/dashboard/devis',
        icon: <Calculator className="w-5 h-5" />
    },
    {
        name: 'Proformas',
        href: '/dashboard/proformas',
        icon: <FileText className="w-5 h-5" />
    }
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, entreprise, logout, isLoading } = useAuth();
    const { panier } = usePanier();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || !entreprise)) {
            router.push('/login');
        }
    }, [isLoading, user, entreprise, router]);

    // Fonction pour déterminer si un lien est actif
    const isActiveLink = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard/' || pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement en cours...</p>
                </div>
            </div>
        );
    }

    if (!user || !entreprise) {
        return null;
    }

    const totalItemsPanier = panier.lignes.reduce((total, ligne) => total + ligne.quantite, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-all duration-300 ease-in-out lg:translate-x-0 border-r border-gray-200`}>

                {/* Logo */}
                <div className="flex items-center justify-between h-20 px-6 border-b bg-secondary-950">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 flex items-center justify-center backdrop-blur-sm">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={40}
                                height={40}
                                className="w-8 h-8 object-cover rounded-full"
                            />
                        </div>
                        <span className="text-xl font-bold text-or">Screentech</span>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-8 px-4 pb-6 overflow-y-auto">
                    <ul className="space-y-3">
                        {menuItems.map((item) => {

                            const isActive = isActiveLink(item.href);
                            const isCart = item.href === '/dashboard/devis';

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 transform scale-[1.02]'
                                            : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:text-indigo-600 hover:scale-[1.01] hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'
                                                }`}>
                                                {item.icon}
                                            </div>
                                            <span className="font-semibold">{item.name}</span>
                                        </div>
                                        {isCart && totalItemsPanier > 0 && (
                                            <div className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 ${isActive
                                                ? 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                                                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm'
                                            }`}>
                                                {totalItemsPanier}
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User info en bas de la sidebar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50/90 to-transparent backdrop-blur-sm">
                    <div className="flex items-center space-x-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-sm font-bold text-white">
                                {user.role.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.role}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay pour mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Contenu principal */}
            <div className="lg:ml-72">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 h-20 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {menuItems.find(item => isActiveLink(item.href))?.name || 'Tableau de bord'}
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Gérez vos devis et proformas facilement
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Bouton de déconnexion */}
                        <button
                            onClick={logout}
                            className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group"
                            title="Se déconnecter"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Contenu de la page */}
                <main className="p-6 min-h-[calc(100vh-5rem)]">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}