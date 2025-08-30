const QuickActionCard = ({
    title,
    description,
    href,
    icon: Icon,
    color = 'blue'
}: {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    color?: string;
}) => {
    const colorClasses: Record<string, { border: string; bg: string; iconBg: string; iconColor: string; text: string; desc: string }> = {
        blue: {
            border: 'border-blue-300',
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100 group-hover:bg-blue-200',
            iconColor: 'text-blue-600',
            text: 'group-hover:text-blue-900',
            desc: 'group-hover:text-blue-700'
        },
        green: {
            border: 'border-green-300',
            bg: 'bg-green-50',
            iconBg: 'bg-green-100 group-hover:bg-green-200',
            iconColor: 'text-green-600',
            text: 'group-hover:text-green-900',
            desc: 'group-hover:text-green-700'
        },
        yellow: {
            border: 'border-yellow-300',
            bg: 'bg-yellow-50',
            iconBg: 'bg-yellow-100 group-hover:bg-yellow-200',
            iconColor: 'text-yellow-600',
            text: 'group-hover:text-yellow-900',
            desc: 'group-hover:text-yellow-700'
        },
        purple: {
            border: 'border-purple-300',
            bg: 'bg-purple-50',
            iconBg: 'bg-purple-100 group-hover:bg-purple-200',
            iconColor: 'text-purple-600',
            text: 'group-hover:text-purple-900',
            desc: 'group-hover:text-purple-700'
        }
    };

    const colors = colorClasses[color];

    return (
        <a
            href={href}
            className={`group p-6 border-2 border-gray-200 rounded-xl hover:${colors.border} hover:${colors.bg} transition-all duration-200 hover:shadow-md`}
        >
            <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                <Icon className={`w-6 h-6 ${colors.iconColor}`} />
            </div>
            <h4 className={`font-bold text-gray-900 mb-2 ${colors.text}`}>{title}</h4>
            <p className={`text-sm text-gray-600 ${colors.desc}`}>{description}</p>
        </a>
    );
};

export default QuickActionCard;