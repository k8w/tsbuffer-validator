import dts from "rollup-plugin-dts";
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default [
    {
        input: './index.ts',
        output: [{
            format: 'cjs',
            file: './dist/index.cjs',
        }],
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: "esnext"
                    }
                }
            }),
            terser({
                mangle: true,
                format: {
                    comments: false
                }
            })
        ],
        external: ['tslib']
    },
    {
        input: './index.ts',
        output: [{
            format: 'es',
            file: './dist/index.mjs'
        }],
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'es6',
                        module: "esnext"
                    }
                }
            }),
            terser({
                mangle: {
                    properties: {
                        regex: /^_/
                    }
                },
                format: {
                    comments: false
                }
            })
        ],
        external: ['tslib']
    },
    {
        input: './index.ts',
        output: [{
            file: './dist/index.d.ts',
            format: 'es'
        }],
        plugins: [dts()]
    }
]