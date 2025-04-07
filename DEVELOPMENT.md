# Development Guidelines for CNC Path Visualizer

This document outlines development best practices, workflow, and guidelines for the CNC Path Visualizer project.

## Development Workflow

### 1. Project Setup and Structure
- Follow the project structure outlined in README.md
- Keep components modular and focused on single responsibilities
- Use TypeScript for better type safety and developer experience
- Implement proper error boundaries for 3D rendering components

### 2. Code Organization
```
cnc-visualizer/
├── components/
│   ├── three/              # Three.js specific components
│   │   ├── Scene.tsx
│   │   ├── Camera.tsx
│   │   └── Controls.tsx
│   ├── ui/                 # UI components
│   │   ├── FileUpload.tsx
│   │   └── Controls.tsx
│   └── CNCVisualizer.tsx   # Main component
├── hooks/                  # Custom React hooks
│   ├── useThreeSetup.ts
│   └── useGCodeParser.ts
├── utils/                  # Utility functions
│   ├── gcode.ts
│   └── geometry.ts
├── types/                  # TypeScript type definitions
└── pages/
    └── index.tsx
```

### 3. Best Practices

#### Three.js Implementation
- Initialize Three.js scene in a separate custom hook
- Use `useRef` for Three.js objects that need to persist between renders
- Implement proper cleanup in useEffect to prevent memory leaks
- Use `requestAnimationFrame` for animations with proper cleanup
- Implement proper error handling for model loading

#### Performance Optimization
- Implement level of detail (LOD) for complex models
- Use object pooling for frequently created/destroyed objects
- Implement proper frustum culling
- Use WebGL2 when possible for better performance
- Implement proper garbage collection for Three.js objects

#### State Management
- Use React Context for global state (e.g., visualization settings)
- Implement proper loading states for async operations
- Use proper error boundaries for 3D rendering failures

### 4. Development Process

#### Feature Implementation Order
1. Basic Three.js scene setup
2. STL model loading and display
3. G-code parsing and visualization
4. Real-time simulation
5. UI controls and file upload
6. Performance optimizations

#### Testing Strategy
- Implement unit tests for utility functions
- Add integration tests for component interactions
- Test Three.js scene setup and cleanup
- Test file upload and parsing functionality
- Test performance with large models

#### Code Quality
- Use ESLint with TypeScript configuration
- Implement Prettier for consistent code formatting
- Add proper JSDoc comments for complex functions
- Use meaningful variable and function names
- Implement proper error handling and logging

### 5. Version Control

#### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`

#### Commit Messages
- Use conventional commits format
- Include clear descriptions of changes
- Reference issue numbers when applicable

### 6. Documentation

#### Code Documentation
- Document complex algorithms and calculations
- Add JSDoc comments for public functions
- Include examples for complex component usage
- Document Three.js scene setup and configuration

#### API Documentation
- Document component props and their types
- Include usage examples for each component
- Document expected file formats and limitations

### 7. Performance Monitoring

#### Metrics to Track
- FPS (Frames Per Second)
- Memory usage
- Model loading time
- G-code parsing performance
- Scene rendering performance

#### Optimization Targets
- Maintain 60 FPS for smooth animation
- Keep memory usage under 500MB
- Load models under 2 seconds
- Parse G-code under 1 second for typical files

### 8. Error Handling

#### Error Types to Handle
- Model loading failures
- G-code parsing errors
- WebGL context loss
- Memory allocation failures
- File format validation

#### Error Recovery
- Implement graceful degradation
- Provide user feedback for errors
- Allow retry mechanisms for failed operations
- Maintain scene stability during errors

### 9. Security Considerations

#### File Upload
- Validate file types and sizes
- Sanitize file names
- Implement proper CORS policies
- Scan for malicious content

#### Data Handling
- Don't store sensitive information
- Implement proper data cleanup
- Use secure file handling practices

### 10. Accessibility

#### Requirements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Proper ARIA labels
- Focus management

### 11. Browser Compatibility

#### Supported Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

#### Fallbacks
- WebGL detection and fallback
- Feature detection for modern APIs
- Polyfills when necessary

### 12. Deployment

#### Build Process
- Optimize assets
- Minify code
- Generate source maps
- Create production builds

#### Environment Configuration
- Use environment variables
- Configure proper CORS settings
- Set up proper caching
- Configure proper logging

This development guide should be updated as the project evolves and new requirements or best practices are identified. 