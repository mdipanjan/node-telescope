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
│   │   │   │   ├── telescope.ts
│   │   │   │   ├── telescope-options.ts
│   │   │   │   └── telescope-types.ts
│   │   │   ├── middleware/
│   │   │   │   └── telescope-middleware.ts
│   │   │   ├── storage/
│   │   │   │   ├── storage-interface.ts
│   │   │   │   ├── mongo/
│   │   │   │   │   └── mongo-storage.ts
│   │   │   │   └── pg/
│   │   │   │       └── pg-storage.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   └── async-context.ts
│   │   │   ├── query-logging/
│   │   │   │   ├── telescope-query-logging.ts
│   │   │   │   ├── telescope-mongo-query-logging.ts
│   │   │   │   └── telescope-postgres-query-logging.ts
│   │   │   ├── exception-handling/
│   │   │   │   └── telescope-exception-handling.ts
│   │   │   ├── file-operations/
│   │   │   │   └── telescope-file-operations.ts
│   │   │   └── socket/
│   │   │       └── telescope-socket-setup.ts
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
│       ├── class-based/
│       │   ├── src/
│       │   │   └── index.ts
│       │   ├── package.json
│       │   └── tsconfig.json
│       └── class-based-pg/
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
- `/packages`: Contains all the packages managed in this monorepo
  - `/node-telescope`: The main library package
    - `/src`: Source code for the library
      - `/core`: Core functionality of the library
      - `/middleware`: Express middleware for request tracking
      - `/storage`: Storage implementations and interfaces
      - `/utils`: Utility functions and helpers
      - `/query-logging`: Query logging functionality
      - `/exception-handling`: Exception handling and logging
      - `/file-operations`: File-related operations
      - `/socket`: WebSocket setup and management
    - `/test`: Unit and integration tests
  - `/node-telescope-frontend`: The frontend application for visualizing data
  - `/examples`: Example projects demonstrating library usage
    - `/class-based`: A MongoDB-based implementation example
    - `/class-based-pg`: A PostgreSQL-based implementation example
- `lerna.json`: Lerna configuration for managing the monorepo
- `package.json`: Root package configuration

## Notes

- Each package has its own `package.json` and `tsconfig.json` for package-specific configurations.
- The `node-telescope-frontend` package provides a user interface for viewing and analyzing the data collected by the `node-telescope` library.
- The examples demonstrate integration with different database systems (MongoDB and PostgreSQL).
