# From the root of our monorepo
npm run clean  # This should run lerna clean and remove node_modules
rm -rf packages/*/dist  # Remove all dist directories
npm install  # Reinstall all dependencies
npm run bootstrap  # This should run lerna bootstrap to link local packages

# Build the core package
cd packages/node-telescope
npm run build

# Return to the root
cd ../..

# Relink everything
npm run bootstrap

# Go to the example project
cd packages/examples/class-based
npm install  # Ensure all dependencies are installed
