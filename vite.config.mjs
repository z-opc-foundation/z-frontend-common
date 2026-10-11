import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// z-frontend-common — lead 008 §1-§16 前端开发规范唯一承载仓。
// 产物：dist/index.js（ESM 单文件），react/antd/@ant-design/icons/react-router-dom 全部
// external（消费方 suit 自己的 node_modules，杜绝双实例）；axios 走 dependencies 内联。
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.js'),
            formats: ['es'],
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react-dom/client',
                'react/jsx-runtime',
                'react-router-dom',
                'antd',
                '@ant-design/icons',
            ],
        },
    },
});
