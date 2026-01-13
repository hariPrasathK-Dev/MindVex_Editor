import React from 'react';
import { Link } from '@remix-run/react';

export function Import() {
  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="mb-6">
        <Link
          to="/"
          className="flex items-center text-mindvex-elements-textPrimary hover:text-mindvex-elements-textSecondary transition-theme"
        >
          <span className="i-ph:arrow-left mr-2"></span>
          Go to Home
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-mindvex-elements-textPrimary mb-6">Import</h1>
      <div className="bg-mindvex-elements-background-depth-2 p-6 rounded-lg border border-mindvex-elements-borderColor">
        <h2 className="text-xl font-semibold text-mindvex-elements-textPrimary mb-4">Import Folder</h2>
        <p className="text-mindvex-elements-textSecondary mb-4">Select a folder to import into your workspace</p>
        <button className="bg-mindvex-elements-button-primary-bg text-mindvex-elements-button-primary-text px-4 py-2 rounded-lg hover:bg-mindvex-elements-button-primary-hoverBg transition-theme">
          Select Folder
        </button>
      </div>
    </div>
  );
}
