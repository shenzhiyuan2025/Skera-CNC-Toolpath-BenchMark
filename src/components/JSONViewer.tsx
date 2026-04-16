import React from 'react';
import { A2UIMessage } from '../types/a2ui';

interface JSONViewerProps {
  data: A2UIMessage | null;
}

export const JSONViewer: React.FC<JSONViewerProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        No JSON data available
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-900 p-4 rounded-lg">
      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
