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

// Define the data structures for the knowledge graph
interface Node {
  id: string;
  name: string;
  type: 'module' | 'class' | 'function' | 'variable';
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  properties?: Record<string, any>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'call' | 'inheritance' | 'dependency' | 'usage';
  properties?: Record<string, any>;
}

interface KnowledgeGraph {
  nodes: Node[];
  edges: Edge[];
}

// Parser interface for different languages
interface ASTParser {
  parse(code: string, filePath: string): { nodes: Node[]; edges: Edge[] };
}

// Simple AST parser for Python
class PythonASTParser implements ASTParser {
  parse(code: string, filePath: string): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const lines = code.split('\n');

    // Track current class/function context for proper nesting
    let currentClass: string | null = null;
    let currentFunction: string | null = null;

    // Regular expressions for parsing Python
    const classPattern = /^(\s*)class\s+(\w+)/;
    const functionPattern = /^(\s*)def\s+(\w+)/;
    const importPattern = /^(from\s+.+\s+)?import\s+(.+)$/g;
    const callPattern = /(\w+)\s*\(/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Parse classes
      const classMatch = line.match(classPattern);

      if (classMatch) {
        const indentLevel = lines[i].match(/^(\s*)/)?.[0]?.length || 0;
        const className = classMatch[2];

        // If this is nested in a function, reset current function
        if (indentLevel <= (currentFunction ? 4 : 0)) {
          currentFunction = null;
        }

        currentClass = className;

        const nodeId = `${filePath}#${className}`;

        nodes.push({
          id: nodeId,
          name: className,
          type: 'class',
          filePath,
          lineStart: lineNumber,
        });
      }

      // Parse functions
      const functionMatch = line.match(functionPattern);

      if (functionMatch) {
        const indentLevel = lines[i].match(/^(\s*)/)?.[0]?.length || 0;
        const functionName = functionMatch[2];

        // If this is nested in a class, set current function
        if (indentLevel >= (currentClass ? 4 : 0)) {
          currentFunction = functionName;
        } else {
          currentFunction = functionName;
        }

        const nodeId = `${filePath}#${functionName}`;

        nodes.push({
          id: nodeId,
          name: functionName,
          type: 'function',
          filePath,
          lineStart: lineNumber,
        });
      }

      // Parse imports
      const importMatches = [...line.matchAll(importPattern)];

      for (const importMatch of importMatches) {
        const importedModule = importMatch[2].trim();

        // Sanitize the imported module name to create a valid node ID
        const sanitizedModuleName = importedModule.replace(/[^a-zA-Z0-9_]/g, '_');
        const nodeId = `${filePath}#import_${sanitizedModuleName}`;

        // Add module node if it doesn't exist
        const moduleNodeId = `${filePath}#module`;
        const existingModuleNode = nodes.find((n) => n.id === moduleNodeId);

        if (!existingModuleNode) {
          nodes.push({
            id: moduleNodeId,
            name: pathUtils.basename(filePath),
            type: 'module',
            filePath,
          });
        }

        // Add the import module as a node if it doesn't exist
        const importNode = nodes.find((n) => n.id === nodeId);

        if (!importNode) {
          nodes.push({
            id: nodeId,
            name: importedModule,
            type: 'module',
            filePath,
          });
        }

        // Add import edge
        edges.push({
          id: `${nodeId}_to_module`,
          source: nodeId,
          target: moduleNodeId,
          type: 'import',
        });
      }

      // Parse function calls
      const callMatches = [...line.matchAll(callPattern)];

      for (const callMatch of callMatches) {
        const functionName = callMatch[1];

        // Skip built-in functions
        if (
          !['print', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'range', 'input', 'open'].includes(
            functionName,
          )
        ) {
          // Create a call edge to the function if it exists in our nodes
          const targetNode = nodes.find(
            (node) => node.name === functionName && node.type === 'function' && node.filePath === filePath,
          );

          if (targetNode) {
            const callerNode = currentFunction
              ? nodes.find((n) => n.name === currentFunction && n.filePath === filePath)
              : nodes.find((n) => n.type === 'module' && n.filePath === filePath);

            if (callerNode) {
              edges.push({
                id: `${callerNode.id}_calls_${targetNode.id}`,
                source: callerNode.id,
                target: targetNode.id,
                type: 'call',
              });
            }
          }
        }
      }
    }

