import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface } from './ChatInterface';
import { JSONViewer } from './JSONViewer';
import { A2UIRenderer } from './a2ui/A2UIRenderer';
import { useApp } from '../context/AppContext';
import { examplesMap } from '../data/a2uiExamples';
import { Code, Layout, Grid } from 'lucide-react';

export const SplitView: React.FC = () => {
  const { state, actions } = useApp();
  const navigate = useNavigate();

  const ttfbMs =
    state.lastRequest?.startedAtMs && state.lastRequest?.firstA2UIAtMs
      ? Math.max(0, state.lastRequest.firstA2UIAtMs - state.lastRequest.startedAtMs)
      : undefined;

  const totalMs =
    state.lastRequest?.startedAtMs && state.lastRequest?.endedAtMs
      ? Math.max(0, state.lastRequest.endedAtMs - state.lastRequest.startedAtMs)
      : undefined;

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    actions.loadExample(e.target.value);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left Pane: Chat */}
      <div className="w-3/5 h-full flex flex-col min-w-[300px]">
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-600" />
            A2UI Simulator
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/examples')}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors mr-2 px-2 py-1 rounded hover:bg-gray-100"
            >
              <Grid className="w-4 h-4" />
              Library
            </button>
            <span className="text-sm text-gray-600">Quick Load:</span>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleExampleChange}
              value={state.selectedExample || ''}
            >
              <option value="">Select an example...</option>
              {Object.keys(examplesMap).map((key) => (
                <option key={key} value={key}>
                  {examplesMap[key].metadata?.title || key}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ChatInterface />
      </div>

      {/* Right Pane: JSON & Renderer */}
      <div className="w-2/5 h-full flex flex-col border-l border-gray-200 min-w-[300px]">
        {/* Top Right: JSON Viewer */}
        <div className="h-1/2 flex flex-col border-b border-gray-200 bg-gray-900">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
             <div className="flex items-center gap-2 text-gray-300">
               <Code className="w-4 h-4" />
               <span className="text-sm font-medium">A2UI JSON Protocol</span>
             </div>
             <div className="text-xs text-gray-400 flex items-center gap-3">
               {ttfbMs !== undefined && <span>首个UI: {ttfbMs}ms</span>}
               {totalMs !== undefined && <span>完成: {totalMs}ms</span>}
               <span className="text-gray-500">实时(流式)</span>
             </div>
          </div>
          <div className="flex-1 overflow-hidden p-0">
            <JSONViewer data={state.currentA2UIData} />
          </div>
        </div>

        {/* Bottom Right: Renderer */}
        <div className="h-1/2 flex flex-col bg-gray-50">
          <div className="flex items-center px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
             <span className="text-sm font-medium text-gray-700">UI Preview</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <A2UIRenderer
              data={state.currentA2UIData}
              onAction={(action, context, values) => actions.dispatchA2UIAction(action, context, values)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
