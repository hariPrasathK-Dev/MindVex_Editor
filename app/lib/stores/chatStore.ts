import { atom } from 'nanostores';
import type { Chat, ChatMessage } from '~/types/backend';
import { backendApi } from '~/lib/services/backendApiService';

export const chatsStore = atom<Chat[]>([]);
export const currentChatStore = atom<Chat | null>(null);
export const messagesStore = atom<ChatMessage[]>([]);
export const chatsLoadingStore = atom<boolean>(false);
export const messagesLoadingStore = atom<boolean>(false);

export async function loadChats(workspaceId: number) {
  try {
    chatsLoadingStore.set(true);

    const chats = await backendApi.getWorkspaceChats(workspaceId);
    chatsStore.set(chats);

    // Set first chat as current if none selected
    if (!currentChatStore.get() && chats.length > 0) {
      await loadChatMessages(chats[0].id);
      currentChatStore.set(chats[0]);
    }
  } catch (error) {
    console.error('Failed to load chats:', error);
    throw error;
  } finally {
    chatsLoadingStore.set(false);
  }
}

export async function createChat(workspaceId: number, title: string) {
  try {
    const chat = await backendApi.createChat(workspaceId, { title });
    chatsStore.set([...chatsStore.get(), chat]);
    currentChatStore.set(chat);
    messagesStore.set([]);

    return chat;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
}

export async function deleteChat(id: number) {
  try {
    await backendApi.deleteChat(id);

    const chats = chatsStore.get().filter((c) => c.id !== id);
    chatsStore.set(chats);

    if (currentChatStore.get()?.id === id) {
      if (chats.length > 0) {
        await loadChatMessages(chats[0].id);
        currentChatStore.set(chats[0]);
      } else {
        currentChatStore.set(null);
        messagesStore.set([]);
      }
    }
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  }
}

export async function loadChatMessages(chatId: number) {
  try {
    messagesLoadingStore.set(true);

    const messages = await backendApi.getChatMessages(chatId);
    messagesStore.set(messages);
  } catch (error) {
    console.error('Failed to load messages:', error);
    throw error;
  } finally {
    messagesLoadingStore.set(false);
  }
}

export async function sendMessage(
  chatId: number,
  content: string,
  role: 'user' | 'assistant' | 'system' = 'user',
  metadata?: Record<string, any>,
) {
  try {
    const message = await backendApi.addMessage(chatId, { role, content, metadata });
    messagesStore.set([...messagesStore.get(), message]);

    return message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

export function setCurrentChat(chat: Chat | null) {
  currentChatStore.set(chat);

  if (chat) {
    loadChatMessages(chat.id);
  } else {
    messagesStore.set([]);
  }
}

export function addMessageToStore(message: ChatMessage) {
  messagesStore.set([...messagesStore.get(), message]);
}
