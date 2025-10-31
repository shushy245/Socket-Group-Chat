module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    clearMocks: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/server.ts'],
    moduleNameMapper: {
        '^~/models/(.*)$': '<rootDir>/src/models/$1',
        '^~/store/(.*)$': '<rootDir>/src/store/$1',
        '^~/utils/(.*)$': '<rootDir>/src/utils/$1',
    },
};
