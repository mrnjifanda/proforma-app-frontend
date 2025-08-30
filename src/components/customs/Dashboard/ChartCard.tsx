import { BarChart3 } from "lucide-react";

const ChartCard = ({ title, children, className = '' }: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 ${className}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
            {title}
        </h3>
        {children}
    </div>
);

export default ChartCard;
