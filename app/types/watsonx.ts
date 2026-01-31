/**
 * TypeScript types for IBM watsonx Orchestrate integration.
 */

export interface WatsonxAgent {
    id: string;
    name: string;
}

export interface FileContext {
    path: string;
    content: string;
    language?: string;
}

export interface WatsonxChatRequest {
    agentId: string;
    message: string;
    files?: FileContext[];
    metadata?: Record<string, unknown>;
}

export interface ToolCall {
    toolName: string;
    parameters: Record<string, unknown>;
    result?: string;
}

export interface WatsonxChatResponse {
    id: string;
    agentId: string;
    response: string;
    toolCalls?: ToolCall[];
    metadata?: Record<string, unknown>;
    timestamp: string;
    success: boolean;
    errorMessage?: string;
}

export interface WatsonxHealthStatus {
    configured: boolean;
    spaceId?: string;
    endpoint?: string;
    authenticated: boolean;
    error?: string;
}

/**
 * Agent IDs for the 7 MindVex AI agents.
 */
export const AGENT_IDS = {
    CODEBASE_ANALYSIS: 'codebase-analysis',
    DEPENDENCY_GRAPH: 'dependency-graph',
    QA_AGENT: 'qa-agent',
    CODE_MODIFIER: 'code-modifier',
    CODE_REVIEW: 'code-review',
    DOCUMENTATION: 'documentation',
    PUSHING_AGENT: 'pushing-agent',
} as const;

export type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS];
