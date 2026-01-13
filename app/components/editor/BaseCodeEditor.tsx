import React from 'react';
import { Link } from '@remix-run/react';

export function BaseCodeEditor() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex h-full">
        <div className="w-64 bg-mindvex-elements-background-depth-2 border-r border-mindvex-elements-borderColor p-4">
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="flex items-center text-mindvex-elements-textPrimary hover:text-mindvex-elements-textSecondary transition-theme"
            >
              <span className="i-ph:arrow-left mr-2"></span>
              Go to Dashboard
            </Link>
          </div>
          <h3 className="font-semibold text-mindvex-elements-textPrimary mb-3">Files</h3>
          <ul className="space-y-1">
            <li className="text-mindvex-elements-textSecondary p-1">No files available</li>
          </ul>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="bg-mindvex-elements-background-depth-2 border-b border-mindvex-elements-borderColor p-3">
            <div className="text-sm text-mindvex-elements-textSecondary">No file selected</div>
          </div>
          <div className="flex-1 bg-mindvex-elements-background-depth-1 p-4">
            <div className="h-full flex items-center justify-center text-mindvex-elements-textSecondary">
              Select a file to edit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
