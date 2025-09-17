'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
    Home,
    ArrowLeft,
    AlertTriangle,
    Search,
    HelpCircle,
    ArrowRight
} from 'lucide-react';
import { configEntreprise } from '@/utils/constants';
import Image from 'next/image';
import { getLogoLink } from '@/utils/helpers';

export default function Interactive404() {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const fullText = "404 - Page non trouvée";

    useEffect(() => {
        if (currentIndex < fullText.length) {
            const timer = setTimeout(() => {
                setDisplayedText(fullText.substring(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, fullText]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center text-indigo-600 font-semibold text-lg mb-8">
                        <Image
                            src={getLogoLink(configEntreprise.logo)}
                            alt={configEntreprise.nom}
                            width={100}
                            height={100}
                            className='mr-3 rounded-xl'
                        />
                        <span className='text-5xl'>{configEntreprise.nom}</span>
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-center">
                    <div className="lg:w-1/2">
                        <div className="relative mb-8">
                            <div className="w-48 h-48 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-24 h-24 text-red-500" />
                            </div>
                            <div className="absolute -top-2 -right-2">
                                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <Search className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6 min-h-[4rem]">
                            {displayedText}
                            <span className="animate-pulse">|</span>
                        </h1>

                        <p className="text-gray-600 text-lg mb-8">
                            Nous avons cherché partout, mais cette page semble introuvable.
                            Peut-être a-t-elle été déplacée, supprimée ou n&apos;a-t-elle jamais existé.
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <HelpCircle className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Conseil :</strong> Vérifiez l&apos;URL dans la barre d&apos;adresse pour vous assurer qu&apos;elle est correcte.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-8">
                            <Link
                                href="/"
                                className="flex items-center justify-between px-6 py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors group"
                            >
                                <div className="flex items-center">
                                    <Home className="w-5 h-5 mr-3" />
                                    Retour à la page d&apos;accueil
                                </div>
                                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center justify-between px-6 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center">
                                    <ArrowLeft className="w-5 h-5 mr-3" />
                                    Retour à la page précédente
                                </div>
                                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rechercher sur le site</h2>
                            <form className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Que recherchez-vous ?"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Rechercher
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <p className="text-gray-600 mb-4 md:mb-0">
                            Vous pensez qu&apos;il s&apos;agit d&apos;une erreur ?{" "}
                            <Link href="https://www.njifanda.com" className="text-indigo-600 hover:underline font-medium">
                                Contactez notre équipe support
                            </Link>
                        </p>
                        <div className="flex items-center space-x-4">
                            <Link href="/sitemap" className="text-gray-600 hover:text-indigo-600 text-sm">
                                Plan du site
                            </Link>
                            <Link href="/help" className="text-gray-600 hover:text-indigo-600 text-sm">
                                Centre d&apos;aide
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}