import { useState, useEffect } from 'react';
import { KnowledgeGraphBuilder, type CycleDetectionResult } from '~/lib/services/knowledge-graph';
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

export function CycleDetection() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResults, setDetectionResults] = useState<CycleDetectionResult | null>(null);

  // Build the initial graph and detect cycles
  const analyzeCycles = async () => {
    setLoading(true);
    setError(null);
    setDetectionResults(null);

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

        return allowedExtensions.some((allowedExt) => ext === allowedExt);
      });

      console.log('Found code files:', codeFiles.length, 'out of', allFiles.length, 'total files');
      console.log(
        'Code file extensions:',
        codeFiles.map((f) => pathUtils.extname(f.path)).filter((ext) => ext),
      );

      if (codeFiles.length === 0) {
        setError('No supported code files found in the workspace');
        setLoading(false);

        return;
      }

      // Build the knowledge graph
      const builder = new KnowledgeGraphBuilder();
      const knowledgeGraph = builder.build(codeFiles);

      setGraph(knowledgeGraph as KnowledgeGraph);

      // Detect cycles in the graph
      const cycleResults = builder.detectCycles(knowledgeGraph as KnowledgeGraph);
      setDetectionResults(cycleResults);
    } catch (err) {
      console.error('Error detecting cycles:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect cycles');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    analyzeCycles();
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Cycle Detection
            </h1>
            <p className="text-gray-400 mt-2">Detect cyclic dependencies in your codebase architecture</p>
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
              onClick={analyzeCycles}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Re-analyze Cycles'}
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
            <h3 className="text-xl font-semibold text-white mb-4">Cycle Detection Status</h3>

            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Overall Status</h4>
                {detectionResults ? (
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${detectionResults.hasCycles ? 'bg-red-500' : 'bg-green-500'}`}
                    ></div>
                    <span className={detectionResults.hasCycles ? 'text-red-400' : 'text-green-400'}>
                      {detectionResults.hasCycles ? 'Cycles Detected!' : 'No Cycles Found'}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400">Analyzing...</div>
                )}
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Cycles Found:</span>
                    <span className="font-medium">{detectionResults ? detectionResults.cycles.length : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Nodes:</span>
                    <span className="font-medium">{graph ? graph.nodes.length : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Dependencies:</span>
                    <span className="font-medium">{graph ? graph.edges.length : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Cycles Found</h3>

            {detectionResults ? (
              detectionResults.hasCycles ? (
                <div className="space-y-4">
                  {detectionResults.cycles.map((cycle, index) => (
                    <div key={index} className="bg-gray-700/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <h4 className="font-medium text-red-400">Cycle #{index + 1}</h4>
                      </div>
                      <div className="text-sm text-gray-300">
                        <div className="font-medium mb-1">Path:</div>
                        <div className="flex flex-wrap gap-1">
                          {cycle.map((nodeId, nodeIndex) => {
                            // Find the node in the graph to get its display name
                            const node = graph?.nodes.find((n) => n.id === nodeId);
                            const displayName = node ? `${node.name} (${node.type})` : nodeId;

                            return (
                              <div key={nodeIndex} className="flex items-center">
                                {node ? (
                                  <button
                                    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded cursor-pointer transition-colors"
                                    onClick={() => {
                                      // Open the file in the editor
                                      workbenchStore.setSelectedFile(node.filePath);
                                      workbenchStore.currentView.set('code');

                                      // Also ensure the workbench is visible
                                      workbenchStore.showWorkbench.set(true);
                                    }}
                                    title={`Click to open ${node.filePath} in editor`}
                                  >
                                    <div className="text-xs text-blue-200">{pathUtils.basename(node.filePath)}</div>
                                    <div>{displayName}</div>
                                  </button>
                                ) : (
                                  <span className="bg-gray-600 px-2 py-1 rounded">
                                    <div className="text-xs text-gray-300">
                                      {nodeId.includes('#') ? pathUtils.basename(nodeId.split('#')[0]) : 'unknown'}
                                    </div>
                                    <div>{displayName}</div>
                                  </span>
                                )}
                                {nodeIndex < cycle.length - 1 && <span className="mx-1 text-gray-500">→</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                        <div>
                          Files involved:{' '}
                          {[
                            ...new Set(
                              cycle.map((nodeId) => {
                                const node = graph?.nodes.find((n) => n.id === nodeId);
                                return node
                                  ? pathUtils.basename(node.filePath)
                                  : nodeId.includes('#')
                                    ? pathUtils.basename(nodeId.split('#')[0])
                                    : 'unknown';
                              }),
                            ),
                          ].join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-green-400">
                  No cyclic dependencies found in the codebase!
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400">
                {loading ? 'Running cycle detection analysis...' : 'Click "Re-analyze Cycles" to start detection'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">About Cycle Detection</h3>
          <div className="prose prose-invert max-w-none text-gray-300">
            <p>
              Cycle Detection identifies circular dependencies in your codebase architecture. Cyclic dependencies can
              lead to tight coupling, making the code harder to understand, test, and maintain. This analysis helps
              identify these problematic patterns.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Circular dependencies can cause runtime issues in some languages</li>
              <li>They make it difficult to reason about code flow</li>
              <li>Breaking cycles often improves modularity and testability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
