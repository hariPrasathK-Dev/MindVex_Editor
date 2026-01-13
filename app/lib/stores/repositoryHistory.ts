import { atom, map, type MapStore } from 'nanostores';
import { webcontainer } from '~/lib/webcontainer';

export interface RepositoryHistoryItem {
  id: string;
  url: string;
  name: string;
  description: string;
  timestamp: string;
  branch?: string;
  commitHash?: string;
}

class RepositoryHistoryStore {
  private _repositoryHistory: MapStore<Record<string, RepositoryHistoryItem>> = map({});

  repositoryHistory = this._repositoryHistory;

  constructor() {
    // Load repository history from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mindvex_repository_history');

      if (stored) {
        try {
          const items: RepositoryHistoryItem[] = JSON.parse(stored);
          const historyMap: Record<string, RepositoryHistoryItem> = {};

          items.forEach((item) => {
            historyMap[item.id] = item;
          });

          this._repositoryHistory.set(historyMap);
        } catch (error) {
          console.error('Failed to load repository history from storage:', error);
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const items = Object.values(this._repositoryHistory.get());
      localStorage.setItem('mindvex_repository_history', JSON.stringify(items));
    }
  }

  addRepository(repoUrl: string, repoName: string, description?: string) {
    // Check if repository with same URL already exists
    const currentHistory = this._repositoryHistory.get();
    const existingRepo = Object.values(currentHistory).find((item) => item.url === repoUrl);

    if (existingRepo) {
      // Update timestamp of existing repository instead of creating duplicate
      const updatedItem: RepositoryHistoryItem = {
        ...existingRepo,
        timestamp: new Date().toISOString(),
        description: description || existingRepo.description,
      };

      this._repositoryHistory.set({
        ...currentHistory,
        [existingRepo.id]: updatedItem,
      });

      this.saveToStorage();
      return updatedItem;
    }

    // Create new repository entry if it doesn't exist
    const id = `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem: RepositoryHistoryItem = {
      id,
      url: repoUrl,
      name: repoName,
      description: description || `Repository: ${repoName}`,
      timestamp: new Date().toISOString(),
    };

    this._repositoryHistory.set({
      ...currentHistory,
      [id]: newItem,
    });

    this.saveToStorage();

    return newItem;
  }

  removeRepository(id: string) {
    const currentHistory = this._repositoryHistory.get();
    const newHistory = { ...currentHistory };
    delete newHistory[id];
    this._repositoryHistory.set(newHistory);
    this.saveToStorage();
  }

  clearHistory() {
    this._repositoryHistory.set({});
    this.saveToStorage();
  }

  getRepository(id: string): RepositoryHistoryItem | undefined {
    return this._repositoryHistory.get()[id];
  }

  getAllRepositories(): RepositoryHistoryItem[] {
    return Object.values(this._repositoryHistory.get()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async importRepositoryToWorkbench(id: string) {
    const repo = this.getRepository(id);

    if (!repo) {
      throw new Error(`Repository with id ${id} not found`);
    }

    // Use the existing git functionality to clone the repository
    const { useGit } = await import('~/lib/hooks/useGit');
    const gitHook = useGit();

    /*
     * This would trigger the git clone functionality to import the repo to workbench
     * Implementation would depend on the specific git clone implementation
     */
    console.log(`Importing repository ${repo.name} from ${repo.url} to workbench`);

    // For now, just return the repo info
    return repo;
  }
}

export const repositoryHistoryStore = new RepositoryHistoryStore();
