import { Produit } from "@/utils/types";
import { X, Package, Hash, FileText, DollarSign, Percent, Archive, Coins, Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ProductDetailProps {
    produit: Produit;
    isOpen: boolean;
    onClose: () => void;
}

const ProductDetail = ({ produit, isOpen, onClose }: ProductDetailProps) => {

    console.log("produit: ", produit);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!isOpen) return null;

    const currency = typeof produit.currency === 'object' ? produit.currency : null;
    const currencySymbol = currency?.symbol || '$';
    const currencyCode = currency?.code || 'USD';

    const images = produit.files?.filter(file => file.type?.startsWith('image/')) || [];
    const hasImages = images.length > 0;

    const formatPrice = (price: number) => {
        return `${currencySymbol} ${price.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Calculer le prix TTC
    const ttcPrice = produit.prixUnitaireHT * (1 + produit.tauxTVA / 100);

    // Navigation des images
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Formatter la date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{produit.nom}</h2>
                            <p className="text-sm text-gray-500">Réf: {produit.reference}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Images */}
                        <div>
                            {hasImages ? (
                                <div className="space-y-4">
                                    {/* Image principale */}
                                    <div className="relative bg-gray-100 rounded-lg overflow-hidden h-80">
                                        <img
                                            src={images[currentImageIndex]?.link}
                                            alt={`${produit.nom} - Image ${currentImageIndex + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '';
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />

                                        {/* Navigation des images */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                    {currentImageIndex + 1} / {images.length}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Miniatures */}
                                    {images.length > 1 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {images.slice(0, 4).map((image, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                            ? 'border-blue-500'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <img
                                                        src={image.link}
                                                        alt={`Miniature ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                            {images.length > 4 && (
                                                <div className="h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                                                    +{images.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Aucune image disponible</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Informations */}
                        <div className="space-y-6">
                            {/* Statut et devise */}
                            <div className="flex items-center justify-between">
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${produit.actif
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {produit.actif ? 'Produit actif' : 'Produit inactif'}
                                </div>
                                {currency && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Coins className="w-4 h-4 mr-2" />
                                        <span className="mr-1">{currency.flag}</span>
                                        <span>{currency.name} ({currencyCode})</span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {produit.description && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <FileText className="w-5 h-5 text-gray-500 mr-2" />
                                        <h3 className="font-semibold text-gray-900">Description</h3>
                                    </div>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {produit.description}
                                    </p>
                                </div>
                            )}

                            {/* Prix et informations */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <DollarSign className="w-5 h-5 text-gray-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">Prix HT</span>
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formatPrice(produit.prixUnitaireHT)}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Percent className="w-5 h-5 text-gray-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">TVA</span>
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {produit.tauxTVA}%
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                                    <div className="flex items-center mb-2">
                                        <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                                        <span className="text-sm font-medium text-blue-700">Prix TTC</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatPrice(ttcPrice)}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Archive className="w-5 h-5 text-gray-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">Stock</span>
                                    </div>
                                    <div className={`text-xl font-bold ${produit.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {produit.stock} unités
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Hash className="w-5 h-5 text-gray-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">Référence</span>
                                    </div>
                                    <div className="text-lg font-mono text-gray-900">
                                        {produit.reference}
                                    </div>
                                </div>
                            </div>

                            {/* Métadonnées */}
                            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-500">
                                {produit.created_at && (
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>Créé le {formatDate(produit.created_at.toString())}</span>
                                    </div>
                                )}
                                {produit.updated_at && produit.updated_at.toString() !== (produit.created_at as Date).toString() && (
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>Modifié le {formatDate(produit.updated_at.toString())}</span>
                                    </div>
                                )}
                                {produit.files && produit.files.length > 0 && (
                                    <div className="flex items-center">
                                        <Eye className="w-4 h-4 mr-2" />
                                        <span>{produit.files.length} fichier(s) attaché(s)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
