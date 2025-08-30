import { Activity, Check, Clock, FileText, Package, User } from "lucide-react";

const RecentActivityItem = ({ type, message, date }: {
    type: string;
    message: string;
    date: string;
}) => {
    const iconMap: Record<string, { icon: React.ElementType, bg: string }> = {
        client: { icon: User, bg: 'bg-blue-100' },
        proforma: { icon: FileText, bg: 'bg-yellow-100' },
        devis: { icon: Check, bg: 'bg-green-100' },
        produit: { icon: Package, bg: 'bg-gray-100' }
    };

    const { icon: Icon, bg } = iconMap[type] || { icon: Activity, bg: 'bg-gray-100' };

    return (
        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${type === 'client' ? 'text-blue-600' :
                    type === 'proforma' ? 'text-yellow-600' :
                        type === 'devis' ? 'text-green-600' : 'text-gray-600'
                    }`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                    {message}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
                    <Clock className="w-3 h-3 mr-2" />
                    {new Date(date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>
        </div>
    );
};

export default RecentActivityItem;