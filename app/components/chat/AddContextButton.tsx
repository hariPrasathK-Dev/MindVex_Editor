import { workbenchStore } from '~/lib/stores/workbench';
import { useStore } from '@nanostores/react';
import type { FileMap } from '~/lib/stores/files';
import { Button } from '~/components/ui/Button';
import { Dialog, DialogTitle } from '~/components/ui/Dialog';
import { Checkbox } from '~/components/ui/Checkbox';
import { Folder, File } from 'lucide-react';
import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

interface AddContextButtonProps {
  onFilesSelected?: (files: FileMap) => void;
  onContextFilesSelected?: (files: Record<string, any>) => void;
}

export const AddContextButton = ({ onFilesSelected, onContextFilesSelected }: AddContextButtonProps) => {
  const files = useStore(workbenchStore.files);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);

    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }

    setSelectedFiles(newSelected);
  };

  const handleConfirm = () => {
    const selectedFileMap: FileMap = {};
    selectedFiles.forEach((filePath) => {
      const file = files[filePath];

      if (file) {
        selectedFileMap[filePath] = file;
      }
    });

    // Call the parent's context files handler if available
    if (onContextFilesSelected) {
      onContextFilesSelected(selectedFileMap);
    }

    // Also call the original onFilesSelected if available
    if (onFilesSelected) {
      onFilesSelected(selectedFileMap);
    }

    setIsOpen(false);
  };

  const renderFileTree = (files: FileMap, basePath: string = '') => {
    const entries = Object.entries(files);
    const folders: [string, any][] = [];
    const fileEntries: [string, any][] = [];

    entries.forEach(([path, dirent]) => {
      if (path.startsWith(basePath)) {
        const relativePath = path.substring(basePath.length);
        const pathParts = relativePath.split('/').filter((p) => p);

        if (pathParts.length === 0) {
          return;
        } // Skip root

        const firstPart = pathParts[0];
        const fullPath = basePath + firstPart;

        if (dirent?.type === 'folder') {
          if (!folders.some(([folderPath]) => folderPath === fullPath)) {
            folders.push([fullPath, dirent]);
          }
        } else {
          if (!fileEntries.some(([filePath]) => filePath === path)) {
            fileEntries.push([path, dirent]);
          }
        }
      }
    });

    return (
      <div className="ml-4">
        {/* Render folders */}
        {folders.map(([folderPath, dirent]) => (
          <div key={folderPath}>
            <div className="flex items-center py-1 hover:bg-mindvex-elements-background-depth-2 rounded px-2">
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
              <span className="font-medium">{folderPath.split('/').pop()}</span>
            </div>
            {renderFileTree(files, folderPath + '/')}
          </div>
        ))}

        {/* Render files */}
        {fileEntries.map(([filePath, dirent]) => (
          <div
            key={filePath}
            className="flex items-center py-1 hover:bg-mindvex-elements-background-depth-2 rounded px-2"
          >
            <Checkbox
              checked={selectedFiles.has(filePath)}
              onCheckedChange={() => toggleFileSelection(filePath)}
              className="mr-2"
            />
            <File className="w-4 h-4 mr-2 text-green-500" />
            <span>{filePath.split('/').pop()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <RadixDialog.Trigger asChild>
        <Button variant="outline" size="sm">
          Add Context
        </Button>
      </RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[9998] bg-black/70 dark:bg-black/80 backdrop-blur-sm" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-mindvex-elements-borderColor z-[9999] w-[600px] max-h-[70vh] focus:outline-none overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-mindvex-elements-borderColor">
              <RadixDialog.Title className="text-lg font-medium text-mindvex-elements-textPrimary">
                Add Context Files
              </RadixDialog.Title>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {Object.keys(files).length > 0 ? (
                renderFileTree(files)
              ) : (
                <p className="text-mindvex-elements-textSecondary">No files in workspace</p>
              )}
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-mindvex-elements-borderColor">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>Confirm ({selectedFiles.size} selected)</Button>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
