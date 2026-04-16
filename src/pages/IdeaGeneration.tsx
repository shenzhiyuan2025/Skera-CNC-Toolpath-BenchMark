import React, { useState } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Stage, Grid } from '@react-three/drei';
import { Bot, RotateCw, Scaling, Box, Send, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const STYLES = ['Low Poly', 'Realistic', 'Voxel'];

export default function IdeaGeneration() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Low Poly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<number[]>([1, 2, 3]);
  const [selectedVariant, setSelectedVariant] = useState(2);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000); // Mock delay
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#1E1E1E] text-white overflow-hidden">
      {/* Left Panel - AI Interaction */}
      <div className="w-1/3 min-w-[320px] max-w-[400px] p-6 border-r border-white/10 flex flex-col gap-6 z-10 bg-[#1E1E1E]">
        {/* Robot Assistant */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>
          <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-lg">
            <p className="text-sm text-gray-200">Describe it, I'll build it.</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Military sand table game board with tanks and planes..."
              className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
            />
          </div>

          {/* Style Chips */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedStyle === style
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className={`mt-auto w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 ${
              !prompt || isGenerating
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate 3D
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Center - 3D Canvas */}
      <div className="flex-1 relative bg-[#121212] flex items-center justify-center">
        <div className="absolute top-4 left-4 z-10">
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
             <span className="text-xs text-blue-400 font-medium">AI Generate Model</span>
          </div>
        </div>

        {/* 3D Canvas Placeholder */}
        <div className="text-center text-gray-500">
            <Box className="w-24 h-24 mx-auto mb-4 opacity-20" />
            <p>3D Preview Unavailable</p>
            <p className="text-xs opacity-60 mt-2">Dependencies missing: @react-three/fiber</p>
        </div>

        {/* 
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
          <color attach="background" args={['#121212']} />
          <Stage environment="city" intensity={0.5}>
            <mesh>
              <boxGeometry args={[2, 0.2, 2]} />
              <meshStandardMaterial color="#e2c499" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
               <boxGeometry args={[0.5, 0.5, 0.5]} />
               <meshStandardMaterial color="#888" />
            </mesh>
          </Stage>
          <Grid infiniteGrid fadeDistance={30} sectionColor="#333" cellColor="#222" />
          <OrbitControls makeDefault />
        </Canvas>
        */}

        {/* Bottom Control Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-[#1E1E1E]/90 backdrop-blur border border-white/10 p-2 rounded-2xl shadow-2xl">
          <ControlButton icon={<RotateCw className="w-4 h-4" />} label="Rotate" />
          <ControlButton icon={<Scaling className="w-4 h-4" />} label="Scale" />
          <ControlButton icon={<Box className="w-4 h-4" />} label="Wireframe" />
        </div>
      </div>

      {/* Right Sidebar - Variants */}
      <div className="w-24 border-l border-white/10 flex flex-col items-center py-6 gap-4 bg-[#1E1E1E] z-10">
        <span className="text-xs text-gray-500 font-medium">Variants</span>
        {variants.map((v) => (
          <button
            key={v}
            onClick={() => setSelectedVariant(v)}
            className={`w-16 h-16 rounded-xl border-2 relative overflow-hidden transition-all group ${
              selectedVariant === v
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-bold text-xl">
              {v}
            </div>
            {selectedVariant === v && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ControlButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center justify-center w-16 h-14 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors gap-1">
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
