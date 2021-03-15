import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

describe('LogicType', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    it('Union: Basic', function () {
        // C | D
        assert.deepStrictEqual(validator.validate({ c: 'cc' }, 'logic/CD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ d: 'dd' }, 'logic/CD'), ValidateResult.success);
        // excess check
        assert.deepStrictEqual(validator.validate({ c: 'cc', d: 123 }, 'logic/CD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/CD'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd', e: 'e' }, 'logic/CD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ c: 'c', e: 'e' }, 'logic/CD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate(123, 'logic/CD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // B | C | D
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd' }, 'logic/BCD'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 123, d: null }, 'logic/BCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/BCD'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd', e: 'e' }, 'logic/BCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ b: 'b', e: 'e' }, 'logic/BCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A & B | C & D
        assert.deepStrictEqual(validator.validate({ a: 'aaa', b: 'bb' }, 'logic/ABCD'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 4, b: null, c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ a: 'a' }, 'logic/ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ c: 'c' }, 'logic/ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 'a', c: 'c' }, 'logic/ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', e: 'e' }, 'logic/ABCD'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A | B&C | D
        assert.deepStrictEqual(validator.validate({ a: 'aaa' }, 'logic/ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/ABCD1'), ValidateResult.success);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 1, c: true, d: null }, 'logic/ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: null, b: 1, c: true, d: 'd' }, 'logic/ABCD1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: null, b: 'b', c: 'c', d: 12 }, 'logic/ABCD1'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ a: 'a', e: 'e' }, 'logic/ABCD1'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ d: 'a', e: 'e' }, 'logic/ABCD1'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', e: 'e' }, 'logic/ABCD1'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A&B | B&C | C&D
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x' }, 'logic/ABCD2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ b: 'x', c: 'x' }, 'logic/ABCD2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x' }, 'logic/ABCD2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x', a: 1, b: 2 }, 'logic/ABCD2'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x' }, 'logic/ABCD2'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ b: 'x', d: 'x' }, 'logic/ABCD2'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 'x', d: 'x' }, 'logic/ABCD2'),
            ValidateResult.error(ValidateErrorCode.NonConditionMet));

        // A | null
        assert.strictEqual(validator.validate({ a: 'sss' }, 'logic/AOrNull'), ValidateResult.success);
        assert.strictEqual(validator.validate(null, 'logic/AOrNull'), ValidateResult.success);
        assert.strictEqual(validator.validate([{ a: 'sss' }], 'logic/AOrNullArr'), ValidateResult.success);
        assert.strictEqual(validator.validate([null], 'logic/AOrNullArr'), ValidateResult.success);
    });

    it('Intersection: Basic', function () {
        // A & B
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic/AB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb', c: 'cc' }, 'logic/AB'), ValidateResult.error(
            ValidateErrorCode.InnerError, '<Condition0>', ValidateResult.error(ValidateErrorCode.InnerError, 'c', ValidateResult.error(ValidateErrorCode.UnexpectedField))
        ));
        assert.deepStrictEqual(validator.validate({ a: 'x' }, 'logic/AB'), ValidateResult.error(
            ValidateErrorCode.InnerError, '<Condition1>', ValidateResult.error(ValidateErrorCode.InnerError, 'b', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        ));
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 123 }, 'logic/AB'), ValidateResult.error(
            ValidateErrorCode.InnerError, '<Condition1>', ValidateResult.error(ValidateErrorCode.InnerError, 'b', ValidateResult.error(ValidateErrorCode.WrongType))
        ));

        // A & B & C
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', c: 'c' }, 'logic/ABC'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x' }, 'logic/ABC'), ValidateResult.innerError('<Condition1>.c', ValidateErrorCode.MissingRequiredMember));
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 'x', d: 1223 }, 'logic/ABC'), ValidateResult.innerError('<Condition0>.<Condition0>.d', ValidateErrorCode.UnexpectedField))
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 123 }, 'logic/ABC'), ValidateResult.innerError('<Condition1>.c', ValidateErrorCode.WrongType));

        // A & (B|C) & D
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResult.success)
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x', d: 'x', e: 1, f: 'x' }, 'logic/ABCD3'), ValidateResult.success)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 1, d: 'x' }, 'logic/ABCD3'), ValidateResult.success)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 1, c: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResult.success)
        assert.deepStrictEqual(validator.validate({ a: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResult.innerError('<Condition1>', ValidateErrorCode.NonConditionMet))
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResult.innerError('<Condition3>.b', ValidateErrorCode.NonConditionMet))

    })

    it('Intersection: Conflict', function () {
        assert.deepStrictEqual(validator.validate({ value: 'xx' }, 'logic/Conflict'), ValidateResult.error(
            ValidateErrorCode.InnerError, '<Condition1>', ValidateResult.error(ValidateErrorCode.InnerError, 'value', ValidateResult.error(ValidateErrorCode.WrongType))
        ));
        assert.deepStrictEqual(validator.validate({ value: 123 }, 'logic/Conflict'), ValidateResult.error(
            ValidateErrorCode.InnerError, '<Condition0>', ValidateResult.error(ValidateErrorCode.InnerError, 'value', ValidateResult.error(ValidateErrorCode.WrongType))
        ));
    });

    it('Union: mutual exclusion', function () {
        assert.deepStrictEqual(validator.validate({ type: 'string', value: 'x' }, 'logic/Conflict2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ type: 'number', value: 123 }, 'logic/Conflict2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ type: 'string', value: 123 }, 'logic/Conflict2'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ type: 'number', value: 'x' }, 'logic/Conflict2'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({}, 'logic/Conflict2'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
    })

    it('Union: indexSignature & excess check', function () {
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD4'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: true }, 'logic/ABCD4'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: true, b: true, c: true }, 'logic/ABCD4'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: true, b: true, c: 1 }, 'logic/ABCD4'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({ a: 1, b: 1, c: 1 }, 'logic/ABCD4'), ValidateResult.success);
    })

    it('Basic Intersection', function () {
        let validator = new TSBufferValidator({
            'a/a1': {
                type: 'Intersection',
                members: [
                    { id: 0, type: { type: 'String' } },
                    { id: 1, type: { type: 'String' } },
                ]
            },
            'a/a2': {
                type: 'Intersection',
                members: [
                    { id: 0, type: { type: 'String' } },
                    { id: 1, type: { type: 'Any' } },
                ]
            }
        });

        assert.deepStrictEqual(validator.validate('abc', 'a/a1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate('abc', 'a/a2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate(123, 'a/a1'), ValidateResult.innerError('<Condition0>', ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a/a2'), ValidateResult.innerError('<Condition0>', ValidateErrorCode.WrongType));
    });
})