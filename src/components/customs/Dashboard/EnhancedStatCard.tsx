import { TrendingDown, TrendingUp } from "lucide-react";

interface EnhancedStatCardProps {
    title: string;
    value: string | number;
    evolution: number;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
    prefix?: string;
    suffix?: string;
}

const EnhancedStatCard = ({
    title,
    value,
    evolution,
    icon: Icon,
    color = 'blue',
    prefix = '',
    suffix = ''
}: EnhancedStatCardProps) => {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-500',
            shadow: 'shadow-blue-500/25',
            light: 'bg-blue-50',
            border: 'border-blue-200'
        },
        green: {
            bg: 'bg-green-500',
            shadow: 'shadow-green-500/25',
            light: 'bg-green-50',
            border: 'border-green-200'
        },
        yellow: {
            bg: 'bg-yellow-500',
            shadow: 'shadow-yellow-500/25',
            light: 'bg-yellow-50',
            border: 'border-yellow-200'
        },
        purple: {
            bg: 'bg-purple-500',
            shadow: 'shadow-purple-500/25',
            light: 'bg-purple-50',
            border: 'border-purple-200'
        },
        red: {
            bg: 'bg-red-500',
            shadow: 'shadow-red-500/25',
            light: 'bg-red-50',
            border: 'border-red-200'
        }
    };

    const isPositive = evolution >= 0;
    const colors = colorClasses[color];

    return (
        <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${colors.border} hover:shadow-xl transition-all duration-300 group`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center ${colors.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(evolution)}%
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                    {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
                </p>
                <p className="text-sm text-gray-500">
                    {isPositive ? 'Augmentation' : 'Diminution'} par rapport au mois précédent
                </p>
            </div>
        </div>
    );
};

export default EnhancedStatCard;
