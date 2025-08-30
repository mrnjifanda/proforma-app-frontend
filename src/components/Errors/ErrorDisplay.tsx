import { ArrowLeft, X } from "lucide-react";
import { useMemo } from "react";

interface ErrorDisplayProps {
    error: string;
    onRetry?: () => void;
    onGoBack: () => void;
}

function ErrorDisplay({ error, onRetry, onGoBack }: ErrorDisplayProps) {
    const getErrorMessage = useMemo(() => {
        switch (error) {
            case 'not-found':
                return {
                    title: 'Devis introuvable',
                    message: 'Le devis demandé n\'existe pas ou a été supprimé'
                };
            case 'unauthorized':
                return {
                    title: 'Accès refusé',
                    message: 'Vous n\'avez pas les permissions pour accéder à ce devis'
                };
            default:
                return {
                    title: 'Erreur de chargement',
                    message: 'Une erreur est survenue lors du chargement du devis'
                };
        }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {getErrorMessage.title}
                </h1>
                <p className="text-gray-600 mb-6">
                    {getErrorMessage.message}
                </p>
                <div className="flex gap-3 justify-center">
                    {onRetry && error !== 'not-found' && error !== 'unauthorized' && (
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Réessayer
                        </button>
                    )}
                    <button
                        onClick={onGoBack}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour à la liste
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ErrorDisplay;
