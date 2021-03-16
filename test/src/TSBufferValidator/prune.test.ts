import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';

describe('prune', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto, {
        excessPropertyChecks: false
    });

    it('basic interface', function () {
        assert.deepStrictEqual(
            validator.validateAndPrune(
                { a: 'aaa', b: 1, c: 'asdg' },
                'interface1/Interface1'
            ).pruneOutput,
            { a: 'aaa', b: 1 }
        );
        assert.deepStrictEqual(
            validator.validateAndPrune(
                { asdg: 234, a: 'aaa', asdgasdg: 'asdgasdg,', b: 1, c: 'asdg' },
                'interface1/Interface1'
            ).pruneOutput,
            { a: 'aaa', b: 1 }
        );
    })

    it('logic', function () {
        assert.deepStrictEqual(
            validator.validateAndPrune({
                a: 'sss',
                b: 'fff'
            }, 'logic/AB').pruneOutput,
            {
                a: 'sss',
                b: 'fff'
            }
        );

        assert.deepStrictEqual(
            validator.validateAndPrune({
                a: 'sss',
                b: 'fff',
                c: 'asdf'
            }, 'logic/AB').pruneOutput,
            {
                a: 'sss',
                b: 'fff'
            }
        );

        assert.deepStrictEqual(
            validator.validateAndPrune({
                a: 'sss',
                b: 'fff',
                c: 'asdf'
            }, 'logic/CD').pruneOutput,
            {
                c: 'asdf'
            }
        );
        assert.deepStrictEqual(
            validator.validateAndPrune({
                a: 'sss',
                b: 'fff',
                c: 'asdf',
                d: 'ffd',
            }, 'logic/CD').pruneOutput,
            {
                c: 'asdf',
                d: 'ffd'
            });
    })

    it('index signature', function () {
        assert.deepStrictEqual(
            validator.validateAndPrune({
                name: 'asdf',
                sex: 'm',
                aaa: 'asdgasdg',
                bbb: 'asdgasdg'
            }, 'interface1/Interface2_1').pruneOutput,
            {
                name: 'asdf',
                sex: 'm',
                aaa: 'asdgasdg',
                bbb: 'asdgasdg'
            }
        );
    });

    it('nested', function () {
        assert.deepStrictEqual(
            validator.validateAndPrune({
                value1: { a: 'aaa', b: 123, c: 'ccc' },
                value2: { c: true, d: 'ddd', e: 'eee' },
                value3: {
                    a: 'a',
                    b: 'b',
                    c: 'c',
                    d: 'd'
                },
                value4: {
                    a: 'a',
                    b: 'b',
                    c: 'c',
                    d: 'd'
                },
                value5: 'xxx',
                value6: 'xx'

            }, 'interface1/Interface4').pruneOutput,
            {
                value1: { a: 'aaa', b: 123 },
                value2: { c: true, d: 'ddd' },
                value3: {
                    a: 'a',
                    b: 'b',
                },
                value4: {
                    c: 'c',
                    d: 'd'
                },
            }
        )
    })

    it('Array nest object', function () {

    })

    it('Tuple', function () {
        // assert.deepStrictEqual(validator.validateAndPrune({
        //     value4: 'asdf',

        // }))
    })

})