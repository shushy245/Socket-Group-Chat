global.ResizeObserver = class FakeResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
};

// ci git action - runs "build-and-test" that runs with env variable "NODE_ENV=production" - this causes jest to fail with the following exception -
// "act(...) is not supported in production builds of React.
process.env.NODE_ENV = 'development';
