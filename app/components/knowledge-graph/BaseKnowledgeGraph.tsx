import React from 'react';
import { Link } from '@remix-run/react';

export function BaseKnowledgeGraph() {
  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="flex items-center text-mindvex-elements-textPrimary hover:text-mindvex-elements-textSecondary transition-theme"
        >
          <span className="i-ph:arrow-left mr-2"></span>
          Go to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-mindvex-elements-textPrimary mb-6">Knowledge Graph</h1>
      <div className="flex-1 bg-mindvex-elements-background-depth-2 rounded-lg border border-mindvex-elements-borderColor flex items-center justify-center">
        <p className="text-mindvex-elements-textSecondary">Knowledge graph visualization</p>
      </div>
    </div>
  );
}
