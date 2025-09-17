import { useState, useEffect } from 'react';
import { ConfigEntreprise } from '@/utils/types';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import { FileText, Save, RotateCcw } from 'lucide-react';
import QuillEditor from '@/components/Forms/QuillEditor';
import entrepriseService from '@/api/entreprise.service';

interface ConditionsFormProps {
    entreprise: ConfigEntreprise | null;
    onSuccess: () => void;
    onUpdate: (entreprise: ConfigEntreprise) => void;
}

export default function ConditionsForm({ entreprise, onSuccess, onUpdate }: ConditionsFormProps) {

    const [defaultConditions, setDefaultConditions] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Initialiser avec les conditions de l'entreprise
    useEffect(() => {
        if (entreprise?.conditions) {
            setDefaultConditions(entreprise.conditions);
        }
    }, [entreprise]);

    // Sauvegarde
    const handleSave = async () => {
        if (!entreprise?._id) return;

        setIsSaving(true);
        try {

            const response = await entrepriseService.update(entreprise._id, { 
                conditions: defaultConditions 
            });
            
            if (response.data?.error) {
                throw new Error(response.data.message || 'Erreur lors de la mise à jour');
            }

            const updatedEntreprise = { ...entreprise, conditions: defaultConditions };
            onUpdate(updatedEntreprise);
            onSuccess();
            toastSuccess({ message: 'Conditions par défaut mises à jour avec succès !' });
        } catch (error: any) {
            console.error('Erreur sauvegarde conditions:', error);
            toastError({ message: error.message || 'Erreur lors de la mise à jour des conditions.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reset
    const resetConditions = () => {
        setDefaultConditions(entreprise?.conditions || '');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-purple-600 rounded-2xl shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Conditions par défaut</h2>
                    <p className="text-gray-600">Éditez les conditions générales appliquées à vos documents</p>
                </div>
            </div>

            <div className="rounded-2xl p-1">
                <QuillEditor
                    value={defaultConditions}
                    onChange={setDefaultConditions}
                    placeholder="Entrez vos conditions générales par défaut qui apparaîtront sur vos devis et factures..."
                    height="350px"
                />
            </div>

            <div className="p-6 mt-5 rounded-2xl border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Utilisation des conditions
                </h3>
                <ul className="text-sm text-purple-700 space-y-2">
                    <li className="flex items-start space-x-2">
                        <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Ces conditions seront automatiquement appliquées à tous vos nouveaux proformas et factures.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Vous pouvez personnaliser les conditions pour chaque document individuellement si nécessaire.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Utilisez les options de formatage pour créer des documents professionnels.</span>
                    </li>
                </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-8 mt-4">
                <button
                    onClick={resetConditions}
                    disabled={isSaving}
                    className="px-6 py-3 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:scale-105"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Réinitialiser</span>
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 cursor-pointer bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:scale-105 hover:shadow-lg"
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Enregistrement...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Enregistrer les conditions</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
