declare module '@/hooks/useAI' {
    export interface AIResponse {
        success: boolean;
        data?: unknown;
        message?: string;
        error?: string;
    }

    export interface AIRequest {
        message: string;
        projectId?: string;
        sheetId?: string;
        assistantType?: string;
    }

    export const useAI: () => {
        loading: boolean;
        error: string | null;
        chatWithAI: (request: AIRequest) => Promise<AIResponse>;
        analyzeProject: (projectId: string) => Promise<AIResponse>;
        estimateCosts: (projectId: string) => Promise<AIResponse>;
        getSafetyRecommendations: (projectId: string) => Promise<AIResponse>;
        getProjectInsights: (projectId: string) => Promise<AIResponse>;
        getAvailableAssistants: () => Promise<AIResponse>;
    };
}
