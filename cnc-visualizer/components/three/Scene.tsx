'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { useThreeSetup } from '../../hooks/useThreeSetup';
import { useGCodeParser } from '../../hooks/useGCodeParser';

interface SceneProps {
  stlFile: File | null;
  gcodeFile: File | null;
}

export const Scene: React.FC<SceneProps> = ({ stlFile, gcodeFile }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const { model, isLoading: modelLoading, error: modelError } = useThreeSetup({ stlFile });
  const { toolPath, isLoading: pathLoading, error: pathError } = useGCodeParser({ gcodeFile });

  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height, false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || !containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Initial resize to ensure correct dimensions
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [handleResize]);

  // Add/remove model to/from scene
  useEffect(() => {
    if (model && sceneRef.current) {
      sceneRef.current.add(model);
      return () => {
        sceneRef.current?.remove(model);
      };
    }
  }, [model]);

  // Add/remove tool path to/from scene
  useEffect(() => {
    if (toolPath && sceneRef.current) {
      sceneRef.current.add(toolPath);
      return () => {
        sceneRef.current?.remove(toolPath);
      };
    }
  }, [toolPath]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div ref={mountRef} className="absolute inset-0" />
      {(modelLoading || pathLoading) && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
      {(modelError || pathError) && (
        <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow">
          {modelError || pathError}
        </div>
      )}
    </div>
  );
}; 