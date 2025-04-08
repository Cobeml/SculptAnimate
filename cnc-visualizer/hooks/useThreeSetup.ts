import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

interface UseThreeSetupProps {
  stlFile: File | null;
}

// Default model path
const DEFAULT_STL_PATH = '/models/dragon.stl';

export const useThreeSetup = ({ stlFile }: UseThreeSetupProps) => {
  const [model, setModel] = useState<THREE.Mesh | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store model in ref to avoid dependency cycle
  const modelRef = useRef<THREE.Mesh | null>(null);

  // Cleanup function for the model
  const cleanupModel = useCallback((modelToCleanup: THREE.Mesh | null) => {
    if (modelToCleanup) {
      modelToCleanup.geometry.dispose();
      if (Array.isArray(modelToCleanup.material)) {
        for (const mat of modelToCleanup.material) {
          mat.dispose();
        }
      } else {
        (modelToCleanup.material as THREE.Material).dispose();
      }
    }
  }, []);

  useEffect(() => {
    // Update ref when model changes
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    // Use ref to get previous model state
    const previousModel = modelRef.current;
    
    const loadModel = async () => {
      setIsLoading(true);
      setError(null);
      setModel(null); // Clear current model

      try {
        const loader = new STLLoader();
        let geometry: THREE.BufferGeometry;

        if (stlFile) {
          // Load from uploaded file
          const arrayBuffer = await stlFile.arrayBuffer();
          geometry = loader.parse(arrayBuffer);
        } else {
          // Load default file
          geometry = await loader.loadAsync(DEFAULT_STL_PATH);
        }
        
        const material = new THREE.MeshPhongMaterial({
          color: 0xaaaaaa,
          specular: 0x111111,
          shininess: 200,
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Cleanup previous model *after* loading/parsing is successful
        cleanupModel(previousModel);
        setModel(mesh);
        setError(null); 

      } catch (err) {
        console.error("Error loading STL:", err);
        setError(`Failed to load STL: ${err instanceof Error ? err.message : 'Unknown error'}`);
        cleanupModel(previousModel); // Cleanup if loading fails
        setModel(null); // Ensure model is null on error
      } finally {
        setIsLoading(false); // Always stop loading
      }
    };

    loadModel();

    // Return cleanup function
    return () => {
      cleanupModel(previousModel);
    };
  }, [stlFile, cleanupModel]); // Removed model dependency

  return { model, isLoading, error };
}; 