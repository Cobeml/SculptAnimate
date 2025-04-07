import { useState } from 'react';
import { Scene } from './three/Scene';

export const CNCVisualizer: React.FC = () => {
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [gcodeFile, setGcodeFile] = useState<File | null>(null);

  const handleStlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.name.toLowerCase().endsWith('.stl')) {
      setStlFile(file);
    } else {
      alert('Please upload a valid STL file');
    }
  };

  const handleGcodeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.name.toLowerCase().endsWith('.gcode')) {
      setGcodeFile(file);
    } else {
      alert('Please upload a valid G-code file');
    }
  };

  const handleClearStl = () => setStlFile(null);
  const handleClearGcode = () => setGcodeFile(null);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gray-800 text-white py-4 px-6 shadow-lg z-10">
        <h1 className="text-2xl font-bold">CNC Path Visualizer</h1>
      </header>

      <main className="flex flex-1 min-h-0">
        <aside className="w-80 bg-white shadow-lg flex-shrink-0 overflow-y-auto border-r border-gray-200">
          <div className="p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Files</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label 
                    htmlFor="stl-upload" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    STL Model
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <input
                        id="stl-upload"
                        type="file"
                        accept=".stl"
                        onChange={handleStlUpload}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-gray-100 file:text-gray-700
                          hover:file:bg-gray-200
                          cursor-pointer"
                      />
                    </div>
                    {stlFile && (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span className="text-sm text-gray-600 truncate max-w-[180px]" title={stlFile.name}>
                          {stlFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearStl}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label 
                    htmlFor="gcode-upload" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    G-code Path
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <input
                        id="gcode-upload"
                        type="file"
                        accept=".gcode"
                        onChange={handleGcodeUpload}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-gray-100 file:text-gray-700
                          hover:file:bg-gray-200
                          cursor-pointer"
                      />
                    </div>
                    {gcodeFile && (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span className="text-sm text-gray-600 truncate max-w-[180px]" title={gcodeFile.name}>
                          {gcodeFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearGcode}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Visualization Status</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">STL Model</p>
                  <div className={`text-sm ${stlFile ? 'text-green-600' : 'text-gray-500'}`}>
                    {stlFile ? 'Model loaded' : 'No model uploaded'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">G-code Path</p>
                  <div className={`text-sm ${gcodeFile ? 'text-green-600' : 'text-gray-500'}`}>
                    {gcodeFile ? 'Path loaded' : 'No path uploaded'}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Controls</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>🖱️ Left mouse: Rotate view</p>
                <p>🖱️ Right mouse: Pan view</p>
                <p>🖱️ Mouse wheel: Zoom</p>
              </div>
            </section>
          </div>
        </aside>

        <div className="flex-1 relative min-w-0">
          <Scene stlFile={stlFile} gcodeFile={gcodeFile} />
        </div>
      </main>
    </div>
  );
}; 