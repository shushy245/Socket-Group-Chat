module.exports = {
    clearMocks: true,
    preset: 'ts-jest',
    testMatch: ['<rootDir>/src/**/?(*.)+(spec|test|it).[jt]s?(x)'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.png$': '<rootDir>/__mocks__/image-mock.js',
        '\\.svg$': '<rootDir>/__mocks__/svg-mock.js',
        '^lodash-es$': 'lodash',
        '^~/(.*)$': '<rootDir>/src/$1',
        '^@chat-mvp/common/(.*)$': '<rootDir>/../common/src/$1',
    },
    globals: {
        // Injected by webpack's DefinePlugin, depending on NODE_ENV environment variable.
        IS_PRODUCTION: false,
        IS_CYPRESS: false,
    },
    transform: {
        '^.+\\.[tj]sx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.json',
                isolatedModules: true,
                useESM: false,
            },
        ],
    },
    transformIgnorePatterns: ['node_modules', 'signal-exit'],
    setupFiles: ['jest-canvas-mock', '<rootDir>/setupJestTests.ts'],
    testEnvironmentOptions: {
        url: 'http://localhost:3000/',
    },
    // Better cache and watch handling
    cache: true,
    cacheDirectory: '<rootDir>/node_modules/.cache/jest',
    watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
};
