import { useEffect, useState, useCallback } from 'react';
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

export const useGCodeParser = ({ gcodeFile }: UseGCodeParserProps) => {
  const [toolPath, setToolPath] = useState<THREE.Line | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    return new THREE.Line(geometry, material);
  }, []);

  useEffect(() => {
    if (!gcodeFile) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const commands = parseGCode(content);
        const path = createToolPath(commands);

        // Cleanup previous path before setting new one
        cleanupToolPath(toolPath);
        setToolPath(path);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to parse G-code file');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };

    reader.readAsText(gcodeFile);

    // Cleanup on unmount or when gcodeFile changes
    return () => {
      cleanupToolPath(toolPath);
    };
  }, [gcodeFile, toolPath, cleanupToolPath, parseGCode, createToolPath]);

  return { toolPath, isLoading, error };
}; 