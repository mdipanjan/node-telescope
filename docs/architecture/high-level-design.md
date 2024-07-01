# Node-Telescope High-Level Design

This document outlines the high-level design of the Node-Telescope project.

For a detailed breakdown of the project's folder structure, please refer to the [Project Structure document](../project-structure.md).

## Architecture Diagram

```mermaid
graph TD
    subgraph "node-telescope-monorepo"
        A[Root Package]
        B[Lerna Config]
        C[Husky Config]
        
        subgraph "packages/node-telescope"
            D[Core Library]
            D1[Telescope Class]
            D2[Middleware]
            D3[Storage Interface]
            D4[MongoDB Storage]
            D5[Utilities]
        end
        
        subgraph "packages/node-telescope-frontend"
            H[Frontend Application]
            H1[React Components]
            H2[State Management]
            H3[API Integration]
        end
        
        subgraph "packages/examples"
            E[Class-Based Example]
            E1[Express Server]
            E2[Telescope Integration]
        end
    end
    
    F[npm Registry]
    G[External Applications]

    A --> B
    A --> C
    A --> D
    A --> E
    A --> H
    
    D --> D1
    D --> D2
    D --> D3
    D --> D4
    D --> D5
    
    H --> H1
    H --> H2
    H --> H3
    
    E --> E1
    E --> E2
    
    D --> F
    F --> G
    E -.-> D
    H -.-> D
```

## Components Description

1. **Root Package**: Represents the monorepo structure, managed by Lerna.
2. **Lerna Config**: Manages the monorepo and package relationships.
3. **Husky Config**: Handles git hooks for maintaining code quality.
4. **Core Library (node-telescope package)**:
   - Telescope Class: The main class that users interact with.
   - Middleware: Express middleware for capturing HTTP requests.
   - Storage Interface: Defines the contract for storage implementations.
   - MongoDB Storage: An implementation of the storage interface using MongoDB.
   - Utilities: Helper functions and shared code.
5. **Examples**:
   - Class-Based Example: Demonstrates how to use the library in a real application.
   - Express Server: A sample server setup.
   - Telescope Integration: Shows how to integrate node-telescope into an Express app.
6. **npm Registry**: Where the node-telescope package will be published.
7. **External Applications**: Represents potential users of the node-telescope package.

## Future Considerations

As the project evolves, we may update this diagram to include:
- Additional storage implementations
- More examples or use cases
- Frontend components for visualizing the collected data
- Integration with other services or tools
- New features or modules added to the core library