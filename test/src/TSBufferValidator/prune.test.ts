import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';

const proto: TSBufferProto = require('../../genTestSchemas/output');
let validator = new TSBufferValidator(proto);

describe('prune', function () {
    it('basic interface', function () {
        assert.deepStrictEqual(validator.prune({ a: 'aaa', b: 1, c: 'asdg' }, 'interface1/Interface1').output, { a: 'aaa', b: 1 });

        let res1 = validator.prune({ a: 'aaa', c: 'asdg' }, 'interface1/Interface1');
        assert.strictEqual(res1.isSucc, false);
        assert.strictEqual(res1.output, undefined);

        assert.deepStrictEqual(validator.prune(123, 'interface1/Interface1').output, undefined);
    })

    it('index signature', function () {
        assert.deepStrictEqual(validator.prune({
            name: 'asdf',
            sex: 'm',
            aaa: 'asdgasdg',
            bbb: 'asdgasdg'
        }, 'interface1/Interface2_1').output, {
            name: 'asdf',
            sex: 'm',
            aaa: 'asdgasdg',
            bbb: 'asdgasdg'
        });
    })

    it('logic', function () {
        throw new Error('TODO')
    })
})