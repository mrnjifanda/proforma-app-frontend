export default function LoadingSpinner({ message }: { message?: string | null }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">{ message || 'Chargement en cours...' }</p>
            </div>
        </div>
    );
}