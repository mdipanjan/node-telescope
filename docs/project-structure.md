# Node-Telescope Project Structure

This document outlines the folder structure of the Node-Telescope project.

```
node-telescope/
├── docs/
│   ├── architecture/
│   │   └── high-level-design.md
│   └── project-structure.md
├── packages/
│   ├── node-telescope/
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   └── telescope.ts
│   │   │   ├── middleware/
│   │   │   │   └── telescope-middleware.ts
│   │   │   ├── storage/
│   │   │   │   ├── storage-interface.ts
│   │   │   │   └── mongo-storage.ts
│   │   │   └── utils/
│   │   │       └── logger.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── node-telescope-frontend/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── App.tsx
│   │   │   └── index.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── examples/
│       └── class-based/
│           ├── src/
│           │   └── index.ts
│           ├── package.json
│           └── tsconfig.json
├── .gitignore
├── lerna.json
├── package.json
└── README.md
```

## Key Directories and Files

- `/docs`: Project documentation
  - `/architecture`: Contains architectural diagrams and explanations
  - `project-structure.md`: This file, describing the project layout
- `/packages`: Contains all the packages managed in this monorepo
  - `/node-telescope`: The main library package
    - `/src`: Source code for the library
      - `/core`: Core functionality of the library
      - `/middleware`: Express middleware for request tracking
      - `/storage`: Storage implementations and interfaces
      - `/utils`: Utility functions and helpers
    - `/test`: Unit and integration tests
  - `/node-telescope-frontend`: The frontend application for visualizing data
    - `/public`: Public assets for the frontend
    - `/src`: Source code for the frontend
      - `/components`: React components
      - `App.tsx`: Main React application component
      - `index.tsx`: Entry point for the React application
  - `/examples`: Example projects demonstrating library usage
    - `/class-based`: A class-based implementation example
- `lerna.json`: Lerna configuration for managing the monorepo
- `package.json`: Root package configuration

## Notes

- The `dist` directory in `packages/node-telescope` (not shown above) is generated during the build process and contains compiled JavaScript files and type declarations.
- Each package has its own `package.json` and `tsconfig.json` for package-specific configurations.
- The `node-telescope-frontend` package is a React application that provides a user interface for viewing and analyzing the data collected by the `node-telescope` library.