    return { nodes, edges };
  }
}

// Simple AST parser for Java
class JavaASTParser implements ASTParser {
  parse(code: string, filePath: string): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const lines = code.split('\n');

    // Track current class/function context
    let currentClass: string | null = null;
    let currentMethod: string | null = null;

    // Regular expressions for parsing Java
    const classPattern = /^(\s*)public\s+class\s+(\w+)|^(\s*)class\s+(\w+)/;
    const methodPattern = /^(\s*)(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\(/;
    const importPattern = /^import\s+(.+);$/;
    const callPattern = /(\w+)\s*\.\s*(\w+)\s*\(|(\w+)\s*\(/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Parse classes
      const classMatch = line.match(classPattern);

      if (classMatch) {
        const className = classMatch[2] || classMatch[4];
        currentClass = className;

        const nodeId = `${filePath}#${className}`;

        nodes.push({
          id: nodeId,
          name: className,
          type: 'class',
          filePath,
          lineStart: lineNumber,
        });
      }

      // Parse methods
      const methodMatch = line.match(methodPattern);

      if (methodMatch) {
        const methodName = methodMatch[4];
        currentMethod = methodName;

        const nodeId = `${filePath}#${methodName}`;

        nodes.push({
          id: nodeId,
          name: methodName,
          type: 'function',
          filePath,
          lineStart: lineNumber,
        });
      }

      // Parse imports
      const importMatch = line.match(importPattern);

      if (importMatch) {
        const importedModule = importMatch[1].replace(/\./g, '/');

        // Sanitize the imported module name to create a valid node ID
        const sanitizedModuleName = importedModule.replace(/[^a-zA-Z0-9_]/g, '_');
        const nodeId = `${filePath}#import_${sanitizedModuleName}`;

        // Add module node if it doesn't exist
        const moduleNodeId = `${filePath}#module`;
        const existingModuleNode = nodes.find((n) => n.id === moduleNodeId);

        if (!existingModuleNode) {
          nodes.push({
            id: moduleNodeId,
            name: pathUtils.basename(filePath),
            type: 'module',
            filePath,
          });
        }

        // Add the import module as a node if it doesn't exist
        const importNode = nodes.find((n) => n.id === nodeId);

        if (!importNode) {
          nodes.push({
            id: nodeId,
            name: importedModule,
            type: 'module',
            filePath,
          });
        }

        // Add import edge
        edges.push({
          id: `${nodeId}_to_module`,
          source: nodeId,
          target: moduleNodeId,
          type: 'import',
        });
      }

      // Parse method calls
      const callMatches = [...line.matchAll(callPattern)];

      for (const callMatch of callMatches) {
        const targetFunc = callMatch[2] || callMatch[3]; // Method name from either pattern

        // Skip Java built-ins and common method names
        if (
          ![
            'System.out.println',
            'println',
            'main',
            'toString',
            'equals',
            'hashCode',
            'getClass',
            'wait',
            'notify',
            'notifyAll',
            'finalize',
          ].includes(targetFunc)
        ) {
          // Look for the target function in nodes
          const targetNode = nodes.find(
            (node) => node.name === targetFunc && node.type === 'function' && node.filePath === filePath,
          );

          if (targetNode) {
            const callerNode = currentMethod
              ? nodes.find((n) => n.name === currentMethod && n.filePath === filePath)
              : nodes.find((n) => n.type === 'class' && n.filePath === filePath);

            if (callerNode) {
              edges.push({
                id: `${callerNode.id}_calls_${targetNode.id}`,
                source: callerNode.id,
                target: targetNode.id,
                type: 'call',
              });
            }
          }
        }
      }
    }

    return { nodes, edges };
  }
}

/**
 * Knowledge Graph Builder for codebases
 */
export class KnowledgeGraphBuilder {
  private parsers: Map<string, ASTParser> = new Map();
  private impactAnalyzer: ChangeImpactAnalyzer = new ChangeImpactAnalyzer();

  constructor() {
    // Register parsers for supported languages
    this.parsers.set('.py', new PythonASTParser());
    this.parsers.set('.java', new JavaASTParser());

    // Add a basic parser for other file types
    this.parsers.set('.js', new BasicASTParser());
    this.parsers.set('.jsx', new BasicASTParser());
    this.parsers.set('.ts', new BasicASTParser());
    this.parsers.set('.tsx', new BasicASTParser());
    this.parsers.set('.c', new BasicASTParser());
    this.parsers.set('.cpp', new BasicASTParser());
    this.parsers.set('.cs', new BasicASTParser());
    this.parsers.set('.rb', new BasicASTParser());
    this.parsers.set('.php', new BasicASTParser());
    this.parsers.set('.go', new BasicASTParser());
    this.parsers.set('.rs', new BasicASTParser());
    this.parsers.set('.kt', new BasicASTParser());
    this.parsers.set('.swift', new BasicASTParser());
    this.parsers.set('.scala', new BasicASTParser());
    this.parsers.set('.dart', new BasicASTParser());
    this.parsers.set('.html', new BasicASTParser());
    this.parsers.set('.css', new BasicASTParser());
    this.parsers.set('.scss', new BasicASTParser());
    this.parsers.set('.sql', new BasicASTParser());
    this.parsers.set('.json', new BasicASTParser());
    this.parsers.set('.yaml', new BasicASTParser());
    this.parsers.set('.yml', new BasicASTParser());
    this.parsers.set('.xml', new BasicASTParser());
    this.parsers.set('.md', new BasicASTParser());
  }

  /**
   * Build a knowledge graph from the provided files
   * @param files - Array of file objects with path and content
   * @returns KnowledgeGraph object with nodes and edges
   */
  build(files: Array<{ path: string; content: string }>): KnowledgeGraph {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const filePathMap = new Map<string, boolean>(); // To track which files we've processed

    // Process each file
    for (const file of files) {
      const ext = pathUtils.extname(file.path).toLowerCase();
      const parser = this.parsers.get(ext);

      if (parser) {
        try {
          const { nodes, edges } = parser.parse(file.content, file.path);

          // Add nodes and edges to the overall graph
          allNodes.push(...nodes);
          allEdges.push(...edges);

          // Track that we've processed this file
          filePathMap.set(file.path, true);
        } catch (error) {
          console.warn(`Failed to parse ${file.path}:`, error);
        }
      }
    }

    // Add module nodes for all processed files
    for (const filePath of filePathMap.keys()) {
      const moduleId = `${filePath}#module`;
      const existingModule = allNodes.find((n) => n.id === moduleId);

      if (!existingModule) {
        allNodes.push({
          id: moduleId,
          name: pathUtils.basename(filePath),
          type: 'module',
          filePath,
        });
      }
    }

    // Return the constructed knowledge graph
    return {
      nodes: allNodes,
      edges: allEdges,
    };
  }

  /**
   * Add a custom parser for a specific file extension
   */
  addParser(extension: string, parser: ASTParser) {
    this.parsers.set(extension, parser);
  }

  /**
   * Analyze the impact of changes to a specific node
   */
  analyzeChangeImpact(graph: KnowledgeGraph, nodeId: string): ChangeImpactResult[] {
    return this.impactAnalyzer.analyzeImpact(graph, nodeId);
  }

  /**
   * Detect cycles in the knowledge graph
   */
  detectCycles(graph: KnowledgeGraph): CycleDetectionResult {
    const detector = new CycleDetector();
    return detector.detectCycles(graph);
  }
}

// Basic AST parser for languages with simple structure
class BasicASTParser implements ASTParser {
  parse(code: string, filePath: string): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add a module node for the file
    const moduleId = `${filePath}#module`;
    nodes.push({
      id: moduleId,
      name: pathUtils.basename(filePath),
      type: 'module',
      filePath,
    });

    return { nodes, edges };
  }
}

// Add incremental update functionality

// Change Impact Analysis result interface
export interface ChangeImpactResult {
  impacted_nodes: Node[];
  impact_level: 'direct' | 'indirect';
}

// Change Impact Analysis service
class ChangeImpactAnalyzer {
  /**
   * Analyze the impact of changes to a specific node in the knowledge graph
   * @param graph - The knowledge graph
   * @param nodeId - The ID of the node that has changed
   * @returns List of impacted nodes and their impact level
   */
  analyzeImpact(graph: KnowledgeGraph, nodeId: string): ChangeImpactResult[] {
    const results: ChangeImpactResult[] = [];

    // Find the changed node
    const changedNode = graph.nodes.find((n) => n.id === nodeId);

    if (!changedNode) {
      return results; // Node not found
    }

    // Find direct impacts (nodes that depend on the changed node)
    const directImpactNodes = this.findDirectImpacts(graph, nodeId);

    // Find indirect impacts (nodes that depend on directly impacted nodes)
    const indirectImpactNodes = this.findIndirectImpacts(graph, [...directImpactNodes.map((n) => n.id)]);

    // Add direct impacts to results
    for (const node of directImpactNodes) {
      results.push({
        impacted_nodes: [node],
        impact_level: 'direct',
      });
    }

    // Add indirect impacts to results
    for (const node of indirectImpactNodes) {
      results.push({
        impacted_nodes: [node],
        impact_level: 'indirect',
      });
    }

    return results;
  }

