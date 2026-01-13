import React, { useState } from 'react';
import { importFolderToWorkbench } from '~/utils/workbenchImport';
import { repositoryHistoryStore } from '~/lib/stores/repositoryHistory';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';

interface DirectImportFolderButtonProps {
  className?: string;
}

export const DirectImportFolderButton: React.FC<DirectImportFolderButtonProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }

    setIsLoading(true);

    try {
      // Get the folder name from the first file's path
      const folderName = files[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';

      // Show options to add to existing workspace or create new workspace
      const addToExisting = window.confirm(
        `Do you want to add '${folderName}' to the existing workspace?\n\nClick 'OK' to add to existing workspace, 'Cancel' to create a new workspace (replacing current content)`,
      );

      await importFolderToWorkbench(files, addToExisting);

      // Add to repository history
      repositoryHistoryStore.addRepository(`folder://${folderName}`, folderName, `Imported folder: ${folderName}`);

      toast.success(
        `Folder ${folderName} imported and added to history ${addToExisting ? 'with existing content' : '(workspace cleared)'}`,
      );
    } catch (error) {
      console.error('Failed to import folder to workbench:', error);
      toast.error('Failed to import folder to workbench');
    } finally {
      setIsLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <>
      <input
        type="file"
        id="direct-folder-import"
        className="hidden"
        webkitdirectory=""
        directory=""
        onChange={handleFileChange}
        {...({} as any)}
      />
      <Button
        onClick={() => {
          const input = document.getElementById('direct-folder-import');
          input?.click();
        }}
        title="Import Folder to Workbench"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-mindvex-elements-background-depth-1',
          'text-mindvex-elements-textPrimary',
          'hover:bg-mindvex-elements-background-depth-2',
          'border border-mindvex-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:upload-simple w-4 h-4" />
        {isLoading ? 'Importing...' : 'Import Folder'}
      </Button>
    </>
  );
};
