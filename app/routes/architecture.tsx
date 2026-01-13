import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { ArchitectureDiagram } from '~/components/architecture/ArchitectureDiagram.client';
import { BaseArchitectureDiagram } from '~/components/architecture/BaseArchitectureDiagram';
import { Menu } from '~/components/sidebar/Menu.client';
import { Workbench } from '~/components/workbench/Workbench.client';

export const meta: MetaFunction = () => {
  return [
    { title: 'MindVex - Architecture Diagram' },
    { name: 'description', content: 'Visualize project architecture' },
  ];
};

export const loader = () => json({});

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col h-full w-full bg-mindvex-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="flex flex-col lg:flex-row h-full">
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <ClientOnly fallback={<BaseArchitectureDiagram />}>{() => <ArchitectureDiagram />}</ClientOnly>
        <ClientOnly>{() => <Workbench chatStarted={true} isStreaming={false} />}</ClientOnly>
      </div>
    </div>
  );
}