  /**
   * Find nodes that directly depend on the changed node (outgoing edges)
   * Also find nodes that call or use the changed node (incoming edges)
   */
  private findDirectImpacts(graph: KnowledgeGraph, nodeId: string): Node[] {
    const impactedNodes: Node[] = [];
    const processedNodeIds = new Set<string>();

    // Look for edges where the changed node is the source (outgoing)
    for (const edge of graph.edges) {
      if (edge.source === nodeId && !processedNodeIds.has(edge.target)) {
        const targetNode = graph.nodes.find((n) => n.id === edge.target);

        if (targetNode) {
          impactedNodes.push(targetNode);
          processedNodeIds.add(targetNode.id);
        }
      }

      // Also check for edges where the changed node is the target (incoming)
      if (edge.target === nodeId && !processedNodeIds.has(edge.source)) {
        const sourceNode = graph.nodes.find((n) => n.id === edge.source);

        if (sourceNode) {
          impactedNodes.push(sourceNode);
          processedNodeIds.add(sourceNode.id);
        }
      }
    }

    return impactedNodes;
  }

  /**
   * Find nodes that are indirectly impacted by following dependencies from direct impacts
   */
  private findIndirectImpacts(graph: KnowledgeGraph, directImpactIds: string[]): Node[] {
    const impactedNodes: Node[] = [];
    const processedNodeIds = new Set<string>();
    const queue = [...directImpactIds];
    const visited = new Set<string>(directImpactIds);

    // Use BFS to find indirect impacts
    while (queue.length > 0) {
      const currentId = queue.shift();

      if (!currentId) {
        continue;
      }

      // Find all edges from the current node
      for (const edge of graph.edges) {
        if (edge.source === currentId && !visited.has(edge.target)) {
          const targetNode = graph.nodes.find((n) => n.id === edge.target);

          if (targetNode && !processedNodeIds.has(targetNode.id)) {
            impactedNodes.push(targetNode);
            processedNodeIds.add(targetNode.id);
            queue.push(edge.target);
            visited.add(edge.target);
          }
        }

        // Also find edges to the current node
        if (edge.target === currentId && !visited.has(edge.source)) {
          const sourceNode = graph.nodes.find((n) => n.id === edge.source);

          if (sourceNode && !processedNodeIds.has(sourceNode.id)) {
            impactedNodes.push(sourceNode);
            processedNodeIds.add(sourceNode.id);
            queue.push(edge.source);
            visited.add(edge.source);
          }
        }
      }
    }

    return impactedNodes;
  }
}

// Cycle detection result interface
export interface CycleDetectionResult {
  cycles: string[][]; // Array of cycles, each cycle is an array of node IDs
  hasCycles: boolean;
}

// Cycle detection service
class CycleDetector {
  /**
   * Detect cycles in the knowledge graph using DFS algorithm
   * @param graph - The knowledge graph
   * @returns List of cycles as node ID paths
   */
  detectCycles(graph: KnowledgeGraph): CycleDetectionResult {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const parent = new Map<string, string | null>();
    const cycles: string[][] = [];

    // Build adjacency list representation of the graph
    const adjList = new Map<string, string[]>();

    // Initialize adjacency list with all nodes
    for (const node of graph.nodes) {
      adjList.set(node.id, []);
    }

    // Add edges to adjacency list
    for (const edge of graph.edges) {
      const sources = adjList.get(edge.source) || [];
      sources.push(edge.target);
      adjList.set(edge.source, sources);
    }

    // Run DFS for each unvisited node
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        this.dfsUtil(node.id, adjList, visited, recStack, parent, cycles);
      }
    }

