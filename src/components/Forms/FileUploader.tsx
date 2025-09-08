import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Upload, X, File as FileIcon, Image, FileText, Video, Music, Archive, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { FileService } from '../../api/file.service';
import { FileConfig, FileInterface } from '@/utils/types';

interface FileUploaderProps {

    // Configuration
    multiple?: boolean;
    maxFiles?: number;
    maxFileSize?: number; // en MB
    acceptedTypes?: string[];
    fileConfigs?: FileConfig[];

    // Callbacks
    onUploadSuccess: (files: FileInterface[]) => void;
    onUploadError?: (error: string) => void;
    onFilesChange?: (files: File[]) => void;

    // UI
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    showPreview?: boolean;

    // Validation
    validateFile?: (file: File) => string | null;

    // Existing files (URLs from parent)
    existingFiles?: FileInterface[];
}

interface FileWithPreview extends File {
    id: string;
    preview?: string;
    uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    isExisting?: boolean;
}

interface ExistingFileDisplay {
    id: string;
    link: string;
    type: string;
    size: number;
    filename: string;
    preview?: string;
    isExisting: true;
}

type DisplayFile = FileWithPreview | ExistingFileDisplay;

// Constants de sécurité
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

const FileUploader = ({
    multiple = false,
    maxFiles = 10,
    maxFileSize = 10,
    acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
    fileConfigs = [],
    onUploadSuccess,
    onUploadError,
    onFilesChange,
    placeholder,
    disabled = false,
    className = '',
    showPreview = true,
    validateFile,
    existingFiles = []
}: FileUploaderProps) => {

    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [existingDisplayFiles, setExistingDisplayFiles] = useState<ExistingFileDisplay[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);

    // Générer un ID unique et sécurisé
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Memoized file type checking
    const getAllowedTypes = useMemo(() => {
        const typeMap = new Set([
            ...ALLOWED_IMAGE_TYPES,
            ...ALLOWED_DOCUMENT_TYPES,
            ...ALLOWED_VIDEO_TYPES,
            ...ALLOWED_AUDIO_TYPES
        ]);
        return Array.from(typeMap);
    }, []);

    // Sanitize filename
    const sanitizeFileName = useCallback((filename: string): string => {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 255);
    }, []);

    // Obtenir l'icône appropriée selon le type de fichier
    const getFileIcon = useCallback((type?: string) => {

        if (!type) return FileIcon;

        const cleanType = type.toLowerCase();

        if (cleanType.startsWith('image/')) return Image;
        if (cleanType.startsWith('video/')) return Video;
        if (cleanType.startsWith('audio/')) return Music;
        if (cleanType.includes('pdf')) return FileText;
        if (cleanType.includes('zip') || cleanType.includes('rar') || cleanType.includes('tar')) return Archive;

        return FileIcon;
    }, []);

    // Formatter la taille du fichier
    const formatFileSize = useCallback((bytes: number): string => {
        if (!bytes || isNaN(bytes) || bytes <= 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    // Validation de sécurité renforcée
    const validateSingleFile = useCallback((file: File): string | null => {
        // Vérification de la taille absolue
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return `Le fichier dépasse la taille maximale absolue de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`;
        }

        // Vérification de la taille configurée
        if (file.size > maxFileSize * 1024 * 1024) {
            return `Le fichier dépasse la taille maximale de ${maxFileSize}MB`;
        }

        // Vérification du nom de fichier
        if (file.name.length > 255) {
            return 'Le nom du fichier est trop long (max 255 caractères)';
        }

        // Vérification des caractères dangereux
        if (/[<>:"\/\\|?*\x00-\x1f]/.test(file.name)) {
            return 'Le nom du fichier contient des caractères non autorisés';
        }

        // Validation du type MIME
        const isValidMimeType = getAllowedTypes.includes(file.type) ||
            acceptedTypes.some(type => {
                if (type.includes('*')) {
                    const baseType = type.split('/')[0];
                    return file.type.startsWith(baseType + '/');
                }
                return file.type === type;
            });

        // Validation par extension
        const isValidExtension = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            return true;
        });

        if (!isValidMimeType && !isValidExtension) {
            return `Type de fichier non autorisé. Types acceptés: ${acceptedTypes.join(', ')}`;
        }

        // Validation personnalisée
        if (validateFile) {
            const customError = validateFile(file);
            if (customError) return customError;
        }

        return null;
    }, [maxFileSize, acceptedTypes, validateFile, getAllowedTypes]);

    // Créer un aperçu sécurisé pour les images
    const createPreview = useCallback((file: File): Promise<string | undefined> => {
        return new Promise((resolve) => {
            if (!showPreview) {
                resolve(undefined);
                return;
            }

            if (file.type.startsWith('image/') && ALLOWED_IMAGE_TYPES.includes(file.type)) {

                if (typeof FileReader === 'undefined') {
                    console.warn('FileReader non disponible dans cet environnement');
                    resolve(undefined);
                    return;
                }

                const reader = new FileReader();

                const timeout = setTimeout(() => {
                    reader.abort();
                    resolve(undefined);
                }, 5000); // Timeout de 5 secondes

                reader.onload = (e) => {
                    clearTimeout(timeout);
                    const result = e.target?.result as string;

                    // Vérification basique de la validité de l'image
                    if (result && result.startsWith('data:image/')) {
                        resolve(result);
                    } else {
                        resolve(undefined);
                    }
                };

                reader.onerror = () => {
                    clearTimeout(timeout);
                    resolve(undefined);
                };

                reader.readAsDataURL(file);
            } else {
                resolve(undefined);
            }
        });
    }, [showPreview]);

    // Créer un aperçu pour les fichiers existants
    const createExistingFilePreview = useCallback((fileData: FileInterface): string | undefined => {
        if (!showPreview || !fileData.type?.startsWith('image/')) {
            return undefined;
        }
        return fileData.link;
    }, [showPreview]);

    // Extraire le nom de fichier à partir de l'URL
    const extractFileNameFromUrl = useCallback((url: string, fallback: string = 'Fichier'): string => {
        try {
            // Extraire le nom de fichier de l'URL
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];

            // Décoder les caractères encodés dans l'URL
            const decodedFileName = decodeURIComponent(fileName);

            // Si le nom contient un point, c'est probablement un vrai nom de fichier
            if (decodedFileName.includes('.')) {
                return decodedFileName;
            }

            return fallback;
        } catch (error) {
            console.warn('Erreur lors de l\'extraction du nom de fichier:', error);
            return fallback;
        }
    }, []);

    // Traiter les fichiers sélectionnés
    const processFiles = useCallback(async (fileList: FileList | File[]) => {
        const newFiles: FileWithPreview[] = [];
        const filesArray = Array.from(fileList);

        const totalFiles = files.length + existingDisplayFiles.length + filesArray.length;
        if (totalFiles > maxFiles) {
            onUploadError?.(`Vous ne pouvez télécharger que ${maxFiles} fichier(s) au maximum`);
            return;
        }

        const processPromises = filesArray.slice(0, maxFiles).map(async (file) => {

            if (!file || typeof file !== 'object' || !('name' in file)) {
                console.error('Fichier invalide reçu :', file);
                return null;
            }

            // DEBUG
            console.log('Fichier original :', {
                name: file.name,
                type: file.type,
                size: file.size,
                isFile: file instanceof File
            });

            const error = validateSingleFile(file as File);
            let preview: string | undefined = undefined;

            try {
                preview = await createPreview(file as File);
            } catch (previewError) {
                console.warn(`Erreur lors de la création de l'aperçu pour`, file.name, previewError);
            }

            const fileWithPreview: FileWithPreview = Object.assign(file, {
                id: generateId(),
                preview,
                uploadStatus: error ? 'error' : 'pending',
                error: error || undefined,
                isExisting: false,
            }) as FileWithPreview;

            return fileWithPreview;
        });

        try {
            const processedFiles = (await Promise.all(processPromises)).filter(Boolean) as FileWithPreview[];
            newFiles.push(...processedFiles);

            const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
            setFiles(updatedFiles);

            const validFiles = updatedFiles.filter(f => !f.error);
            onFilesChange?.(validFiles);
        } catch (error) {
            console.error('Erreur lors du traitement des fichiers :', error);
            onUploadError?.('Erreur lors du traitement des fichiers');
        }
    }, [files, existingDisplayFiles.length, maxFiles, multiple, validateSingleFile, createPreview, generateId, onFilesChange, onUploadError]);

    // Gestion améliorée du drag & drop
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) {
            setIsDragOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragOver(false);

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            processFiles(droppedFiles);
        }
    }, [disabled, processFiles]);

    // Gestion du clic pour sélectionner des fichiers
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {

        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            processFiles(selectedFiles);
        }
        // Reset input pour permettre la sélection du même fichier
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFiles]);

    // Supprimer un fichier
    const removeFile = useCallback((fileId: string) => {
        const updatedFiles = files.filter(f => f.id !== fileId);
        setFiles(updatedFiles);

        const validFiles = updatedFiles.filter(f => !f.error);
        onFilesChange?.(validFiles);
    }, [files, onFilesChange]);

    // Supprimer un fichier existant
    const removeExistingFile = useCallback((fileId: string) => {
        const updatedFiles = existingDisplayFiles.filter(f => f.id !== fileId);
        setExistingDisplayFiles(updatedFiles);
    }, [existingDisplayFiles]);

    // Upload des fichiers avec gestion d'erreur améliorée
    const handleUpload = useCallback(async () => {
        const validFiles = files.filter(f => f.uploadStatus === 'pending');

        if (validFiles.length === 0) {
            onUploadError?.('Aucun fichier valide à télécharger');
            return;
        }

        setIsUploading(true);

        setFiles(prev => prev.map(f =>
            f.uploadStatus === 'pending' ? { ...f, uploadStatus: 'uploading' as const } : f
        ));

        try {
            const sanitizedFiles = validFiles.map(file => {
                let sanitizedName = file.name || 'unknown_file';
                try {
                    sanitizedName = sanitizeFileName(sanitizedName);
                } catch (err) {
                    console.warn('Erreur lors de la sanitization du nom de fichier', err);
                    sanitizedName = 'unknown_file';
                }

                return new File([file], sanitizedName, {
                    type: file.type || 'application/octet-stream',
                    lastModified: file.lastModified,
                });
            });

            const response = await FileService.file(sanitizedFiles, fileConfigs);

            if (response && Array.isArray(response)) {

                setFiles(prev => prev.map((f, index) => {
                    if (f.uploadStatus === 'uploading') {
                        const serverFile = response[index];
                        if (serverFile) {
                            return {
                                ...f,
                                uploadStatus: 'success' as const,
                                name: f.name,
                                size: f.size
                            };
                        }
                    }
                    return f;
                }));

                onUploadSuccess(response);
            } else {
                throw new Error('Réponse invalide du serveur');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

            setFiles(prev => prev.map(f =>
                f.uploadStatus === 'uploading'
                    ? { ...f, uploadStatus: 'error' as const, error: errorMessage }
                    : f
            ));

            onUploadError?.(errorMessage);
        } finally {
            setIsUploading(false);
        }
    }, [files, fileConfigs, sanitizeFileName, onUploadSuccess, onUploadError]);

    // Ouvrir le sélecteur de fichiers
    const openFileSelector = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    // Effect pour traiter les fichiers existants du parent
    useEffect(() => {
        if (existingFiles.length > 0) {
            const displayFiles: ExistingFileDisplay[] = existingFiles.map(file => ({
                id: generateId(),
                link: file.link,
                type: file.type || 'application/octet-stream',
                size: file.size || 0,
                filename: file.filename || extractFileNameFromUrl(file.link, 'Fichier existant'),
                preview: createExistingFilePreview(file),
                isExisting: true
            }));
            setExistingDisplayFiles(displayFiles);
        } else {
            setExistingDisplayFiles([]);
        }
    }, [existingFiles, generateId, createExistingFilePreview, extractFileNameFromUrl]);

    // Cleanup des URLs d'aperçu pour éviter les fuites mémoire
    useEffect(() => {

        return () => {
            files.forEach(file => {
                if (file.preview && file.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [files]);

    // Combiner tous les fichiers pour l'affichage
    const allDisplayFiles: DisplayFile[] = useMemo(() => {
        return [...existingDisplayFiles, ...files];
    }, [existingDisplayFiles, files]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Zone de drop */}
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
                    ${isDragOver
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileSelector}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openFileSelector();
                    }
                }}
                aria-label="Zone de téléchargement de fichiers"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={acceptedTypes.join(',')}
                    onChange={handleFileSelect}
                    disabled={disabled}
                    className="hidden"
                    aria-hidden="true"
                />

                <div className="text-center">
                    <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-900">
                            {placeholder || (multiple ? 'Cliquez pour sélectionner des fichiers ou glissez-déposez' : 'Cliquez pour sélectionner un fichier ou glissez-déposez')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {multiple && `Maximum ${maxFiles} fichier(s) • `}
                            Taille max: {maxFileSize}MB
                        </p>
                        <p className="text-xs text-gray-500">
                            Types acceptés: {acceptedTypes.join(', ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Liste des fichiers */}
            {allDisplayFiles.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">
                        Fichiers ({allDisplayFiles.length})
                        {existingDisplayFiles.length > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                                ({existingDisplayFiles.length} existants, {files.length} nouveaux)
                            </span>
                        )}
                    </h4>

                    <div className="space-y-2">
                        {allDisplayFiles.map((file) => {
                            const isExisting = 'isExisting' in file && file.isExisting;
                            const IconComponent = getFileIcon(file.type);
                            const fileName = isExisting
                                ? (file as ExistingFileDisplay).filename
                                : ('name' in file ? file.name : 'Sans nom');
                            const fileSize = file.size || 0;

                            return (
                                <div
                                    key={file.id}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg border
                                        ${isExisting ? 'border-blue-200 bg-blue-50' : ''}
                                        ${!isExisting && (file as FileWithPreview).uploadStatus === 'success' ? 'border-green-200 bg-green-50' : ''}
                                        ${!isExisting && (file as FileWithPreview).uploadStatus === 'error' ? 'border-red-200 bg-red-50' : ''}
                                        ${!isExisting && (file as FileWithPreview).uploadStatus === 'pending' ? 'border-gray-200 bg-gray-50' : ''}
                                        ${!isExisting && (file as FileWithPreview).uploadStatus === 'uploading' ? 'border-indigo-200 bg-indigo-50' : ''}
                                    `}
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        {file.preview ? (
                                            <img
                                                src={file.preview}
                                                alt={fileName}
                                                className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md flex-shrink-0">
                                                <IconComponent className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                                                {fileName}
                                                {isExisting && <span className="text-xs text-blue-600 ml-1">(existant)</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(fileSize)}
                                            </p>
                                            {!isExisting && (file as FileWithPreview).error && (
                                                <p className="text-xs text-red-600 mt-1">{(file as FileWithPreview).error}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Statut */}
                                        {!isExisting && (file as FileWithPreview).uploadStatus === 'uploading' && (
                                            <Loader className="w-4 h-4 text-indigo-500 animate-spin" />
                                        )}
                                        {!isExisting && (file as FileWithPreview).uploadStatus === 'success' && (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        )}
                                        {!isExisting && (file as FileWithPreview).uploadStatus === 'error' && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        {isExisting && (
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                        )}

                                        {/* Bouton supprimer */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isExisting) {
                                                    removeExistingFile(file.id);
                                                } else {
                                                    removeFile(file.id);
                                                }
                                            }}
                                            disabled={isUploading}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                            aria-label={`Supprimer ${fileName}`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bouton d'upload */}
            {files.some(f => f.uploadStatus === 'pending') && (
                <div className="flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || disabled}
                        className={`
                            px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2
                            ${isUploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            }
                        `}
                        aria-label={isUploading ? 'Téléchargement en cours' : 'Commencer le téléchargement'}
                    >
                        {isUploading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Téléchargement...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                <span>Télécharger ({files.filter(f => f.uploadStatus === 'pending').length})</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUploader;