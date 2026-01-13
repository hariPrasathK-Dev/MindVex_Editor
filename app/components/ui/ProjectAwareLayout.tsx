import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { Link } from '@remix-run/react';

interface ProjectAwareLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showProjectActions?: boolean;
}

export function ProjectAwareLayout({
  children,
  title = 'Project Editor',
  description = 'Edit your code and chat with AI',
  showProjectActions = true,
}: ProjectAwareLayoutProps) {
  const files = useStore(workbenchStore.files);
  const hasFiles = Object.keys(files || {}).length > 0;

  return (
    <div className="flex-1 flex flex-col h-full">
      {hasFiles && showProjectActions && (
        <div className="p-4 border-b border-mindvex-elements-borderColor">
          <h1 className="text-2xl font-bold text-mindvex-elements-textPrimary mb-2">{title}</h1>
          <p className="text-mindvex-elements-textSecondary mb-4">{description}</p>
          <div className="flex gap-2 mb-4">
            <Link
              to="/chat"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mindvex-elements-borderColor disabled:pointer-events-none disabled:opacity-50 bg-mindvex-elements-background text-mindvex-elements-textPrimary hover:bg-mindvex-elements-background-depth-2 h-10 rounded-md px-8 gap-2 bg-mindvex-elements-background-depth-1 text-mindvex-elements-textPrimary hover:bg-mindvex-elements-background-depth-2 border border-mindvex-elements-borderColor h-10 px-4 py-2 min-w-[120px] justify-center transition-all duration-200 ease-in-out gap-2 bg-mindvex-elements-background-depth-1 text-mindvex-elements-textPrimary hover:bg-mindvex-elements-background-depth-2 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] h-10 px-4 py-2 min-w-[120px] justify-center transition-all duration-200 ease-in-out rounded-lg"
            >
              <span className="i-ph:chat-teardrop-text w-4 h-4"></span>
              Chat with Code
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mindvex-elements-borderColor disabled:pointer-events-none disabled:opacity-50 bg-mindvex-elements-background text-mindvex-elements-textPrimary hover:bg-mindvex-elements-background-depth-2 h-10 rounded-md px-8 gap-2 bg-mindvex-elements-background-depth-1 text-mindvex-elements-textPrimary hover:bg-mindvex-elements-background-depth-2 border border-mindvex-elements-borderColor h-10 px-4 py-2 min-w-[120px] justify-center transition-all duration-200 ease-in-out gap-2 bg-mindvex-elements-background-depth-1 text-mindvex-elements-textPrimary hover:bg-mindvex-elements-background-depth-2 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] h-10 px-4 py-2 min-w-[120px] justify-center transition-all duration-200 ease-in-out rounded-lg"
            >
              <span className="i-ph:chart-bar w-4 h-4"></span>
              Open Dashboard
            </Link>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col h-full">{children}</div>
    </div>
  );
}
