module.exports = {
  transformIgnorePatterns: [
    '/node_modules/(?!react-syntax-highlighter).+\\.js$',
    'node_modules/(?!axios)',
    'node_modules/(?!antd)/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    axios: 'axios/dist/node/axios.cjs',
  },
};
