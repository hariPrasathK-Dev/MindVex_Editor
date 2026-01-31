/**
 * API Service for IBM watsonx Orchestrate integration.
 * Communicates with the backend which proxies to watsonx.
 */

import type {
    WatsonxAgent,
    WatsonxChatRequest,
    WatsonxChatResponse,
    WatsonxHealthStatus,
    FileContext,
} from '~/types/watsonx';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api';

class WatsonxApiService {
    /**
     * Get authorization headers with JWT token.
     */
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    /**
     * Handle API response and extract JSON or throw error.
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
            } catch {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        return response.json();
    }

    /**
     * Get list of available AI agents.
     */
    async getAgents(): Promise<WatsonxAgent[]> {
        const response = await fetch(`${API_BASE_URL}/watsonx/agents`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<WatsonxAgent[]>(response);
    }

    /**
     * Check watsonx health and configuration status.
     */
    async checkHealth(): Promise<WatsonxHealthStatus> {
        const response = await fetch(`${API_BASE_URL}/watsonx/health`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<WatsonxHealthStatus>(response);
    }

    /**
     * Send a chat message to a specific agent.
     */
    async chat(request: WatsonxChatRequest): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/chat`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(request),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Analyze codebase with AI.
     */
    async analyzeCodebase(message: string, files?: FileContext[]): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/analyze`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'codebase-analysis', message, files }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Review code changes with AI.
     */
    async reviewCode(message: string, files?: FileContext[]): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/review`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'code-review', message, files }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Generate documentation with AI.
     */
    async generateDocumentation(message: string, files?: FileContext[]): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/document`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'documentation', message, files }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Ask questions about the codebase.
     */
    async askQuestion(question: string, files?: FileContext[]): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/ask`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'qa-agent', message: question, files }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Request code modifications.
     */
    async modifyCode(instruction: string, files?: FileContext[]): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/modify`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'code-modifier', message: instruction, files }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Analyze dependencies.
     */
    async analyzeDependencies(message: string, files?: FileContext[]): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/dependencies`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'dependency-graph', message, files }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }

    /**
     * Get Git assistance.
     */
    async getGitHelp(message: string): Promise<WatsonxChatResponse> {
        const response = await fetch(`${API_BASE_URL}/watsonx/git-help`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ agentId: 'pushing-agent', message }),
        });
        return this.handleResponse<WatsonxChatResponse>(response);
    }
}

// Export singleton instance
export const watsonxApi = new WatsonxApiService();
