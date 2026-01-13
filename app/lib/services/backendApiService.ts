import type {
  AuthResponse,
  User,
  Workspace,
  WorkspaceRequest,
  Chat,
  ChatRequest,
  ChatMessage,
  ChatMessageRequest,
  ApiError,
} from '~/types/backend';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api';

class BackendApiService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      try {
        const errorData = (await response.json()) as any;
        const error: ApiError = {
          status: errorData.status || response.status,
          message: errorData.message || response.statusText,
          timestamp: errorData.timestamp || new Date().toISOString(),
        };
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  }

  // Authentication
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  // Workspaces
  async createWorkspace(data: WorkspaceRequest): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Workspace>(response);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Workspace[]>(response);
  }

  async getWorkspace(id: number): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Workspace>(response);
  }

  async updateWorkspace(id: number, data: WorkspaceRequest): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Workspace>(response);
  }

  async deleteWorkspace(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete workspace: ${response.statusText}`);
    }
  }

  // Chats
  async createChat(workspaceId: number, data: ChatRequest): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/chats`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Chat>(response);
  }

  async getWorkspaceChats(workspaceId: number): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/chats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Chat[]>(response);
  }

  async getChat(id: number): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chats/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Chat>(response);
  }

  async deleteChat(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chats/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }
  }

  // Messages
  async addMessage(chatId: number, data: ChatMessageRequest): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ChatMessage>(response);
  }

  async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ChatMessage[]>(response);
  }
}

export const backendApi = new BackendApiService();
