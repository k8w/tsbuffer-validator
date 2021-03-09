import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export default {
    input: './index.ts',
    output: [
        {
            format: 'cjs',
            file: './dist/index.cjs'
        },
        {
            format: 'es',
            file: './dist/index.mjs'
        }
    ],
    plugins: [
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: "esnext"
                }
            }
        }),
        terser({
            mangle: {
                properties: {
                    regex: /^_/
                }
            }
        })
    ],
    external: ['tslib']
}