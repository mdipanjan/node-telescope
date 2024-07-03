# From the root of our monorepo
#### This should run lerna clean and remove node_modules
```
npm run clean  
```
#### Remove all dist directories

```
rm -rf packages/*/dist  
```
 #### Reinstall all dependencies

```
npm install 
```
#### This should run lerna bootstrap to link local packages

```
npm run bootstrap  
```

# Build the core package
```
cd packages/node-telescope
npm run build
```

# Return to the root
```
cd ../..
```

# Relink everything
```
npm run bootstrap
```

# Go to the example project
```
cd packages/examples/class-based
npm install  
```
