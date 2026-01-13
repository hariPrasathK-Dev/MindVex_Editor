import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import { importGitRepoToWorkbench } from '~/utils/workbenchImport';
import { repositoryHistoryStore } from '~/lib/stores/repositoryHistory';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import { X, Github, GitBranch } from 'lucide-react';

// Import the repository selector components
import { GitHubRepositorySelector } from '~/components/@settings/tabs/github/components/GitHubRepositorySelector';
import { GitLabRepositorySelector } from '~/components/@settings/tabs/gitlab/components/GitLabRepositorySelector';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // Include this so npm install runs much faster '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

const MAX_FILE_SIZE = 100 * 1024; // 100KB limit per file
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total limit

interface DirectGitCloneButtonProps {
  className?: string;
}

export default function DirectGitCloneButton({ className }: DirectGitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'github' | 'gitlab' | null>(null);

  const handleClone = async (repoUrl: string) => {
    if (!ready) {
      return;
    }

    setLoading(true);
    setIsDialogOpen(false);
    setSelectedProvider(null);

    // Show options to add to existing workspace or create new workspace
    const addToExisting = window.confirm(
      `Do you want to add this repository to the existing workspace?\n\nClick 'OK' to add to existing workspace, 'Cancel' to create a new workspace (replacing current content)`,
    );

    try {
      await importGitRepoToWorkbench(repoUrl, gitClone, addToExisting);

      // Extract repo name from URL for history
      const repoName =
        repoUrl
          .split('/')
          .pop()
          ?.replace(/\.git$/, '') || 'Unknown Repository';

      // Add to repository history
      repositoryHistoryStore.addRepository(repoUrl, repoName, `Imported: ${repoName}`);

      toast.success(
        `Repository ${repoName} imported and added to history ${addToExisting ? 'with existing content' : '(workspace cleared)'}`,
      );
    } catch (error) {
      console.error('Error during repository import:', error);
      toast.error('Failed to import repository to workbench');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setSelectedProvider(null);
          setIsDialogOpen(true);
        }}
        title="Clone a repo to workbench"
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
        disabled={!ready || loading}
      >
        Clone a repo
        <div className="flex items-center gap-1 ml-2">
          <Github className="w-4 h-4" />
          <GitBranch className="w-4 h-4" />
        </div>
      </Button>

      {/* Provider Selection Dialog */}
      {isDialogOpen && !selectedProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-mindvex-elements-textPrimary dark:text-mindvex-elements-textPrimary">
                  Choose Repository Provider
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2 rounded-lg bg-transparent hover:bg-mindvex-elements-background-depth-1 dark:hover:bg-mindvex-elements-background-depth-1 text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary hover:text-mindvex-elements-textPrimary dark:hover:text-mindvex-elements-textPrimary transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <X className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedProvider('github')}
                  className="w-full p-4 rounded-lg bg-mindvex-elements-background-depth-1 dark:bg-mindvex-elements-background-depth-1 hover:bg-mindvex-elements-background-depth-2 dark:hover:bg-mindvex-elements-background-depth-2 border border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor hover:border-mindvex-elements-borderColorActive dark:hover:border-mindvex-elements-borderColorActive transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors">
                      <Github className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-mindvex-elements-textPrimary dark:text-mindvex-elements-textPrimary">
                        GitHub
                      </div>
                      <div className="text-sm text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary">
                        Clone from GitHub repositories
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedProvider('gitlab')}
                  className="w-full p-4 rounded-lg bg-mindvex-elements-background-depth-1 dark:bg-mindvex-elements-background-depth-1 hover:bg-mindvex-elements-background-depth-2 dark:hover:bg-mindvex-elements-background-depth-2 border border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor hover:border-mindvex-elements-borderColorActive dark:hover:border-mindvex-elements-borderColorActive transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 dark:group-hover:bg-orange-500/30 transition-colors">
                      <GitBranch className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium text-mindvex-elements-textPrimary dark:text-mindvex-elements-textPrimary">
                        GitLab
                      </div>
                      <div className="text-sm text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary">
                        Clone from GitLab repositories
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repository Selection */}
      {isDialogOpen && selectedProvider === 'github' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <Github className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-mindvex-elements-textPrimary dark:text-mindvex-elements-textPrimary">
                    Import GitHub Repository
                  </h3>
                  <p className="text-sm text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary">
                    Clone a repository from GitHub to your workbench
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedProvider(null);
                }}
                className="p-2 rounded-lg bg-transparent hover:bg-mindvex-elements-background-depth-1 dark:hover:bg-mindvex-elements-background-depth-1 text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary hover:text-mindvex-elements-textPrimary dark:hover:text-mindvex-elements-textPrimary transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <GitHubRepositorySelector onClone={handleClone} />
            </div>
          </div>
        </div>
      )}

      {/* GitLab Repository Selection */}
      {isDialogOpen && selectedProvider === 'gitlab' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-mindvex-elements-borderColor dark:border-mindvex-elements-borderColor flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-mindvex-elements-textPrimary dark:text-mindvex-elements-textPrimary">
                    Import GitLab Repository
                  </h3>
                  <p className="text-sm text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary">
                    Clone a repository from GitLab to your workbench
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedProvider(null);
                }}
                className="p-2 rounded-lg bg-transparent hover:bg-mindvex-elements-background-depth-1 dark:hover:bg-mindvex-elements-background-depth-1 text-mindvex-elements-textSecondary dark:text-mindvex-elements-textSecondary hover:text-mindvex-elements-textPrimary dark:hover:text-mindvex-elements-textPrimary transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <GitLabRepositorySelector onClone={handleClone} />
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingOverlay message="Please wait while we clone the repository to your workbench..." />}
    </>
  );
}
