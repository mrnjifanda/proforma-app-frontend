import { ArrowUp } from "lucide-react";

const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    color = 'blue'
}: {
    title: string;
    value: string | number;
    trend: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        green: 'from-green-500 to-green-600 shadow-green-500/25',
        yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25'
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                        <ArrowUp className="w-3 h-3 mr-1" /> {trend}
                    </p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${colorClasses[color]}`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
