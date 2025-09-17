import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessAnimationProps {
    show: boolean;
    onComplete: () => void;
}

export default function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl animate-[bounceIn_0.6s_ease-out]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-600 animate-[checkMark_0.6s_ease-out]" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900">Modifications sauvegardées !</p>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes checkMark {
                    0% {
                        stroke-dasharray: 44;
                        stroke-dashoffset: 44;
                    }
                    100% {
                        stroke-dasharray: 44;
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    );
}
