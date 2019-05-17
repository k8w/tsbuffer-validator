import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

const proto: TSBufferProto = require('../../genTestSchemas/output');
let validator = new TSBufferValidator(proto);

describe('NestedType', function () {
    it('Array', function () {
        // succ
        assert.deepStrictEqual(validator.validate([], 'nested', 'ArrStr'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate(['a', 'b', 'c'], 'nested', 'ArrStr'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'xxx' }, { value: 'xxx' }], 'nested', 'ArrObj'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([[{ value: 'xxx' }], [{ value: 'xxx' }]], 'nested', 'ArrArr'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([123, 'xx', 123, 'xx'], 'nested', 'UnionArr'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate(null, 'nested', 'ArrStr'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(['a', 123, 'c'], 'nested', 'ArrStr'), ValidateResult.error(
            ValidateErrorCode.InnerError, '1', ValidateResult.error(ValidateErrorCode.WrongType)
        ));
        assert.deepStrictEqual(validator.validate([0, { value: 'xxx' }], 'nested', 'ArrObj'), ValidateResult.error(
            ValidateErrorCode.InnerError, '0', ValidateResult.error(ValidateErrorCode.WrongType)
        ));
        assert.deepStrictEqual(validator.validate([[{ value: 'xxx' }], [{ value: 123 }]], 'nested', 'ArrArr'), ValidateResult.error(
            ValidateErrorCode.InnerError, '1', ValidateResult.error(
                ValidateErrorCode.InnerError, '0', ValidateResult.error(
                    ValidateErrorCode.InnerError, 'value', ValidateResult.error(ValidateErrorCode.WrongType)
                )
            )
        ));
        assert.deepStrictEqual(validator.validate([123, 'xx', null, 'xx'], 'nested', 'UnionArr'), ValidateResult.error(
            ValidateErrorCode.InnerError, '2', ValidateResult.error(ValidateErrorCode.NonConditionMet)
        ));
    })

    it('Tuple', function () {
        // succ
        assert.deepStrictEqual(validator.validate([123, 'x'], 'nested', 'Tuple1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, 'x', [true, false]], 'nested', 'Tuple2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, 'x', []], 'nested', 'Tuple2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, 'x', [false, undefined]], 'nested', 'Tuple2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, 'x'], 'nested', 'Tuple2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'x' }], 'nested', 'Tuple2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, undefined, [undefined, true]], 'nested', 'Tuple2'), ValidateResult.success);
        // fail
        assert.deepStrictEqual(validator.validate(123, 'nested', 'Tuple1'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate([123, 123], 'nested', 'Tuple1'), ValidateResult.error(
            ValidateErrorCode.InnerError, '1', ValidateResult.error(ValidateErrorCode.WrongType)
        ));
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, 'x', [1, false]], 'nested', 'Tuple2'), ValidateResult.error(
            ValidateErrorCode.InnerError, '2', ValidateResult.error(
                ValidateErrorCode.InnerError, '0', ValidateResult.error(ValidateErrorCode.WrongType)
            )
        ));
        assert.deepStrictEqual(validator.validate([{ value: 'x' }, 'x', [], 123], 'nested', 'Tuple2'), ValidateResult.error(ValidateErrorCode.TupleOverlength));
        assert.deepStrictEqual(validator.validate([], 'nested', 'Tuple2'), ValidateResult.error(
            ValidateErrorCode.InnerError, '0', ValidateResult.error(ValidateErrorCode.MissingRequiredMember)
        ));
    })
})