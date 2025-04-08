'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { useThreeSetup } from '../../hooks/useThreeSetup';
import { useGCodeParser } from '../../hooks/useGCodeParser';
import { CSS2DRenderer, CSS2DObject } from 'three-stdlib';

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
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  
  // Refs for managing scene objects
  const currentModelMeshRef = useRef<THREE.Mesh | null>(null);
  const toolPathRef = useRef<THREE.Line | null>(null);
  const completePathPointsRef = useRef<THREE.Vector3[]>([]);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animationDuration = 5000; // 5 seconds for full path
  const animationDurationRef = useRef(animationDuration);

  // Hooks now handle default loading
  const { model, isLoading: modelLoading, error: modelError } = useThreeSetup({ stlFile });
  const { toolPath, isLoading: pathLoading, error: pathError } = useGCodeParser({ gcodeFile });

  // --- Utility Functions ---
  const centerGeometryAtOrigin = useCallback((geometry: THREE.BufferGeometry) => {
    geometry.computeBoundingBox();
    if (!geometry.boundingBox) return geometry;
    
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    return geometry;
  }, []);

  // --- Path Animation Logic ---
  const updatePathAnimation = useCallback((progressValue: number) => {
    if (completePathPointsRef.current.length === 0 || !sceneRef.current) return;
    
    // Remove previous animation line
    if (toolPathRef.current) {
      sceneRef.current.remove(toolPathRef.current);
      toolPathRef.current.geometry.dispose();
    }
    
    const totalPoints = completePathPointsRef.current.length;
    const pointsToShow = progressValue <= 0 ? 0 : 
                          progressValue >= 1 ? totalPoints :
                          Math.max(2, Math.ceil(totalPoints * progressValue));
    
    // Create visible points array from our complete path
    const visiblePoints = completePathPointsRef.current.slice(0, pointsToShow);
    
    // Create new geometry for the visible path
    const geometry = new THREE.BufferGeometry().setFromPoints(visiblePoints);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff0000,
      linewidth: 2
    });
    
    // Create and add the visible path line
    const pathLine = new THREE.Line(geometry, material);
    // Offset slightly in the Z direction (up) to ensure visibility above the model
    pathLine.position.z = 0.5; 
    
    toolPathRef.current = pathLine;
    sceneRef.current.add(pathLine);
  }, []);

  // --- Animation Handlers ---
  const animate = useCallback((currentTime: number) => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      return;
    }
    
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Update progress based on time delta
    const newProgress = Math.min(1, progress + (deltaTime / animationDurationRef.current));
    
    // Use a function to set state based on previous state to avoid React batching issues
    setProgress((prevProgress) => newProgress);
    updatePathAnimation(newProgress);
    
    if (newProgress >= 1) {
      setIsPlaying(false);
      lastTimeRef.current = 0;
    } 
    
    // Always request next frame if function is called
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [isPlaying, progress, updatePathAnimation]);

  useEffect(() => {
    // Set up animation loop when isPlaying changes
    if (isPlaying) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // Cancel animation when paused
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isPlaying, animate]);

  const togglePlay = useCallback(() => {
    if (!isPlaying) {
      // Start playing
      if (progress >= 1) {
        // If at end, restart from beginning
        setProgress(0);
        updatePathAnimation(0);
      }
      setIsPlaying(true);
    } else {
      // Pause animation
      setIsPlaying(false);
    }
  }, [isPlaying, progress, updatePathAnimation]);

  const handleReset = useCallback(() => {
    // Cancel any ongoing animation
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    setIsPlaying(false);
    setProgress(0);
    lastTimeRef.current = 0;
    updatePathAnimation(0);
  }, [updatePathAnimation]);

  const handleProgressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number.parseFloat(event.target.value);
    setProgress(newProgress);
    updatePathAnimation(newProgress);
    
    if (newProgress >= 1) {
      setIsPlaying(false);
    }
  }, [updatePathAnimation]);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    
    // Also resize label renderer
    labelRendererRef.current?.setSize(width, height);
  }, []);

  // --- Scene Setup Effect ---
  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || !containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    // Position camera for a clear view with Z as up
    camera.position.set(100, -100, 80);
    camera.up.set(0, 0, 1); // Set Z as the up vector
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add CSS2D renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    mountRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controls.target.set(0, 0, 0);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    // Update camera's up vector instead since OrbitControls uses the camera's up vector
    camera.up.set(0, 0, 1);
    controls.update();
    controlsRef.current = controls;

    // Improved lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);
    
    // Add a softer fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-100, 100, -100);
    scene.add(fillLight);

    const gridSize = 200;
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0xdddddd);
    // Rotate grid to XY plane (with Z up)
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    // Add axis helper to visualize the coordinate system
    const axisHelper = new THREE.AxesHelper(50);
    scene.add(axisHelper);

    // Add axis labels
    const createAxisLabel = (text: string, position: THREE.Vector3) => {
      const div = document.createElement('div');
      div.className = 'axis-label';
      div.textContent = text;
      div.style.color = text === 'X' ? 'red' : text === 'Y' ? 'green' : 'blue';
      div.style.fontWeight = 'bold';
      div.style.fontSize = '16px';
      div.style.textShadow = '0px 0px 3px white';
      const label = new CSS2DObject(div);
      label.position.copy(position);
      scene.add(label);
      return label;
    };

    createAxisLabel('X', new THREE.Vector3(60, 0, 0));
    createAxisLabel('Y', new THREE.Vector3(0, 60, 0));
    createAxisLabel('Z', new THREE.Vector3(0, 0, 60));

    window.addEventListener('resize', handleResize);

    // Main render loop (separated from animation)
    const renderLoop = () => {
      requestAnimationFrame(renderLoop);
      controlsRef.current?.update();
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        labelRendererRef.current?.render(sceneRef.current, cameraRef.current);
      }
    };
    requestAnimationFrame(renderLoop);

    handleResize(); // Initial size calculation

    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cancel animation frame if active
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (labelRendererRef.current && mountRef.current) {
        mountRef.current.removeChild(labelRendererRef.current.domElement);
      }
      
      // Clean up resources
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, [handleResize]); // Only core setup dependencies

  // --- Model Management Effect ---
  useEffect(() => {
    const currentScene = sceneRef.current;
    if (!currentScene || !model) return; // Wait for scene and model

    // Remove previous model if it exists
    if (currentModelMeshRef.current) {
      currentScene.remove(currentModelMeshRef.current);
      currentModelMeshRef.current = null;
    }

    // Create a clone to avoid modifying the original
    const modelClone = model.clone();
    
    // Center and add the model
    modelClone.geometry = centerGeometryAtOrigin(modelClone.geometry);
    modelClone.position.set(0, 0, 0);
    
    // Orient the model correctly for Z-up coordinate system
    // No rotation needed since Z is already up by default
    
    // Enable shadows on the model
    modelClone.castShadow = true;
    modelClone.receiveShadow = true;
    
    currentScene.add(modelClone);
    currentModelMeshRef.current = modelClone;

    // Cleanup function
    return () => {
      if (currentModelMeshRef.current && currentScene) {
        currentScene.remove(currentModelMeshRef.current);
        currentModelMeshRef.current = null;
      }
    };
  }, [model, centerGeometryAtOrigin]); // Depend on model changes

  // --- Path Management Effect ---
  useEffect(() => {
    // Reset animation state when path changes
    handleReset();
    
    if (!toolPath || !sceneRef.current) return;

    // Extract path points from the geometry
    const extractPathPoints = () => {
      // Create a clone to avoid modifying the original
      const geometry = toolPath.geometry.clone();
      centerGeometryAtOrigin(geometry);
      
      // Extract points from the buffer geometry
      const positionAttribute = geometry.getAttribute('position');
      const points: THREE.Vector3[] = [];
      
      for (let i = 0; i < positionAttribute.count; i++) {
        // For standard CNC operations, we get x,y,z directly
        // No need to swap coordinates since we're using standard XYZ
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      return points;
    };

    completePathPointsRef.current = extractPathPoints();
    
    // Create initial empty path
    updatePathAnimation(0);
    
    // Clean up on unmount or when the path changes
    return () => {
      if (toolPathRef.current && sceneRef.current) {
        sceneRef.current.remove(toolPathRef.current);
        toolPathRef.current.geometry.dispose();
        toolPathRef.current = null;
      }
      
      completePathPointsRef.current = [];
    };
  }, [toolPath, updatePathAnimation, handleReset, centerGeometryAtOrigin]);

  // --- JSX Rendering ---
  return (
    <div ref={containerRef} className="absolute inset-0">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Animation Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
        >
          ⟲ Reset
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={handleProgressChange}
          className="w-64"
        />
        <span className="text-sm text-gray-600">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* File Status */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className={`px-4 py-2 rounded shadow ${stlFile ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
          <span className="font-medium">STL Model:</span>{' '}
          <span className="text-sm">
            {stlFile ? stlFile.name : 'Using default model'}
          </span>
        </div>
        <div className={`px-4 py-2 rounded shadow ${gcodeFile ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
          <span className="font-medium">G-code Path:</span>{' '}
          <span className="text-sm">
            {gcodeFile ? gcodeFile.name : 'Using default path'}
          </span>
        </div>
      </div>

      {/* Loading and Error States */}
      {(modelLoading || pathLoading) && (
        <div className="absolute top-24 right-4 bg-blue-100 px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
      {(modelError || pathError) && (
        <div className="absolute top-24 right-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow">
          {modelError || pathError}
        </div>
      )}
    </div>
  );
}; 