import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { examplesMap } from '../data/a2uiExamples';
import { ArrowLeft, Play } from 'lucide-react';

export const Examples: React.FC = () => {
  const navigate = useNavigate();
  const { actions } = useApp();

  const handleSelectExample = (key: string) => {
    actions.loadExample(key);
    navigate('/a2ui');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/a2ui')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">A2UI Example Library</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(examplesMap).map(([key, example]) => (
            <div 
              key={key}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleSelectExample(key)}
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Placeholder or preview image logic could go here */}
                <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                <Play className="w-12 h-12 text-blue-600 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {example.metadata?.title || key}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {example.metadata?.description || 'No description available'}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Try this example &rarr;
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
