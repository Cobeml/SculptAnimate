import { useEffect, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

interface GCodeCommand {
  type: string;
  x?: number;
  y?: number;
  z?: number;
}

interface UseGCodeParserProps {
  gcodeFile: File | null;
}

// Default G-code path
const DEFAULT_GCODE_PATH = '/models/test.gcode';

export const useGCodeParser = ({ gcodeFile }: UseGCodeParserProps) => {
  const [toolPath, setToolPath] = useState<THREE.Line | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track toolPath for cleanup
  const toolPathRef = useRef<THREE.Line | null>(null);

  // Update ref when toolPath changes
  useEffect(() => {
    toolPathRef.current = toolPath;
  }, [toolPath]);

  // Cleanup function for the tool path
  const cleanupToolPath = useCallback((path: THREE.Line | null) => {
    if (path) {
      path.geometry.dispose();
      (path.material as THREE.Material).dispose();
    }
  }, []);

  const parseGCode = useCallback((content: string): GCodeCommand[] => {
    const commands: GCodeCommand[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith(';')) continue;

      const command: GCodeCommand = { type: '' };
      const parts = trimmedLine.split(' ');

      for (const part of parts) {
        const code = part.charAt(0).toUpperCase();
        const value = Number.parseFloat(part.slice(1));

        if (code === 'G') {
          command.type = part;
        } else if (!Number.isNaN(value)) {
          switch (code) {
            case 'X':
              command.x = value;
              break;
            case 'Y':
              command.y = value;
              break;
            case 'Z':
              command.z = value;
              break;
          }
        }
      }

      if (command.type && (command.x !== undefined || command.y !== undefined || command.z !== undefined)) {
        commands.push(command);
      }
    }

    return commands;
  }, []);

  const createToolPath = useCallback((commands: GCodeCommand[]): THREE.Line => {
    const points: THREE.Vector3[] = [];
    let currentPosition = new THREE.Vector3(0, 0, 0);

    for (const command of commands) {
      if (command.type.startsWith('G0') || command.type.startsWith('G1')) {
        const newPosition = currentPosition.clone();
        if (command.x !== undefined) newPosition.x = command.x;
        if (command.y !== undefined) newPosition.y = command.y;
        if (command.z !== undefined) newPosition.z = command.z;

        points.push(currentPosition.clone());
        points.push(newPosition.clone());
        currentPosition = newPosition;
      }
    }

    // Ensure we have at least 2 points for a valid line
    if (points.length < 2) {
      // Create a small default path if no valid path exists
      points.push(new THREE.Vector3(-10, 0, 0));
      points.push(new THREE.Vector3(10, 0, 0));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff0000, 
      linewidth: 2 
    });
    return new THREE.Line(geometry, material);
  }, []);

  useEffect(() => {
    // Use ref to get previous path for cleanup
    const previousPath = toolPathRef.current;
    
    const loadPath = async () => {
      setIsLoading(true);
      setError(null);
      setToolPath(null); // Clear current path

      try {
        let content: string;
        if (gcodeFile) {
          // Load from uploaded file
          content = await gcodeFile.text();
        } else {
          // Load default file
          const response = await fetch(DEFAULT_GCODE_PATH);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          content = await response.text();
        }

        const commands = parseGCode(content);
        const path = createToolPath(commands);

        // Cleanup previous path *after* loading/parsing succeeds
        cleanupToolPath(previousPath);
        setToolPath(path);
        setError(null);
        
      } catch (err) {
        console.error("Error loading/parsing G-code:", err);
        setError(`Failed to load G-code: ${err instanceof Error ? err.message : 'Unknown error'}`);
        cleanupToolPath(previousPath); // Cleanup if loading fails
        setToolPath(null); // Ensure path is null on error
      } finally {
        setIsLoading(false); // Always stop loading
      }
    };

    loadPath();

    // Return cleanup for the path active during this effect run
    return () => {
      cleanupToolPath(previousPath);
    };
  }, [gcodeFile, cleanupToolPath, parseGCode, createToolPath]);

  return { toolPath, isLoading, error };
}; 