const ClientCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
        <div className="p-5">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <div className="bg-gray-200 w-10 h-10 rounded-lg mr-3"></div>
                    <div>
                        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </div>
                </div>
                <div className="flex space-x-1">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
    </div>
);

export default ClientCardSkeleton;
