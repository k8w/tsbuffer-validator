import { TSBufferSchemaGenerator } from 'tsbuffer-schema-generator';
import * as glob from "glob";
import * as path from "path";
import * as fs from "fs";

async function main() {
    let generator = new TSBufferSchemaGenerator({
        baseDir: path.resolve(__dirname, 'source')
    });
    let result = await generator.generate(glob.sync('**/*.ts', {
        cwd: path.resolve(__dirname, 'source')
    }));

    fs.writeFileSync(path.resolve(__dirname, 'output.json'), JSON.stringify(result, null, 2));

    console.log(result);
}
main();