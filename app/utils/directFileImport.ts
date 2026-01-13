import { workbenchStore } from '~/lib/stores/workbench';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { logStore } from '~/lib/stores/logs';
import { toast } from 'react-toastify';
import { WORK_DIR } from '~/utils/constants';
import { path } from '~/utils/path';

export const importFilesToWorkbench = async (files: File[]) => {
  const filteredFiles = files.filter((file) => {
    // Extract the relative path, keeping the full folder structure
    const pathParts = file.webkitRelativePath.split('/');

    // Remove the first part which is the root folder name, keep the rest
    const path = pathParts.slice(1).join('/');
    console.log('Filtering file path:', path, 'from original:', file.webkitRelativePath);

    const include = shouldIncludeFile(path);

    return include;
  });

  if (filteredFiles.length === 0) {
    const error = new Error('No valid files found');
    logStore.logError('File import failed - no valid files', error, { folderName: 'Unknown Folder' });
    toast.error('No files found in the selected folder');

    return false;
  }

  if (filteredFiles.length > MAX_FILES) {
    const error = new Error(`Too many files: ${filteredFiles.length}`);
    logStore.logError('File import failed - too many files', error, {
      fileCount: filteredFiles.length,
      maxFiles: MAX_FILES,
    });
    toast.error(
      `This folder contains ${filteredFiles.length.toLocaleString()} files. This product is not yet optimized for very large projects. Please select a folder with fewer than ${MAX_FILES.toLocaleString()} files.`,
    );

    return false;
  }

  const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';
  console.log('Detected folder name:', folderName);

  const loadingToast = toast.loading(`Importing ${folderName}...`);

  try {
    const fileChecks = await Promise.all(
      filteredFiles.map(async (file) => ({
        file,
        isBinary: await isBinaryFile(file),
      })),
    );

    const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
    const binaryFilePaths = fileChecks
      .filter((f) => f.isBinary)
      .map((f) => {
        const path = f.file.webkitRelativePath.split('/').slice(1).join('/');
        console.log('Binary file path:', path);

        return path;
      });

    if (textFiles.length === 0) {
      const error = new Error('No text files found');
      logStore.logError('File import failed - no text files', error, { folderName });
      toast.error('No text files found in the selected folder');

      return false;
    }

    if (binaryFilePaths.length > 0) {
      logStore.logWarning(`Skipping binary files during import`, {
        folderName,
        binaryCount: binaryFilePaths.length,
      });
      toast.info(`Skipping ${binaryFilePaths.length} binary files`);
    }

    // Import text files into workbench
    for (const file of textFiles) {
      const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');

      // Construct the full path using WORK_DIR and relative path
      let fullFilePath: string = `${WORK_DIR}/${relativePath}`.replace(/\/\/+/g, '/');

      // Normalize the path to remove any relative path components like ./ or ../
      fullFilePath = path.normalize(fullFilePath);

      // Make sure it's not empty
      if (fullFilePath === WORK_DIR || fullFilePath === `${WORK_DIR}/`) {
        continue; // Skip root path
      }

      const content = await file.text();

      console.log(
        'Processing file:',
        file.name,
        'Original webkitRelativePath:',
        file.webkitRelativePath,
        'Relative path:',
        relativePath,
        'Full path:',
        fullFilePath,
      );

      // Create the file in the workbench
      try {
        console.log('About to create file with path:', fullFilePath);

        const result = await workbenchStore.createFile(fullFilePath, content);
        console.log('File creation result:', result, 'for path:', fullFilePath);
      } catch (error) {
        console.error(`Error creating file ${fullFilePath}:`, error);
        console.error('WebContainer workdir was expected to be:', WORK_DIR);
        toast.error(`Error creating file: ${fullFilePath}`);
        continue; // Skip this file and continue with others
      }
    }

    // Update editor documents to reflect all newly created files
    const allFiles = workbenchStore.files.get();
    workbenchStore.setDocuments(allFiles, true); // autoSelectFirstFile = true

    // Explicitly select the first file if available
    if (Object.keys(allFiles).length > 0) {
      const firstFilePath = Object.keys(allFiles).find((path) => allFiles[path]?.type === 'file');

      if (firstFilePath) {
        workbenchStore.setSelectedFile(firstFilePath);
      }
    }

    logStore.logSystem('Folder imported successfully', {
      folderName,
      textFileCount: textFiles.length,
      binaryFileCount: binaryFilePaths.length,
    });

    toast.success('Folder imported successfully');

    // Show the workbench after import
    workbenchStore.setShowWorkbench(true);

    return true;
  } catch (error) {
    logStore.logError('Failed to import folder', error, { folderName });
    console.error('Failed to import folder:', error);
    toast.error('Failed to import folder');

    return false;
  } finally {
    toast.dismiss(loadingToast);
  }
};
