import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// z-frontend-common — lead 008 §1-§16 前端开发规范唯一承载仓。
// 产物：dist/index.js（ESM 单文件），react/antd/@ant-design/icons/react-router-dom/axios
// 全部 external（消费方自己的 node_modules，杜绝双实例）。
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: {
                'index': path.resolve(__dirname, 'src/index.js'),
                'ui': path.resolve(__dirname, 'src/components/ui/index.js'),
                'ui-echarts': path.resolve(__dirname, 'src/components/ui/echarts.js'),
            },
            formats: ['es'],
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            // echarts 用的是深层子路径 (echarts/core, echarts/charts, echarts/components,
            // echarts/renderers), 字符串数组匹配不到前缀, 必须用函数式判定。
            external: (id) =>
                id === 'react' ||
                id === 'react-dom' ||
                id === 'react-dom/client' ||
                id === 'react/jsx-runtime' ||
                id === 'react-router-dom' ||
                id === 'antd' ||
                id === '@ant-design/icons' ||
                id === 'axios' ||
                id === 'echarts' ||
                id.startsWith('echarts/'),
        },
    },
});
