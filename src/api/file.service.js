import { toastSuccess, toastError, toastDismiss } from '@/utils/libs/toastify';
import apiService from './api.service';

export class FileService {

    static async file(files, fileConfigs = []) {

        if (!files || files.length === 0) {
            throw new Error('Aucun fichier fourni');
        }

        // Validation de sécurité
        const maxSizeBytes = 100 * 1024 * 1024; // 100MB
        for (const file of files) {
            if (file.size > maxSizeBytes) {
                throw new Error(`Le fichier "${file.name}" dépasse la taille maximale autorisée`);
            }
        }

        let toastId;

        try {

            toastId = toastSuccess({
                message: 'Upload en cours...',
                autoClose: false,
                className: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800'
            });

            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files[]', file);
            });

            if (fileConfigs.length > 0) {
                formData.append("fileConfigs", JSON.stringify(fileConfigs));
            }

            const token = apiService.getToken();
            const apiKey = apiService.getApiKey();

            if (!token) {
                throw new Error('Token d\'authentification manquant');
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            if (apiKey) {
                headers['X-API-KEY'] = apiKey;
            }

            const response = await fetch(`${apiService.getBaseUrl()}/app/file/upload/many`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Erreur lors de l\'upload des fichiers';

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();
            if (!result || !result.data) {
                throw new Error('Réponse invalide du serveur');
            }

            let uploadedFiles;

            if (Array.isArray(result.data)) {
                uploadedFiles = result.data.map(item => ({
                    link: item.url || item.link || '',
                    type: item.type || item.mimeType || 'application/octet-stream',
                    size: item.size || 0,
                    filename: item.filename || "Sans nom"
                }));
            } else if (typeof result.data === 'object' && result.data !== null) {
                uploadedFiles = Object.values(result.data).map(item => ({
                    link: item.url || item.link || '',
                    type: item.type || item.mimeType || 'application/octet-stream',
                    size: item.size || 0,
                    filename: item.filename || "Sans nom"
                }));
            } else {
                throw new Error('Format de réponse invalide : data doit être un tableau ou un objet');
            }

            const validFiles = uploadedFiles.filter(file =>
                file.link &&
                typeof file.link === 'string' &&
                file.link.trim() !== ''
            );

            if (validFiles.length === 0) {
                throw new Error('Aucun fichier valide retourné par le serveur');
            }

            if (toastId) {
                toastDismiss(toastId);
            }

            toastSuccess({
                message: `${validFiles.length} fichier(s) uploadé(s) avec succès!`
            });

            return validFiles;

        } catch (error) {

            if (toastId) {
                toastDismiss(toastId);
            }

            let errorMessage = 'Une erreur est survenue lors de l\'upload';

            if (error instanceof Error) {
                errorMessage = error.message;
                console.error("Upload Error: ", error.message, error);
            } else {
                console.error("Upload Error: ", error);
            }

            toastError({
                message: `Erreur d'upload: ${errorMessage}`,
                autoClose: 5000
            });

            throw new Error(errorMessage);

        } finally {

            if (toastId) {
                setTimeout(() => toastDismiss(toastId), 100);
            }
        }
    }

    static validateFile(file, options = {}) {

        const maxSizeBytes = (options.maxSize || 100) * 1024 * 1024;
        const allowedTypes = options.allowedTypes || [];

        if (file.size > maxSizeBytes) {
            return {
                isValid: false,
                error: `Le fichier dépasse la taille maximale de ${options.maxSize || 100}MB`
            };
        }

        if (allowedTypes.length > 0) {
            const isValidType = allowedTypes.some(type => {
                if (type.includes('*')) {
                    const baseType = type.split('/')[0];
                    return file.type.startsWith(baseType + '/');
                }
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type.toLowerCase());
                }
                return file.type === type;
            });

            if (!isValidType) {
                return {
                    isValid: false,
                    error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
                };
            }
        }

        if (file.name.length > 255) {
            return {
                isValid: false,
                error: 'Le nom du fichier est trop long (max 255 caractères)'
            };
        }

        if (/[<>:"\/\\|?*\x00-\x1f]/.test(file.name)) {
            return {
                isValid: false,
                error: 'Le nom du fichier contient des caractères non autorisés'
            };
        }

        return { isValid: true };
    }
}
