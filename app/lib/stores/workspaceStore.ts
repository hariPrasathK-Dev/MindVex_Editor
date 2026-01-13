import { atom } from 'nanostores';
import type { Workspace } from '~/types/backend';
import { backendApi } from '~/lib/services/backendApiService';

export const workspacesStore = atom<Workspace[]>([]);
export const currentWorkspaceStore = atom<Workspace | null>(null);
export const workspacesLoadingStore = atom<boolean>(false);

export async function loadWorkspaces() {
  try {
    workspacesLoadingStore.set(true);

    const workspaces = await backendApi.getWorkspaces();
    workspacesStore.set(workspaces);

    // Set first workspace as current if none selected
    if (!currentWorkspaceStore.get() && workspaces.length > 0) {
      currentWorkspaceStore.set(workspaces[0]);
    }
  } catch (error) {
    console.error('Failed to load workspaces:', error);
    throw error;
  } finally {
    workspacesLoadingStore.set(false);
  }
}

export async function createWorkspace(name: string, description?: string, settings?: Record<string, any>) {
  try {
    const workspace = await backendApi.createWorkspace({ name, description, settings });
    workspacesStore.set([...workspacesStore.get(), workspace]);
    currentWorkspaceStore.set(workspace);

    return workspace;
  } catch (error) {
    console.error('Failed to create workspace:', error);
    throw error;
  }
}

export async function updateWorkspace(id: number, name: string, description?: string, settings?: Record<string, any>) {
  try {
    const workspace = await backendApi.updateWorkspace(id, { name, description, settings });
    const workspaces = workspacesStore.get().map((w) => (w.id === id ? workspace : w));
    workspacesStore.set(workspaces);

    if (currentWorkspaceStore.get()?.id === id) {
      currentWorkspaceStore.set(workspace);
    }

    return workspace;
  } catch (error) {
    console.error('Failed to update workspace:', error);
    throw error;
  }
}

export async function deleteWorkspace(id: number) {
  try {
    await backendApi.deleteWorkspace(id);

    const workspaces = workspacesStore.get().filter((w) => w.id !== id);
    workspacesStore.set(workspaces);

    if (currentWorkspaceStore.get()?.id === id) {
      currentWorkspaceStore.set(workspaces[0] || null);
    }
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    throw error;
  }
}

export function setCurrentWorkspace(workspace: Workspace | null) {
  currentWorkspaceStore.set(workspace);
}
