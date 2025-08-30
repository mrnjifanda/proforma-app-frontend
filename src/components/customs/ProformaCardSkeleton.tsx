const ProformaCardSkeleton = () => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
            <div className="p-5">
                {/* En-tête avec icône et titre */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className="w-9 h-9 bg-gray-200 rounded-lg mr-3"></div>
                        <div>
                            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                    </div>
                    <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Informations client */}
                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="ml-6 space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>

                {/* Grille d'informations */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-3">
                            <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                    ))}
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default ProformaCardSkeleton;