import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { redirect } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'MindVex - Chat with Your Code' },
    { name: 'description', content: 'MindVex AI assistant for code discussions and analysis' },
  ];
};

export async function loader() {
  return redirect('/');
}

export default function ChatPage() {
  return null; // This component won't be rendered due to the redirect
}
