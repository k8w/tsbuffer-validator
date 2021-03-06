import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export default {
    input: './index.ts',
    output: [
        {
            format: 'cjs',
            file: './dist/index.js'
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
                    declaration: true,
                    module: "esnext"
                }
            }
        }),
        terser()
    ],
    external: ['tslib']
}