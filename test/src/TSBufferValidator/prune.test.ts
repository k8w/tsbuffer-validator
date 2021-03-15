import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';

describe('prune', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    it('basic interface', function () {
        assert.deepStrictEqual(validator.prune({ a: 'aaa', b: 1, c: 'asdg' }, 'interface1/Interface1'), { a: 'aaa', b: 1 });
        assert.deepStrictEqual(validator.prune({ asdg: 234, a: 'aaa', asdgasdg: 'asdgasdg,', b: 1, c: 'asdg' }, 'interface1/Interface1'), { a: 'aaa', b: 1 });
    })

    it('logic', function () {
        assert.deepStrictEqual(validator.prune({
            a: 'sss',
            b: 'fff',
            c: 'asdf'
        }, 'logic/AB'), {
            a: 'sss',
            b: 'fff'
        });

        assert.deepStrictEqual(validator.prune({
            a: 'sss',
            b: 'fff',
            c: 'asdf'
        }, 'logic/CD'), {
            c: 'asdf'
        });
        assert.deepStrictEqual(validator.prune({
            a: 'sss',
            b: 'fff',
            c: 'asdf',
            d: 'ffd',
        }, 'logic/CD'), {
            c: 'asdf',
            d: 'ffd'
        });
    })

    it('index signature', function () {
        assert.deepStrictEqual(validator.prune({
            name: 'asdf',
            sex: 'm',
            aaa: 'asdgasdg',
            bbb: 'asdgasdg'
        }, 'interface1/Interface2_1'), {
            name: 'asdf',
            sex: 'm',
            aaa: 'asdgasdg',
            bbb: 'asdgasdg'
        });
    }); 
    
})