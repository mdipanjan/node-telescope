# Node Telescope Production Test Guide

## Purpose

The production test (prod-test) environment is designed to simulate how the node-telescope package will function when released and installed from npm. This setup allows developers to:

1. Test the package in a real-world scenario
2. Identify any issues that may occur during installation or usage
3. Verify that all features work correctly when the package is installed as a dependency

## Environment Setup

Before running the prod-test, you need to set up the correct environment variables. The prod-test uses a MongoDB database and requires specific configuration.

### Required Environment Variables

Create a `.env` file in the `packages/examples/prod-test` directory with the following variables:

```
DB_PASS=your_database_password
DB_USER=your_database_username
DB_NAME=your_database_name
DB_URI=your_mongodb_connection_uri
TEST_SERVER_PORT=4000
TELESCOPE_SERVER_PORT=4000
NODE_ENV=development
```

Replace `your_database_password`, `your_database_username`, `your_database_name`, and `your_mongodb_connection_uri` with your actual MongoDB credentials and connection details.

### Environment Variable Descriptions

- `DB_PASS`: The password for your MongoDB database.
- `DB_USER`: The username for your MongoDB database.
- `DB_NAME`: The name of the MongoDB database you're using for the prod-test.
- `DB_URI`: The full connection URI for your MongoDB instance.
- `TEST_SERVER_PORT`: The port on which the test server will run (default is 4000).
- `TELESCOPE_SERVER_PORT`: The port on which the Telescope dashboard will be available (default is 4000).
- `NODE_ENV`: The Node.js environment (set to 'development' for testing purposes).

### Setting Up the Environment

1. Create a new file named `.env` in the `packages/examples/prod-test` directory.
2. Copy the above environment variable template into this file.
3. Replace the placeholder values with your actual MongoDB credentials and preferred configuration.
4. Ensure that the `.env` file is included in your `.gitignore` to prevent sensitive information from being committed to the repository.

**Note**: If you're using a different database system or need to modify these variables, make sure to update the prod-test server code accordingly.

## Running the Production Test

To run the production test, follow these steps:

1. Navigate to the node-telescope package directory:

   ```
   cd packages/node-telescope
   ```

2. Run the prod-test script:
   ```
   npm run prod-test
   ```

This script performs the following actions:

1. Builds the node-telescope package
2. Cleans the prod-test environment
3. Packs the node-telescope package into a .tgz file
4. Installs the packed package in the prod-test environment
5. Starts the prod-test server

## What the Prod-Test Does

The prod-test:

1. Creates a production-like environment in `packages/examples/prod-test`
2. Installs the locally packed node-telescope package as a dependency
3. Runs a test server that uses node-telescope in a real-world scenario

This allows you to verify that:

- The package installs correctly
- All features of node-telescope work as expected when used as an installed package
- There are no unforeseen issues in a production-like setup

## Debugging

If you encounter any issues during the prod-test, you can use the following commands for debugging:

1. To see the contents of relevant directories:

   ```
   npm run debug:prod-test
   ```

2. To run each step of the process individually:
   ```
   npm run build
   npm run clean:prod-test
   npm run setup:prod-test
   npm run install:prod-test
   npm run start:prod-test
   ```

## After Running the Prod-Test

Once the prod-test server is running, you can:

1. Access the Node Telescope dashboard at `http://localhost:4000/telescope`
2. Test various features of node-telescope
3. Verify that logging, monitoring, and other functionalities work as expected

## Modifying the Prod-Test

If you need to modify the prod-test environment:

1. The prod-test server code is located in `packages/examples/prod-test`
2. After making changes, re-run the prod-test to verify your modifications

Remember to commit any changes to the prod-test environment along with your package changes to ensure consistent testing across the development team.

## Troubleshooting

If you encounter persistent issues:

1. Ensure all dependencies are installed: `npm install` in both `packages/node-telescope` and `packages/examples/prod-test`
2. Clear the npm cache: `npm cache clean --force`
3. Check for any error messages in the console output
4. Verify that you have the necessary permissions to create and modify files in the project directories

If problems persist, please open an issue in the project repository with details about the error you're experiencing.
