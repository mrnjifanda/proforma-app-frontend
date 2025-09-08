'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface AlertProps {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    onClose?: () => void;
    autoClose?: number;
    className?: string;
}

export default function Alert({
    type,
    message,
    onClose,
    autoClose,
    className = ''
}: AlertProps) {

    const getIcon = () => {
        switch (type) {
            case 'info':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'success':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getClasses = () => {
        switch (type) {
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose]);

    return (
        <div className={`flex items-start p-4 border rounded-xl ${getClasses()} ${className}`}>
            <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{message}</p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-auto flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors"
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
