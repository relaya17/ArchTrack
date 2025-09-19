/**
 * AI Hook
 * Construction Master App - Client-side AI Integration
 */

import { useState, useCallback } from 'react';
// import { useAuth } from './useAuth';

interface AIResponse {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

interface AIRequest {
    message: string;
    projectId?: string;
    sheetId?: string;
    assistantType?: string;
}

export const useAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const { token } = useAuth();
    const token = null; // TODO: Implement auth

    const chatWithAI = useCallback(async (request: AIRequest): Promise<AIResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'AI request failed');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [token]);

    const analyzeProject = useCallback(async (projectId: string): Promise<AIResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/analyze-project/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Project analysis failed');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [token]);

    const estimateCosts = useCallback(async (projectId: string): Promise<AIResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/estimate-costs/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Cost estimation failed');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [token]);

    const getSafetyRecommendations = useCallback(async (projectId: string): Promise<AIResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/safety-recommendations/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Safety analysis failed');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [token]);

    const getProjectInsights = useCallback(async (projectId: string): Promise<AIResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/insights/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Insights generation failed');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [token]);

    const getAvailableAssistants = useCallback(async (): Promise<AIResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/assistants', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get assistants');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [token]);

    return {
        loading,
        error,
        chatWithAI,
        analyzeProject,
        estimateCosts,
        getSafetyRecommendations,
        getProjectInsights,
        getAvailableAssistants,
    };
};

