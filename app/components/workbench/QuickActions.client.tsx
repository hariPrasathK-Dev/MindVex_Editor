import { useState, useEffect } from 'react';
import { KnowledgeGraphBuilder } from '~/lib/services/knowledge-graph';
import { webcontainer } from '~/lib/webcontainer';
import { quickActionsStore, workbenchStore } from '~/lib/stores/workbench';
import { useStore } from '@nanostores/react';

// Define the type for our path utilities
interface PathUtils {
  join: (...paths: string[]) => string;
  dirname: (path: string) => string;
  basename: (path: string, ext?: string) => string;
  extname: (path: string) => string;
  relative: (from: string, to: string) => string;
  isAbsolute: (path: string) => boolean;
  normalize: (path: string) => string;
}

// Simple path utilities for browser environment
const pathUtils: PathUtils = {
  join: (...paths: string[]): string => paths.join('/').replace(/\\/g, '/').replace(/\//g, '/').replace(/\/+/g, '/'),
  dirname: (path: string): string => {
    const normalizedPath = path.replace(/\\/g, '/').replace(/\//g, '/');
    const lastSlash = normalizedPath.lastIndexOf('/');

    return lastSlash === -1 ? '.' : normalizedPath.substring(0, lastSlash);
  },
  basename: (path: string, ext?: string): string => {
    // Extract the file name by splitting on both forward and backward slashes
    const parts = path.replace(/\\/g, '/').replace(/\//g, '/').split('/');
    let fileName = parts[parts.length - 1];

    // Remove extension if provided
    if (ext && fileName.endsWith(ext)) {
      fileName = fileName.slice(0, -ext.length);
    }

    return fileName;
  },
  extname: (path: string): string => {
    // Extract the file name by splitting on both forward and backward slashes
    const parts = path.replace(/\\/g, '/').replace(/\//g, '/').split('/');
    const fileName = parts[parts.length - 1];

    // Find the last occurrence of '.' in the filename
    const lastDotIndex = fileName.lastIndexOf('.');

    // Return empty string if no extension or if it starts with a dot (hidden file)
    if (lastDotIndex <= 0) {
      return '';
    }

    // Return the extension including the dot
    return fileName.substring(lastDotIndex);
  },
  relative: (from: string, to: string): string => {
    // Simplified relative path implementation
    if (to.startsWith(from)) {
      return to.substring(from.length).replace(/^\//, '');
    }

    return to;
  },
  isAbsolute: (path: string): boolean => path.startsWith('/'),
  normalize: (path: string): string => path.replace(/\\/g, '/').replace(/\//g, '/').replace(/\/+/g, '/'),
};

interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export function QuickActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localShowKnowledgeGraph, setLocalShowKnowledgeGraph] = useState(false);
  const [graph, setGraph] = useState<any>(null);

  // Use the store to control the knowledge graph view
  const storeShowKnowledgeGraph = useStore(quickActionsStore.showKnowledgeGraphView);

  // Sync local state with store state
  useEffect(() => {
    setLocalShowKnowledgeGraph(storeShowKnowledgeGraph);
  }, [storeShowKnowledgeGraph]);

  const quickActions: QuickActionItem[] = [
    {
      id: 'knowledge-graph',
      title: 'Knowledge Graph Construction',
      description: 'Build knowledge graphs from your codebase using AST parsing',
      icon: '🧠',
      color: 'blue',
      enabled: true,
    },
    {
      id: 'ast-parsing',
      title: 'Multi-Language AST Parsing',
      description: 'Parse multiple programming languages using Abstract Syntax Trees',
      icon: '🔍',
      color: 'indigo',
      enabled: false,
    },
    {
      id: 'arch-graph',
      title: 'Architecture / Dependency Graph Visualization',
      description: 'Visualize your code architecture and dependencies',
      icon: '📊',
      color: 'red',
      enabled: true,
    },
    {
      id: 'realtime-graph',
      title: 'Real-Time Graph Update (Incremental)',
      description: 'Update knowledge graphs in real-time as code changes',
      icon: '🔄',
      color: 'cyan',
      enabled: true,
    },
    {
      id: 'impact-analysis',
      title: 'Change Impact Analysis (Using Knowledge Graph)',
      description: 'Analyze the impact of code changes using knowledge graphs',
      icon: '🔬',
      color: 'pink',
      enabled: false,
    },
    {
      id: 'cycle-detection',
      title: 'Cycle Detection (Architectural Anomaly)',
      description: 'Detect architectural anomalies and dependency cycles',
      icon: '❌',
      color: 'teal',
      enabled: false,
    },
  ];

  const handleActionClick = async (actionId: string) => {
    if (actionId === 'knowledge-graph') {
      // Show the knowledge graph construction view
      quickActionsStore.showKnowledgeGraphView.set(true);
    } else if (actionId === 'arch-graph') {
      // Show the architecture graph visualization
      workbenchStore.currentView.set('arch-graph');
    } else if (actionId === 'realtime-graph') {
      // Show the real-time graph update
      alert(
        'Real-Time Graph Update: This feature tracks file changes and updates the graph incrementally in real-time.',
      );
    } else {
      alert(`${actionId} is coming soon!`);
    }
  };

  const buildGraph = async () => {
    setLoading('knowledge-graph');
    setError(null);
    setGraph(null);

    try {
      // Get all files from the current workspace
      const container = await webcontainer;

      async function getAllFiles(dirPath: string): Promise<{ path: string; content: string }[]> {
        const files: { path: string; content: string }[] = [];

        try {
          const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = pathUtils.join(dirPath, entry.name);

            if (
              entry.isDirectory() &&
              (entry.name === 'node_modules' ||
                entry.name === '.git' ||
                entry.name === '.next' ||
                entry.name === '.vercel' ||
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name === 'coverage' ||
                entry.name.startsWith('.'))
            ) {
              continue; // Skip these directories
            }

            if (entry.isFile()) {
              // Only include certain file types
              const allowedExtensions = ['.py', '.java'];

              if (allowedExtensions.some((ext) => fullPath.toLowerCase().endsWith(ext))) {
                try {
                  const content = await container.fs.readFile(fullPath, 'utf-8');
                  files.push({ path: fullPath, content: content.toString() });
                } catch (err) {
                  console.warn(`Could not read file ${fullPath}:`, err);
                }
              }
            } else if (entry.isDirectory()) {
              const subFiles = await getAllFiles(fullPath);
              files.push(...subFiles);
            }
          }
        } catch (error) {
          console.warn(`Could not read directory ${dirPath}:`, error);
        }

        return files;
      }

      const allFiles = await getAllFiles('/');

      // Filter for Java and Python files
      const codeFiles = allFiles.filter((file) => {
        const ext = pathUtils.extname(file.path).toLowerCase();
        return ext === '.py' || ext === '.java';
      });

      if (codeFiles.length === 0) {
        setError('No Java or Python files found in the workspace');
        setLoading(null);

        return;
      }

      // Build the knowledge graph
      const builder = new KnowledgeGraphBuilder();
      const knowledgeGraph = builder.build(codeFiles);

      setGraph(knowledgeGraph);
    } catch (err) {
      console.error('Error building knowledge graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to build knowledge graph');
    } finally {
      setLoading(null);
    }
  };

  const handleBackToQuickActions = () => {
    quickActionsStore.showKnowledgeGraphView.set(false);
    setGraph(null);
    setError(null);
  };

  const handleBackToDashboard = () => {
    // Navigate back to dashboard view
    workbenchStore.currentView.set('dashboard');
    quickActionsStore.showKnowledgeGraphView.set(false);
    setGraph(null);
    setError(null);
  };

  if (localShowKnowledgeGraph) {
    // Knowledge Graph Construction View
    return (
      <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mt-4">
                Knowledge Graph Construction
              </h1>
              <p className="text-gray-400 mt-2">AST-based analysis of your codebase relationships</p>
            </div>
            <button
              onClick={buildGraph}
              disabled={!!loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Building...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Rebuild Graph
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <strong>Error</strong>
              </div>
              <p>{error}</p>
            </div>
          )}

          {graph ? (
            <div className="space-y-8">
              {/* Graph Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Nodes</p>
                      <p className="text-3xl font-bold text-white mt-1">{graph.nodes.length}</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Edges</p>
                      <p className="text-3xl font-bold text-white mt-1">{graph.edges.length}</p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Modules</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {graph.nodes.filter((n: any) => n.type === 'module').length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Classes & Functions</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {graph.nodes.filter((n: any) => n.type === 'class' || n.type === 'function').length}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-yellow-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graph Visualization Preview */}
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-6">Graph Structure</h2>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <h3 className="text-lg font-medium text-white mb-4">Nodes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {graph.nodes.map((node: any, index: number) => (
                        <div
                          key={node.id}
                          className={`p-4 rounded-lg border ${
                            node.type === 'module'
                              ? 'border-blue-500/30 bg-blue-900/20'
                              : node.type === 'class'
                                ? 'border-purple-500/30 bg-purple-900/20'
                                : node.type === 'function'
                                  ? 'border-green-500/30 bg-green-900/20'
                                  : 'border-gray-500/30 bg-gray-700/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${
                                node.type === 'module'
                                  ? 'bg-blue-500'
                                  : node.type === 'class'
                                    ? 'bg-purple-500'
                                    : node.type === 'function'
                                      ? 'bg-green-500'
                                      : 'bg-gray-500'
                              }`}
                            ></span>
                            <span className="font-mono text-sm text-gray-300">{node.type}</span>
                          </div>
                          <div className="font-medium text-white truncate">{node.name}</div>
                          <div className="text-xs text-gray-400 truncate mt-1">{node.filePath}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Relationships</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(graph, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

                        const exportFileDefaultName = 'knowledge-graph.json';

                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-sm font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-300"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => alert('Excel export coming soon!')}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => alert('PDF export coming soon!')}
                      className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-sm font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-300"
                    >
                      PDF
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Target
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {graph.edges.map((edge: any, index: number) => {
                        const sourceNode = graph.nodes.find((n: any) => n.id === edge.source);
                        const targetNode = graph.nodes.find((n: any) => n.id === edge.target);

                        return (
                          <tr key={edge.id}>
                            <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                              {sourceNode ? sourceNode.name : edge.source}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  edge.type === 'import'
                                    ? 'bg-blue-100 text-blue-800'
                                    : edge.type === 'call'
                                      ? 'bg-purple-100 text-purple-800'
                                      : edge.type === 'inheritance'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {edge.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                              {targetNode ? targetNode.name : edge.target}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 p-5 bg-gray-800/50 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Building Knowledge Graph</h3>
              <p className="text-gray-400 max-w-md">
                Analyzing your codebase to construct a knowledge graph of modules, classes, functions, and their
                relationships.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quick Actions List View
  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Knowledge Graph & Analysis Tools
          </h1>
          <p className="text-gray-400 mt-2">Select an action to analyze your codebase</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <strong>Error</strong>
            </div>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                action.enabled
                  ? `bg-gray-800/50 backdrop-blur-lg border-gray-700 hover:border-${action.color}-500 hover:scale-[1.02]`
                  : 'bg-gray-800/30 backdrop-blur-lg border-gray-700 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => action.enabled && !loading && handleActionClick(action.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`text-2xl ${action.enabled ? '' : 'grayscale'}`}>{action.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-2 ${action.enabled ? 'text-white' : 'text-gray-400'}`}>
                    {action.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{action.description}</p>
                  <div className="flex justify-end">
                    {loading === action.id ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-lg">
                        <svg
                          className="animate-spin h-4 w-4 text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-sm text-blue-400">Processing...</span>
                      </div>
                    ) : action.enabled ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium bg-${action.color}-500/20 text-${action.color}-400`}
                      >
                        Available
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-600/20 text-gray-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800/30 backdrop-blur-lg rounded-xl border border-gray-700">
          <h3 className="font-semibold text-white mb-2">💡 Tip</h3>
          <p className="text-gray-400 text-sm">
            Click on any action to execute it. The Knowledge Graph Construction is currently available and will analyze
            your Java and Python files.
          </p>
        </div>
      </div>
    </div>
  );
}
