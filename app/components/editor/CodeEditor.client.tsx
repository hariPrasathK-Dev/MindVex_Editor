import React, { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { webcontainer } from '~/lib/webcontainer';
import { path } from '~/utils/path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export function CodeEditor() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    const loadFileTree = async () => {
      try {
        const container = await webcontainer;

        async function buildFileTree(dirPath: string): Promise<FileNode[]> {
          const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

          // Skip node_modules, .git directories and other common excludes
          const filteredEntries = entries.filter((entry) => {
            if (entry.isDirectory()) {
              return !['node_modules', '.git', 'dist', 'build', '.cache', '.next'].includes(entry.name);
            }

            // Skip binary files, large files and other common excludes
            return !(entry.name.endsWith('.DS_Store') || entry.name.endsWith('.log') || entry.name.startsWith('.env'));
          });

          const nodes: FileNode[] = [];

          for (const entry of filteredEntries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
              const children = await buildFileTree(fullPath);
              nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'folder',
                children,
              });
            } else {
              nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'file',
              });
            }
          }

          return nodes;
        }

        const tree = await buildFileTree('/');
        setFileTree(tree);
      } catch (error) {
        console.error('Error loading file tree:', error);
      }
    };

    loadFileTree();
  }, []);

  const handleFileSelect = async (filePath: string) => {
    try {
      const container = await webcontainer;
      const content = await container.fs.readFile(filePath, 'utf-8');
      setSelectedFile(filePath);
      setFileContent(content as string);
    } catch (error) {
      console.error('Error reading file:', error);
      setSelectedFile(filePath);
      setFileContent('');
    }
  };

  const renderFileTree = (nodes: FileNode[]) => {
    return (
      <ul className="space-y-1 ml-2">
        {nodes.map((node, index) => (
          <li key={`${node.path}-${index}`}>
            {node.type === 'folder' ? (
              <div>
                <div className="flex items-center text-mindvex-elements-textPrimary p-1 rounded transition-theme">
                  <span className="i-ph:folder mr-2"></span>
                  {node.name}
                </div>
                {node.children && node.children.length > 0 && (
                  <div className="ml-4">{renderFileTree(node.children)}</div>
                )}
              </div>
            ) : (
              <div
                className={`flex items-center text-mindvex-elements-textSecondary hover:text-mindvex-elements-textPrimary cursor-pointer p-1 rounded transition-theme ${selectedFile === node.path ? 'bg-mindvex-elements-background-depth-3' : ''}`}
                onClick={() => handleFileSelect(node.path)}
              >
                <span className="i-ph:file mr-2"></span>
                {node.name}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex h-full">
        <div className="w-64 bg-mindvex-elements-background-depth-2 border-r border-mindvex-elements-borderColor p-4">
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="flex items-center text-mindvex-elements-textPrimary hover:text-mindvex-elements-textSecondary transition-theme"
            >
              <span className="i-ph:arrow-left mr-2"></span>
              Go to Dashboard
            </Link>
          </div>
          <h3 className="font-semibold text-mindvex-elements-textPrimary mb-3">Files</h3>
          {fileTree.length > 0 ? (
            renderFileTree(fileTree)
          ) : (
            <ul className="space-y-1">
              <li className="text-mindvex-elements-textSecondary p-1">No files available</li>
            </ul>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="bg-mindvex-elements-background-depth-2 border-b border-mindvex-elements-borderColor p-3">
            <div className="text-sm text-mindvex-elements-textSecondary">
              {selectedFile ? selectedFile : 'No file selected'}
            </div>
          </div>
          <div className="flex-1 bg-mindvex-elements-background-depth-1 p-4">
            {selectedFile ? (
              <div className="h-full w-full">
                <textarea
                  className="w-full h-full bg-mindvex-elements-background-depth-1 text-mindvex-elements-textPrimary font-mono text-sm p-4 resize-none focus:outline-none"
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  onBlur={async () => {
                    if (selectedFile) {
                      try {
                        const container = await webcontainer;
                        await container.fs.writeFile(selectedFile, fileContent);
                      } catch (error) {
                        console.error('Error saving file:', error);
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-mindvex-elements-textSecondary">
                Select a file to edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
