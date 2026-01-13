import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { importFilesToWorkbench } from '~/utils/directFileImport';
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
      await importFilesToWorkbench(files);
    } catch (error) {
      console.error('Failed to import files:', error);
      toast.error('Failed to import files');
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
        title="Import Folder Directly"
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