    return {
      cycles,
      hasCycles: cycles.length > 0,
    };
  }

  /**
   * Utility function for DFS traversal to detect cycles
   */
  private dfsUtil(
    currentNode: string,
    adjList: Map<string, string[]>,
    visited: Set<string>,
    recStack: Set<string>,
    parent: Map<string, string | null>,
    cycles: string[][],
  ): boolean {
    // Mark the current node as visited and add to recursion stack
    visited.add(currentNode);
    recStack.add(currentNode);

    // Get neighbors of the current node
    const neighbors = adjList.get(currentNode) || [];

    for (const neighbor of neighbors) {
      // If neighbor is not visited, recurse on it
      if (!visited.has(neighbor)) {
        parent.set(neighbor, currentNode);

        if (this.dfsUtil(neighbor, adjList, visited, recStack, parent, cycles)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        // If neighbor is in recursion stack, we found a cycle
        const cycle = this.extractCycle(currentNode, neighbor, parent);

        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }

    // Remove the vertex from recursion stack
    recStack.delete(currentNode);

    return false;
  }

  /**
   * Extract the cycle path from the parent map
   */
  private extractCycle(startNode: string, endNode: string, parent: Map<string, string | null>): string[] {
    const cycle: string[] = [endNode];
    let current = startNode;

    // Build the cycle path
    while (current !== endNode) {
      cycle.push(current);

      const parentOfCurrent = parent.get(current);

      if (parentOfCurrent === undefined || parentOfCurrent === null) {
        break; // Safety check to avoid infinite loop
      }

      current = parentOfCurrent;
    }

    // Reverse to get the correct order
    cycle.reverse();

    // Add the starting node again to close the cycle
    cycle.push(endNode);

    return cycle;
  }
}

export class IncrementalGraphUpdater {
  private graphCache: KnowledgeGraph = { nodes: [], edges: [] };

  /**
   * Update the knowledge graph incrementally with changed files
   * @param currentGraph - Current knowledge graph state
   * @param changedFiles - Files that have been modified
   * @param parsers - Map of file extension to AST parsers
   * @returns Updated knowledge graph
   */
  updateGraph(
    currentGraph: KnowledgeGraph,
    changedFiles: Array<{ path: string; content: string }>,
    parsers: Map<string, ASTParser>,
  ): KnowledgeGraph {
    // Store the current graph as our starting point
    this.graphCache = {
      nodes: [...currentGraph.nodes],
      edges: [...currentGraph.edges],
    };

    // Remove old nodes and edges for changed files
    this.removeNodesForFiles(changedFiles.map((f) => f.path));

    // Add new nodes and edges for changed files
    for (const file of changedFiles) {
      const ext = pathUtils.extname(file.path).toLowerCase();
      const parser = parsers.get(ext);

      if (parser) {
        try {
          const { nodes, edges } = parser.parse(file.content, file.path);

          // Add new nodes and edges
          this.graphCache.nodes.push(...nodes);
          this.graphCache.edges.push(...edges);
        } catch (error) {
          console.warn(`Failed to parse ${file.path}:`, error);
        }
      }
    }

    return this.graphCache;
  }

  private removeNodesForFiles(filePaths: string[]) {
    // Remove nodes that belong to changed files
    this.graphCache.nodes = this.graphCache.nodes.filter(
      (node) => !filePaths.some((path) => node.filePath.startsWith(path)),
    );

    // Remove edges that connect to removed nodes
    const nodeIds = new Set(this.graphCache.nodes.map((n) => n.id));
    this.graphCache.edges = this.graphCache.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );
  }
}
