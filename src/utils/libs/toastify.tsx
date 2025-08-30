import React from 'react';
import { toast, ToastOptions, Id } from 'react-toastify';

const defaultOptions: ToastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
};

interface ToastConfig extends Partial<ToastOptions> {
    message: string;
}

// Composant pour le toast avec action
const ToastWithActionComponent: React.FC<{
    message: string;
    actionText: string;
    onAction: () => void;
    actionClassName?: string;
}> = ({ message, actionText, onAction, actionClassName }) => (
    <div className="flex items-center justify-between w-full">
        <span className="flex-1">{message}</span>
        <button
            onClick={() => {
                onAction();
                toast.dismiss();
            }}
            className={`ml-3 px-3 py-1 text-xs font-medium rounded-md transition-colors ${actionClassName || 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
        >
            {actionText}
        </button>
    </div>
);

export const toastUtils = {
    // Toast de succès
    success: (config: ToastConfig): Id => {
        const { message, ...options } = config;
        return toast.success(message, {
            ...defaultOptions,
            className: 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800',
            progressClassName: 'bg-gradient-to-r from-green-400 to-emerald-500',
            ...options,
        });
    },

    // Toast d'erreur
    error: (config: ToastConfig): Id => {
        const { message, ...options } = config;
        return toast.error(message, {
            ...defaultOptions,
            className: 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-800',
            progressClassName: 'bg-gradient-to-r from-red-400 to-pink-500',
            autoClose: 7000,
            ...options,
        });
    },

    // Toast d'avertissement
    warning: (config: ToastConfig): Id => {
        const { message, ...options } = config;
        return toast.warning(message, {
            ...defaultOptions,
            className: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 text-yellow-800',
            progressClassName: 'bg-gradient-to-r from-yellow-400 to-orange-500',
            ...options,
        });
    },

    // Toast d'information
    info: (config: ToastConfig): Id => {
        const { message, ...options } = config;
        return toast.info(message, {
            ...defaultOptions,
            className: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800',
            progressClassName: 'bg-gradient-to-r from-blue-400 to-indigo-500',
            ...options,
        });
    },

    // Toast de chargement avec promesse
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            pending: string;
            success: string | ((data: T) => string);
            error: string | ((error: unknown) => string);
        },
        options?: Partial<ToastOptions>
    ): Promise<T> => {
        return toast.promise(
            promise,
            {
                pending: {
                    render: messages.pending,
                    className: 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-500 text-gray-800',
                },
                success: {
                    render: ({ data }: { data: T }) => {
                        return typeof messages.success === 'function'
                            ? messages.success(data)
                            : messages.success;
                    },
                    className: 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800',
                },
                error: {
                    render: ({ data }) => {
                        return typeof messages.error === 'function'
                            ? messages.error(data)
                            : messages.error;
                    },
                    className: 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-800',
                }
            },
            {
                ...defaultOptions,
                ...options,
            } as ToastOptions<T>
        ) as Promise<T>;
    },

    // Toast personnalisé
    custom: (config: ToastConfig & { type?: 'default' }): Id => {
        const { message, type = 'default', ...options } = config;
        return toast(message, {
            ...defaultOptions,
            type,
            ...options,
        });
    },

    // Méthodes utilitaires
    dismiss: (toastId?: Id) => toast.dismiss(toastId),

    dismissAll: () => toast.dismiss(),

    // Toast avec action personnalisée
    withAction: (config: ToastConfig & {
        actionText: string;
        onAction: () => void;
        actionClassName?: string;
    }): Id => {
        const { message, actionText, onAction, actionClassName, ...options } = config;

        return toast(
            React.createElement(ToastWithActionComponent, {
                message,
                actionText,
                onAction,
                actionClassName
            }),
            {
                ...defaultOptions,
                autoClose: false,
                ...options,
            }
        );
    },
};

export const {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    promise: toastPromise,
    custom: toastCustom,
    dismiss: toastDismiss,
    dismissAll: toastDismissAll,
    withAction: toastWithAction,
} = toastUtils;
