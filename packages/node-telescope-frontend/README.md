# Node Telescope Frontend

This package contains the frontend application for Node Telescope, a powerful logging and monitoring solution for Node.js applications. The frontend provides a user-friendly interface for visualizing and analyzing the data collected by the Node Telescope core library.

## 📁 Project Structure

```
node-telescope-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ExceptionDetailComponent.tsx
│   │   ├── QueryDetailsComponent.tsx
│   │   ├── QueryList.tsx
│   │   └── ThemeToggle.tsx
│   ├── constants/
│   │   └── Constants.ts
│   ├── context/
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useEntryDetails.ts
│   │   └── useTelescopeEntries.ts
│   ├── layout/
│   │   └── Layout.tsx
│   ├── services/
│   ├── types/
│   │   ├── GeneralTypes.ts
│   │   └── TelescopeEventTypes.ts
│   ├── utility/
│   │   ├── color.ts
│   │   ├── time.ts
│   │   └── utility.ts
│   ├── views/
│   │   ├── ExceptionDetails.tsx
│   │   ├── Exceptions.tsx
│   │   ├── QueryDetails.tsx
│   │   ├── Queries.tsx
│   │   ├── RequestDetails.tsx
│   │   └── Requests.tsx
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── index.tsx
│   ├── logo.svg
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   └── setupTests.ts
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## 🚀 Getting Started

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:

   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## 🧩 Key Components

- `ExceptionDetailComponent`: Displays detailed information about exceptions.
- `QueryDetailsComponent`: Shows details of database queries.
- `QueryList`: Renders a list of database queries.
- `ThemeToggle`: Allows users to switch between light and dark themes.

## 🪝 Custom Hooks

- `useEntryDetails`: Hook for fetching and managing entry details.
- `useTelescopeEntries`: Hook for fetching and managing Telescope entries.

## 🎨 Theming

The application supports both light and dark themes. The theme can be toggled using the `ThemeToggle` component, and the current theme is managed through the `ThemeContext`.

## 📊 Views

- `Exceptions`: Displays a list of exceptions and their details.
- `Queries`: Shows a list of database queries and their performance metrics.
- `Requests`: Presents a list of HTTP requests and their details.

## 🛠 Utility Functions

- `color.ts`: Contains functions for managing colors, including status color coding.
- `time.ts`: Provides time-related utility functions.
- `utility.ts`: General utility functions used across the application.

## 📝 Type Definitions

- `GeneralTypes.ts`: Contains general type definitions used throughout the application.
- `TelescopeEventTypes.ts`: Defines types related to Telescope events.

## 🧪 Testing

Run tests using:

```
npm test
```

## 🤝 Contributing

Please read the [CONTRIBUTING.md](../../CONTRIBUTING.md) file in the root of the monorepo for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file in the root of the monorepo for details.
