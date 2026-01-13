import { useState, useEffect } from 'react';
import { KnowledgeGraphBuilder } from '~/lib/services/knowledge-graph';
import type { ChangeImpactResult } from '~/lib/services/knowledge-graph';
import { webcontainer } from '~/lib/webcontainer';
import { workbenchStore } from '~/lib/stores/workbench';

// Define types
interface GraphNode {
  id: string;
  name: string;
  type: 'module' | 'class' | 'function' | 'variable';
  filePath: string;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: any[];
}

// Simple path utilities for browser environment
interface PathUtils {
  extname: (path: string) => string;
  basename: (path: string, ext?: string) => string;
}

const pathUtils: PathUtils = {
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
};

export function ChangeImpactAnalysis() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [impactResults, setImpactResults] = useState<ChangeImpactResult[]>([]);
  const [availableNodes, setAvailableNodes] = useState<GraphNode[]>([]);

  // Build the initial graph
  const buildGraph = async () => {
    setLoading(true);
    setError(null);
    setImpactResults([]);

    try {
      // Get all files from the current workspace
      const container = await webcontainer;

      async function getAllFiles(dirPath: string): Promise<{ path: string; content: string }[]> {
        const files: { path: string; content: string }[] = [];

        try {
          const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = dirPath + '/' + entry.name;

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
              // Include all supported file types
              const allowedExtensions = [
                '.py',
                '.java',
                '.js',
                '.jsx',
                '.ts',
                '.tsx',
                '.c',
                '.cpp',
                '.cs',
                '.rb',
                '.php',
                '.go',
                '.rs',
                '.kt',
                '.swift',
                '.scala',
                '.dart',
                '.html',
                '.css',
                '.scss',
                '.sql',
                '.json',
                '.yaml',
                '.yml',
                '.xml',
                '.md',
              ];

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

      // Filter for supported code files
      const codeFiles = allFiles.filter((file) => {
        const ext = pathUtils.extname(file.path).toLowerCase();
        const allowedExtensions = [
          '.py',
          '.java',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.c',
          '.cpp',
          '.cs',
          '.rb',
          '.php',
          '.go',
          '.rs',
          '.kt',
          '.swift',
          '.scala',
          '.dart',
          '.html',
          '.css',
          '.scss',
          '.sql',
          '.json',
          '.yaml',
          '.yml',
          '.xml',
          '.md',
        ];

        return allowedExtensions.includes(ext);
      });

      if (codeFiles.length === 0) {
        setError('No supported code files found in the workspace');
        setLoading(false);

        return;
      }

      // Build the knowledge graph
      const builder = new KnowledgeGraphBuilder();
      const knowledgeGraph = builder.build(codeFiles);

      setGraph(knowledgeGraph as KnowledgeGraph);
      setAvailableNodes(knowledgeGraph.nodes as GraphNode[]);
    } catch (err) {
      console.error('Error building knowledge graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to build knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  // Analyze impact of changes to selected node
  const analyzeImpact = async () => {
    if (!graph || !selectedNode) {
      setError('Please select a node to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const builder = new KnowledgeGraphBuilder();
      const results = builder.analyzeChangeImpact(graph, selectedNode);
      setImpactResults(results);
    } catch (err) {
      console.error('Error analyzing change impact:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze change impact');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    buildGraph();
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Change Impact Analysis
            </h1>
            <p className="text-gray-400 mt-2">Analyze the impact of changes to specific nodes in your codebase</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Navigate back to dashboard
                workbenchStore.showWorkbench.set(true);
                workbenchStore.currentView.set('dashboard');
              }}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center gap-2"
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
            <button
              onClick={buildGraph}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Rebuild Graph'}
            </button>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Select Node for Impact Analysis</h3>

            <div className="mb-4">
              <label htmlFor="node-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select a node to analyze its change impact:
              </label>
              <select
                id="node-select"
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a node --</option>
                {availableNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.type}) - {pathUtils.basename(node.filePath)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={analyzeImpact}
              disabled={!selectedNode || loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Change Impact
            </button>
          </div>

          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Analysis Results</h3>

            {impactResults.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-400 mb-2">Direct Impact</h4>
                    <ul className="space-y-2">
                      {impactResults
                        .filter((result) => result.impact_level === 'direct')
                        .flatMap((result) => result.impacted_nodes)
                        .map((node, index) => (
                          <li key={index} className="text-sm text-gray-300 flex items-start">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
                            <span>
                              <span className="font-medium">{node.name}</span> ({node.type}) in{' '}
                              {pathUtils.basename(node.filePath)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-400 mb-2">Indirect Impact</h4>
                    <ul className="space-y-2">
                      {impactResults
                        .filter((result) => result.impact_level === 'indirect')
                        .flatMap((result) => result.impacted_nodes)
                        .map((node, index) => (
                          <li key={index} className="text-sm text-gray-300 flex items-start">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-1.5 mr-2"></span>
                            <span>
                              <span className="font-medium">{node.name}</span> ({node.type}) in{' '}
                              {pathUtils.basename(node.filePath)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Direct Impacts:</span>
                      <span className="ml-2 font-medium text-blue-400">
                        {impactResults
                          .filter((r) => r.impact_level === 'direct')
                          .reduce((sum, r) => sum + r.impacted_nodes.length, 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Indirect Impacts:</span>
                      <span className="ml-2 font-medium text-orange-400">
                        {impactResults
                          .filter((r) => r.impact_level === 'indirect')
                          .reduce((sum, r) => sum + r.impacted_nodes.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400">
                {selectedNode ? 'Click "Analyze Change Impact" to see results' : 'Select a node to begin analysis'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">About Change Impact Analysis</h3>
          <div className="prose prose-invert max-w-none text-gray-300">
            <p>
              Change Impact Analysis identifies the potential effects of modifying a specific node in your codebase. It
              analyzes both direct dependencies (nodes that directly depend on the changed node) and indirect impacts
              (nodes that depend on the directly impacted nodes).
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <span className="text-blue-400">Direct Impact:</span> Nodes that directly depend on the changed node
              </li>
              <li>
                <span className="text-orange-400">Indirect Impact:</span> Nodes that depend on directly impacted nodes
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
