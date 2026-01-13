import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  workspacesStore,
  currentWorkspaceStore,
  createWorkspace,
  setCurrentWorkspace,
  workspacesLoadingStore,
} from '~/lib/stores/workspaceStore';

export function WorkspaceSelector() {
  const workspaces = useStore(workspacesStore);
  const currentWorkspace = useStore(currentWorkspaceStore);
  const isLoading = useStore(workspacesLoadingStore);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWorkspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setIsCreating(true);

    try {
      await createWorkspace(newWorkspaceName, newWorkspaceDescription || undefined);
      toast.success(`Workspace "${newWorkspaceName}" created successfully`);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchWorkspace = (workspaceId: number) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);

    if (workspace) {
      setCurrentWorkspace(workspace);
      toast.success(`Switched to workspace: ${workspace.name}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-mindvex-elements-textSecondary">
        <div className="i-ph:spinner animate-spin" />
        <span>Loading workspaces...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-mindvex-elements-background-depth-1 rounded-lg border border-mindvex-elements-borderColor">
      {/* Current Workspace Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="i-ph:folder-open text-accent-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-mindvex-elements-textPrimary">
              {currentWorkspace?.name || 'No workspace selected'}
            </span>
            {currentWorkspace?.description && (
              <span className="text-xs text-mindvex-elements-textTertiary">{currentWorkspace.description}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-2 py-1 text-xs rounded bg-accent-500 text-white hover:bg-accent-600 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'New'}
        </button>
      </div>

      {/* Create Workspace Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateWorkspace}
          className="flex flex-col gap-2 p-2 bg-mindvex-elements-background-depth-2 rounded border border-mindvex-elements-borderColor"
        >
          <input
            type="text"
            placeholder="Workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="px-2 py-1 text-sm rounded bg-mindvex-elements-background-depth-1 border border-mindvex-elements-borderColor text-mindvex-elements-textPrimary"
            disabled={isCreating}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newWorkspaceDescription}
            onChange={(e) => setNewWorkspaceDescription(e.target.value)}
            className="px-2 py-1 text-sm rounded bg-mindvex-elements-background-depth-1 border border-mindvex-elements-borderColor text-mindvex-elements-textPrimary"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating}
            className="px-2 py-1 text-xs rounded bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      )}

      {/* Workspace List */}
      {workspaces.length > 1 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          <span className="text-xs text-mindvex-elements-textTertiary px-2">Switch Workspace:</span>
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleSwitchWorkspace(workspace.id)}
              className={`px-2 py-1.5 text-sm text-left rounded transition-colors ${
                currentWorkspace?.id === workspace.id
                  ? 'bg-accent-500/20 text-accent-500'
                  : 'hover:bg-mindvex-elements-background-depth-2 text-mindvex-elements-textSecondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`i-ph:folder ${currentWorkspace?.id === workspace.id ? 'text-accent-500' : ''}`} />
                <span>{workspace.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {workspaces.length === 0 && !showCreateForm && (
        <div className="text-xs text-mindvex-elements-textTertiary text-center py-2">
          No workspaces yet. Import a folder to create one.
        </div>
      )}
    </div>
  );
}
