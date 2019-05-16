import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

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
        // fail
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd', e: 'e' }, 'logic', 'CD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ c: 'c', e: 'e' }, 'logic', 'CD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate(123, 'logic', 'CD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // B | C | D
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic', 'BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic', 'BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd' }, 'logic', 'BCD'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 123, d: null }, 'logic', 'BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic', 'BCD'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd', e: 'e' }, 'logic', 'BCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ b: 'b', e: 'e' }, 'logic', 'BCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A & B | C & D
        assert.deepStrictEqual(validator.validate({ a: 'aaa', b: 'bb' }, 'logic', 'ABCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd' }, 'logic', 'ABCD'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 4, b: null, c: 'c', d: 'd' }, 'logic', 'ABCD'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ a: 'a' }, 'logic', 'ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ c: 'c' }, 'logic', 'ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 'a', c: 'c' }, 'logic', 'ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', e: 'e' }, 'logic', 'ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A | B&C | D
        assert.deepStrictEqual(validator.validate({ a: 'aaa' }, 'logic', 'ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic', 'ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic', 'ABCD1'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 1, c: true, d: null }, 'logic', 'ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: null, b: 1, c: true, d: 'd' }, 'logic', 'ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: null, b: 'b', c: 'c', d: 12 }, 'logic', 'ABCD1'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ a: 'a', e: 'e' }, 'logic', 'ABCD1'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ d: 'a', e: 'e' }, 'logic', 'ABCD1'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', e: 'e' }, 'logic', 'ABCD1'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A&B | B&C | C&D
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x' }, 'logic', 'ABCD2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'x', c: 'x' }, 'logic', 'ABCD2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x' }, 'logic', 'ABCD2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x', a: 1, b: 2 }, 'logic', 'ABCD2'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x' }, 'logic', 'ABCD2'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ b: 'x', d: 'x' }, 'logic', 'ABCD2'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 'x', d: 'x' }, 'logic', 'ABCD2'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
    });

    it('Intersection: Basic', function () {
        // A & B
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic', 'AB'), ValidateResult.success);

        // A & B & C
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', c: 'c' }, 'logic', 'ABC'), ValidateResult.success);

        // TODO
    })
})