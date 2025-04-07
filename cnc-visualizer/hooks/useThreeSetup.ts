import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

interface UseThreeSetupProps {
  stlFile: File | null;
}

export const useThreeSetup = ({ stlFile }: UseThreeSetupProps) => {
  const [model, setModel] = useState<THREE.Mesh | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function for the model
  const cleanupModel = useCallback((modelToCleanup: THREE.Mesh | null) => {
    if (modelToCleanup) {
      modelToCleanup.geometry.dispose();
      (modelToCleanup.material as THREE.Material).dispose();
    }
  }, []);

  useEffect(() => {
    if (!stlFile) return;

    setIsLoading(true);
    setError(null);

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const geometry = loader.parse(event.target?.result as ArrayBuffer);
        const material = new THREE.MeshPhongMaterial({
          color: 0xaaaaaa,
          specular: 0x111111,
          shininess: 200,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.set(0.1, 0.1, 0.1);

        // Center the model
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
          const center = new THREE.Vector3();
          boundingBox.getCenter(center);
          mesh.position.sub(center);
        }

        // Cleanup previous model before setting new one
        cleanupModel(model);
        setModel(mesh);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load STL file');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(stlFile);

    // Cleanup on unmount or when stlFile changes
    return () => {
      cleanupModel(model);
    };
  }, [stlFile, model, cleanupModel]);

  return { model, isLoading, error };
}; 