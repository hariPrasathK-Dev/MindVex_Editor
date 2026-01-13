import { useStore } from '@nanostores/react';
import { currentChatStore, messagesStore } from '~/lib/stores/chatStore';

export function ChatInfo() {
  const currentChat = useStore(currentChatStore);
  const messages = useStore(messagesStore);

  if (!currentChat) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-mindvex-elements-textTertiary">
        <div className="i-ph:chat-circle-dots" />
        <span>No active chat</span>
      </div>
    );
  }

  const messageCount = messages.length;
  const createdAt = new Date(currentChat.createdAt).toLocaleDateString();

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-mindvex-elements-background-depth-1 rounded-lg border border-mindvex-elements-borderColor">
      <div className="i-ph:chat-circle-text text-accent-500" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium text-mindvex-elements-textPrimary truncate">{currentChat.title}</span>
        <span className="text-xs text-mindvex-elements-textTertiary">
          {messageCount} message{messageCount !== 1 ? 's' : ''} • Created {createdAt}
        </span>
      </div>
    </div>
  );
}
