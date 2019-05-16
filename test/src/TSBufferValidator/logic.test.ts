import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ValidateResult } from '../../../src/ValidateResult';

const proto: TSBufferProto = require('../../genTestSchemas/output');
let validator = new TSBufferValidator(proto);

describe('LogicType', function () {
    it('Union: Basic', function () {
        // C | D
        assert.deepStrictEqual(validator.validate({ c: 'cc' }, 'logic', 'CD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ d: 'dd' }, 'logic', 'CD'), ValidateResult.success);
        // excess check
        assert.deepStrictEqual(validator.validate({ c: 'cc', d: 123 }, 'logic', 'CD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic', 'CD'), ValidateResult.success);

        // B | C | D
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic', 'BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic', 'BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd' }, 'logic', 'BCD'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 123, d: null }, 'logic', 'BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic', 'BCD'), ValidateResult.success);

        // A & B | C & D
        assert.deepStrictEqual(validator.validate({ a: 'aaa', b: 'bb' }, 'logic', 'ABCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd' }, 'logic', 'ABCD'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 4, b: null, c: 'c', d: 'd' }, 'logic', 'ABCD'), ValidateResult.success);

        // A | B&C | D
        // TODO

        // TODO failed的情况


        // assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);
        // assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);
        // assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);
        // assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);
        // assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);
    })

    it('Intersection: Basic', function () {
        // A & B
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);

        // A & B & C
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', c: 'c' }, 'logic', 'ABC'), ValidateResult.success);

    })
})