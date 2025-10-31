import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    css: {
        modules: {
            localsConvention: 'camelCase',
        },
    },
    server: {
        port: 5173,
        host: true,
    },
    resolve: {
        alias: {
            '@chat-mvp/common': path.resolve(__dirname, '../common/src'),
        },
    },
});
