import { LignePanier } from "@/utils/types";
import { Info } from "lucide-react";

interface TVADetail {
    baseHT: number;
    montantTVA: number;
}

const TVASummary = ({ lignes }: { lignes: LignePanier[] }) => {

    if (!lignes || lignes.length === 0) {
        return null;
    }

    const tvaDetails = lignes.reduce((acc, ligne) => {

        if (!ligne || typeof ligne.tauxTVA !== 'number' || typeof ligne.prixUnitaireHT !== 'number' || typeof ligne.quantite !== 'number') {
            return acc;
        }

        const taux = ligne.tauxTVA;
        const montantHT = ligne.prixUnitaireHT * ligne.quantite;
        const montantTVA = montantHT * taux / 100;

        if (!acc[taux]) {
            acc[taux] = { baseHT: 0, montantTVA: 0 };
        }
        acc[taux].baseHT += montantHT;
        acc[taux].montantTVA += montantTVA;

        return acc;
    }, {} as Record<number, TVADetail>);

    if (Object.keys(tvaDetails).length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-700 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                Détail TVA
            </div>
            <div className="space-y-2">
                {Object.entries(tvaDetails)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([taux, data]) => (
                    <div key={taux} className="flex justify-between text-sm">
                        <span className="text-gray-600">TVA {Number(taux).toFixed(1)}%:</span>
                        <div className="text-right">
                            <div className="font-medium">
                                {data.montantTVA.toLocaleString('fr-FR', { 
                                    style: 'currency', 
                                    currency: 'USD',
                                    minimumFractionDigits: 2 
                                })}
                            </div>
                            <div className="text-xs text-gray-500">
                                Base HT: {data.baseHT.toLocaleString('fr-FR', { 
                                    style: 'currency', 
                                    currency: 'USD',
                                    minimumFractionDigits: 2 
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TVASummary;