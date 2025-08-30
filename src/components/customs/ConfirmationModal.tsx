'use client';

import { AlertTriangle, X, Info, CheckCircle, AlertCircle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = 'default'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        default: {
            icon: Info,
            iconColor: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700"
        },
        danger: {
            icon: AlertTriangle,
            iconColor: "text-red-600",
            button: "bg-red-600 hover:bg-red-700"
        },
        success: {
            icon: CheckCircle,
            iconColor: "text-green-600",
            button: "bg-green-600 hover:bg-green-700"
        },
        warning: {
            icon: AlertCircle,
            iconColor: "text-yellow-600",
            button: "bg-yellow-600 hover:bg-yellow-700"
        },
        info: {
            icon: Info,
            iconColor: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700"
        }
    };

    const { icon: Icon, iconColor, button } = variantStyles[variant];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <Icon className={`w-6 h-6 mr-2 ${iconColor}`} />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
