/**
 * AI Agent Panel Component
 * 
 * A UI panel to interact with MindVex AI agents powered by IBM watsonx Orchestrate.
 * Integrated into the Dashboard with workspace context.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { watsonxApi } from '~/lib/services/watsonxApiService';
import type { WatsonxChatResponse, FileContext } from '~/types/watsonx';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    agentName?: string;
    timestamp: Date;
    toolCalls?: Array<{
        toolName: string;
        result?: string;
    }>;
}

interface AIAgentPanelProps {
    /** Optional file context to include with messages */
    fileContext?: FileContext[];
    /** Optional callback when agent response is received */
    onResponse?: (response: WatsonxChatResponse) => void;
    /** Optional custom title */
    title?: string;
    /** Whether panel is collapsed */
    collapsed?: boolean;
    /** Callback to toggle collapsed state */
    onToggle?: () => void;
}

const AGENTS = [
    { id: 'codebase-analysis', name: 'Codebase Analyzer', icon: '🔍', description: 'Analyze code for bugs and improvements' },
    { id: 'code-qa', name: 'Code Q&A', icon: '❓', description: 'Ask questions about your code' },
    { id: 'code-modifier', name: 'Code Modifier', icon: '✏️', description: 'Modify code based on instructions' },
    { id: 'code-review', name: 'Code Reviewer', icon: '📝', description: 'Review code for issues' },
    { id: 'documentation', name: 'Doc Generator', icon: '📚', description: 'Generate documentation' },
    { id: 'dependency-graph', name: 'Dependency Mapper', icon: '🔗', description: 'Analyze dependencies' },
    { id: 'git-assistant', name: 'Git Assistant', icon: '🚀', description: 'Help with Git operations' },
];

export function AIAgentPanel({ fileContext, onResponse, title, collapsed = false, onToggle }: AIAgentPanelProps) {
    const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Call the appropriate AI endpoint based on selected agent
            let response: WatsonxChatResponse;

            switch (selectedAgent.id) {
                case 'codebase-analysis':
                    response = await watsonxApi.analyzeCodebase(userMessage.content, fileContext);
                    break;
                case 'code-qa':
                    response = await watsonxApi.askQuestion(userMessage.content, fileContext);
                    break;
                case 'code-modifier':
                    response = await watsonxApi.modifyCode(userMessage.content, fileContext);
                    break;
                case 'code-review':
                    response = await watsonxApi.reviewCode(userMessage.content, fileContext);
                    break;
                case 'documentation':
                    response = await watsonxApi.generateDocumentation(userMessage.content, fileContext);
                    break;
                case 'dependency-graph':
                    response = await watsonxApi.analyzeDependencies(userMessage.content, fileContext);
                    break;
                case 'git-assistant':
                    response = await watsonxApi.getGitHelp(userMessage.content);
                    break;
                default:
                    response = await watsonxApi.chat({
                        agentId: selectedAgent.id,
                        message: userMessage.content,
                        files: fileContext
                    });
            }

            if (response.success) {
                const assistantMessage: Message = {
                    id: response.id || crypto.randomUUID(),
                    role: 'assistant',
                    content: response.response,
                    agentName: selectedAgent.name,
                    timestamp: new Date(),
                    toolCalls: response.toolCalls?.map(tc => ({
                        toolName: tc.toolName,
                        result: tc.result,
                    })),
                };
                setMessages(prev => [...prev, assistantMessage]);
                onResponse?.(response);
            } else {
                setError(response.errorMessage || 'Unknown error occurred');
            }
        } catch (err) {
            console.error('AI Agent error:', err);
            setError(err instanceof Error ? err.message : 'Failed to get response from agent');
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedAgent, fileContext, onResponse]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    if (collapsed) {
        return (
            <div
                onClick={onToggle}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h3 className="font-semibold text-white">AI Agent Assistant</h3>
                            <p className="text-sm text-gray-400">Click to expand and chat with your code</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                {fileContext && fileContext.length > 0 && (
                    <div className="mt-2 text-xs text-blue-400">
                        📎 {fileContext.length} file(s) from current workspace available
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🤖</span>
                    <h3 className="text-lg font-semibold text-white">
                        {title || 'AI Agent Assistant'}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearChat}
                        className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                    >
                        Clear
                    </button>
                    {onToggle && (
                        <button
                            onClick={onToggle}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Agent Selector */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-700 bg-gray-900/30">
                {AGENTS.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${selectedAgent.id === agent.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        title={agent.description}
                    >
                        <span>{agent.icon}</span>
                        <span>{agent.name}</span>
                    </button>
                ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80 min-h-48">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        <p className="text-3xl mb-3">{selectedAgent.icon}</p>
                        <p className="font-medium text-white">{selectedAgent.name}</p>
                        <p className="text-sm mt-1 text-gray-400">{selectedAgent.description}</p>
                        <p className="text-xs mt-4 text-gray-500">Type a message to get started</p>
                        {fileContext && fileContext.length > 0 && (
                            <p className="text-xs mt-2 text-blue-400">
                                📎 {fileContext.length} file(s) from your workspace will be included
                            </p>
                        )}
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-gray-700/70 text-white'
                                }`}
                        >
                            {message.role === 'assistant' && message.agentName && (
                                <div className="text-xs text-blue-400 mb-1 font-medium">
                                    {message.agentName}
                                </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                            {/* Tool Calls */}
                            {message.toolCalls && message.toolCalls.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-600">
                                    <div className="text-xs text-gray-400 mb-1">Tools used:</div>
                                    {message.toolCalls.map((tc, idx) => (
                                        <div key={idx} className="text-xs bg-gray-800 rounded px-2 py-1 mt-1">
                                            🔧 {tc.toolName}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-gray-400 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700/70 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-2 text-gray-300">
                                <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-blue-500 rounded-full" />
                                <span className="text-sm">{selectedAgent.name} is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                        <div className="text-red-400 text-sm">⚠️ {error}</div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/30">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Ask ${selectedAgent.name}...`}
                        className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                        {isLoading ? '...' : 'Send'}
                    </button>
                </div>

                {fileContext && fileContext.length > 0 && (
                    <div className="mt-2 text-xs text-blue-400">
                        📎 {fileContext.length} file(s) from your workspace attached as context
                    </div>
                )}
            </div>
        </div>
    );
}

export default AIAgentPanel;
