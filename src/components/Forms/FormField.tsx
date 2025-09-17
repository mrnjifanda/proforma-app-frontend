import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface FormFieldProps {
    label: string;
    name: string;
    type?: string;
    placeholder: string;
    icon?: React.ComponentType<any>;
    required?: boolean;
    maxLength?: number;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    error?: string;
    isTouched: boolean;
    disabled?: boolean;
    showPasswordToggle?: boolean;
}

const FormField = ({
    label,
    name,
    type = 'text',
    placeholder,
    icon: Icon,
    required = false,
    maxLength,
    value,
    onChange,
    onBlur,
    error,
    isTouched,
    disabled = false,
    showPasswordToggle = false, // ✅ Par défaut désactivé
}: FormFieldProps) => {
    const hasError = error && isTouched;

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {/* Icône à gauche (ex: UserIcon, Key) */}
                {Icon && (
                    <Icon className={`absolute left-3 top-4 transform w-5 h-5 ${hasError ? 'text-red-500' : 'text-gray-400'}`} />
                )}

                {/* Champ d'input */}
                <input
                    name={name}
                    type={showPasswordToggle ? (value ? 'text' : 'password') : type} // ✅ Toggle dynamique pour mot de passe
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    className={`w-full ${
                        Icon ? 'pl-10' : 'pl-4'
                    } pr-12 py-3 rounded-lg border transition-colors ${
                        hasError
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                            : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    }`}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    disabled={disabled}
                />

                {(showPasswordToggle && !hasError) && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        aria-label={value ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                        {value ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                )}

                {/* Icône d'erreur à droite (si erreur) */}
                {hasError && (
                    <AlertCircle className="absolute right-3 top-4 w-5 h-5 text-red-500" />
                )}
            </div>

            {/* Message d'erreur */}
            {hasError && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                </p>
            )}

            {/* Compteur de caractères (si maxLength) */}
            {maxLength && (
                <p className="mt-1 text-xs text-gray-500 text-right">
                    {value.length}/{maxLength}
                </p>
            )}
        </div>
    );
};

export default FormField;
