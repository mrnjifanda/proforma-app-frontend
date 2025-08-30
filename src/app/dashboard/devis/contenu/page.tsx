"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import panierService from '@/api/panier.service';
import PanierClientPage from '@/components/devis/PanierClientPage';
import { LoadingState, Panier } from '@/utils/types';
import { useEffect, useState } from 'react';
import { validateId } from '@/utils/helpers';
import LoadingSpinner from '@/components/loaders/LoadingSpinner';
import ErrorDisplay from '@/components/Errors/ErrorDisplay';

async function getPanier(id: string): Promise<{ data: Panier | null; error: string | null }> {
    try {

        if (!validateId(id)) {
            return { data: null, error: 'ID invalide' };
        }

        const response = await panierService.getById(id);
        if (!response?.data?.data) {
            return { data: null, error: 'Données invalides reçues' };
        }
        
        return { data: response.data.data, error: null };
    } catch (error) {
        console.error(`Erreur lors du chargement du panier ${id}:`, error);
        if (error instanceof Error) {
            if (error.message.includes('404') || error.message.includes('Not found')) {
                return { data: null, error: 'not-found' };
            }
            if (error.message.includes('403') || error.message.includes('Unauthorized')) {
                return { data: null, error: 'unauthorized' };
            }
        }
        
        return { data: null, error: 'Erreur de chargement' };
    }
}

function usePanierData(id: string | null) {

    const [loadingState, setLoadingState] = useState<LoadingState>('loading');
    const [panier, setPanier] = useState<Panier | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadPanier = useCallback(async (panierID: string) => {
        setLoadingState('loading');
        setError(null);
        
        const { data, error: fetchError } = await getPanier(panierID);
        if (fetchError) {
            setError(fetchError);
            setLoadingState('error');
        } else if (data) {
            setPanier(data);
            setLoadingState('success');
        } else {
            setLoadingState('not-found');
        }
    }, [setLoadingState, setError, setPanier]);

    useEffect(() => {
        if (!id) {
            setLoadingState('not-found');
            return;
        }

        const validatedId = validateId(id);
        if (!validatedId) {
            setLoadingState('not-found');
            return;
        }

        loadPanier(validatedId);
    }, [id, loadPanier]);

    const retry = useCallback(() => {
        if (id) {
            const validatedId = validateId(id);
            if (validatedId) {
                loadPanier(validatedId);
            }
        }
    }, [id, loadPanier]);

    return { loadingState, panier, error, retry };
}

function DevisPageContent() {

    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    
    const { loadingState, panier, error, retry } = usePanierData(id);

    const handleGoBack = useCallback(() => {
        router.push('/dashboard/devis');
    }, [router]);

    if (loadingState === 'loading') {
        return <LoadingSpinner />;
    }

    if (loadingState === 'error' && error) {
        return (
            <ErrorDisplay 
                error={error} 
                onRetry={retry}
                onGoBack={handleGoBack}
            />
        );
    }

    if (loadingState === 'not-found' || !panier) {
        return (
            <ErrorDisplay 
                error="not-found" 
                onGoBack={handleGoBack}
            />
        );
    }

    return <PanierClientPage initialPanier={panier} />;
}

export default function DevisPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <DevisPageContent />
        </Suspense>
    );
}