# CNC Path Visualizer

This project is a web application that visualizes CNC tool paths on a 3D surface in real-time. It allows users to load a part geometry (STL format) and a tool path (G-code), then simulates the carving process dynamically. The minimal viable product (MVP) focuses on core functionality with a simple yet effective approach.

## Tech Stack

- **Frontend**: Next.js, React, Three.js
- **Package Manager**: Bun
- **Optional**: Postgres (not required for MVP)

## Prerequisites

- [Bun](https://bun.sh/) (or Node.js with npm)
- A code editor (e.g., VSCode)
- Basic understanding of React and 3D graphics

## Setup

1. **Initialize the Next.js Project**
   ```bash
   bun create next-app cnc-visualizer
   cd cnc-visualizer
   ```

2. **Install Dependencies**
   ```bash
   bun add three @types/three three-stdlib
   bun add gcode-parser
   ```

3. **Project Structure**
   ```
   cnc-visualizer/
   ├── components/
   │   └── CNCVisualizer.jsx
   ├── pages/
   │   └── index.js
   ├── public/
   │   └── models/
   │       └── block.stl
   ├── styles/
   └── README.md
   ```

## Building the Visualizer

### 1. Create the CNCVisualizer Component
- In `components/CNCVisualizer.jsx`, set up a Three.js scene with a camera, lighting, and renderer.
- Use React's `useEffect` to initialize and clean up the 3D scene.

### 2. Load and Display STL
- Use Three.js's `STLLoader` to load the part geometry from an STL file.
- Add the loaded mesh to the scene.

### 3. Parse and Visualize G-code
- Parse G-code using `gcode-parser` to extract tool path coordinates.
- Render the path as a red line in the 3D scene.

### 4. Real-time Simulation
- Animate the tool movement along the G-code path using a time-based loop.
- Update the scene continuously to reflect the carving progress.

## Example Implementation

In `components/CNCVisualizer.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import gcodeParser from 'gcode-parser';

export default function CNCVisualizer() {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Load STL
    const loader = new STLLoader();
    loader.load('/models/block.stl', (geometry) => {
      const material = new THREE.MeshPhongMaterial({ color: 0x555555 });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    });

    // Parse G-code
    const gcode = 'G1 X10 Y10 Z0\nG1 X20 Y20 Z-1';
    const parsedGcode = gcodeParser(gcode);
    const pathGeometry = new THREE.BufferGeometry();
    const positions = parsedGcode.map(cmd => [cmd.X || 0, cmd.Y || 0, cmd.Z || 0]);
    pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.flat(), 3));
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // Camera position
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div>
      <h1>CNC Path Visualizer</h1>
      <div ref={mountRef} style={{ width: '100vw', height: '80vh' }} />
    </div>
  );
}
```

Update `pages/index.js` to include the component:

```jsx
import CNCVisualizer from '../components/CNCVisualizer';

export default function Home() {
  return <CNCVisualizer />;
}
```

## Running the Project

1. **Start the Development Server**
   ```bash
   bun dev
   ```

2. **Access the App**
   - Visit `http://localhost:3000` in your browser.

## Future Enhancements

- Add file upload support for custom STL and G-code files.
- Implement voxel-based material removal simulation.
- Integrate Postgres for saving simulation states.
- Optimize performance for larger models.

This README provides a streamlined guide to build a real-time CNC path visualizer MVP using modern web technologies.