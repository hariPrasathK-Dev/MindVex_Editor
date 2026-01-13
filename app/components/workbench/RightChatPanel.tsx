import { useStore } from '@nanostores/react';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Panel, type ImperativePanelHandle } from 'react-resizable-panels';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { Chat } from '~/components/chat/Chat.client';
import { BaseChat } from '~/components/chat/BaseChat';
import { ClientOnly } from 'remix-utils/client-only';

const DEFAULT_RIGHT_CHAT_SIZE = 30;

export const RightChatPanel = memo(() => {
  const showRightChat = useStore(workbenchStore.showRightChat);
  const rightChatPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    const { current: rightChatPanel } = rightChatPanelRef;

    if (!rightChatPanel) {
      return;
    }

    const isCollapsed = rightChatPanel.isCollapsed();

    if (!showRightChat && !isCollapsed) {
      rightChatPanel.collapse();
    } else if (showRightChat && isCollapsed) {
      rightChatPanel.resize(DEFAULT_RIGHT_CHAT_SIZE);
    }
  }, [showRightChat]);

  return (
    <Panel
      ref={rightChatPanelRef}
      defaultSize={showRightChat ? DEFAULT_RIGHT_CHAT_SIZE : 0}
      minSize={20}
      collapsible
      onExpand={() => {
        workbenchStore.toggleRightChat(true);
      }}
      onCollapse={() => {
        workbenchStore.toggleRightChat(false);
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center bg-mindvex-elements-background-depth-2 border-b border-mindvex-elements-borderColor gap-1.5 min-h-[34px] p-2">
          <span className="text-sm font-medium text-mindvex-elements-textPrimary">Chat</span>
          <IconButton
            className="ml-auto"
            icon="i-ph:caret-down"
            title="Close"
            size="md"
            onClick={() => workbenchStore.toggleRightChat(false)}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ClientOnly fallback={<BaseChat inRightPanel={true} />}>{() => <Chat inRightPanel={true} />}</ClientOnly>
        </div>
      </div>
    </Panel>
  );
});
