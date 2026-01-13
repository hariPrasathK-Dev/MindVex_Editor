import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { workbenchStore } from '~/lib/stores/workbench';

export default function KnowledgeGraphPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the workbench with Quick Actions tab selected
    workbenchStore.showWorkbench.set(true);
    workbenchStore.currentView.set('quick-actions');

    // Navigate back to the root to close this page
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirecting to Quick Actions...</p>
      </div>
    </div>
  );
}
