import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

const proto: TSBufferProto = require('../../genTestSchemas/output');
let validator = new TSBufferValidator(proto);

describe('MappedType Validate', function () {
    it('Pick', function () {
        // simple Pick
        assert.deepStrictEqual(validator.validate({ name: 'x' }, 'mapped/Pick1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [] }, 'mapped/Pick1'),
            ValidateResult.innerError('orders', ValidateErrorCode.UnexpectedField));
        assert.deepStrictEqual(validator.validate({}, 'mapped/Pick1'),
            ValidateResult.innerError('name', ValidateErrorCode.MissingRequiredMember));

        // Pick fields
        assert.deepStrictEqual(validator.validate({ name: 'x' }, 'mapped/Pick2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1, 2, 3] }, 'mapped/Pick2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1, 2, 3], sex: { value: 'm' } }, 'mapped/Pick2'),
            ValidateResult.innerError('sex', ValidateErrorCode.UnexpectedField));

        // Pick<Pick>
        assert.deepStrictEqual(validator.validate({ orders: [1, 2, 3] }, 'mapped/Pick3'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({}, 'mapped/Pick3'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1] }, 'mapped/Pick3'), ValidateResult.innerError('name', ValidateErrorCode.UnexpectedField));

        // indexSignature
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x' }, 'mapped/IPick'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 1 }, 'mapped/IPick'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', c: undefined }, 'mapped/IPick'), ValidateResult.innerError('c', ValidateErrorCode.MissingRequiredMember));
        assert.deepStrictEqual(validator.validate({ a: 'x', c: null }, 'mapped/IPick'), ValidateResult.innerError('c', ValidateErrorCode.NonConditionMet));

        // Pick<A|B>
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            common: 'xxx'
        }, 'mapped/PickAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            type: 'B',
            common: 'xxx'
        }, 'mapped/PickAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            common: 'xxx',
            valueA: 'asdg'
        }, 'mapped/PickAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({
            common: 'xxx',
        }, 'mapped/PickAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
    });

    it('Partial', function () {
        // Partial1
        assert.deepStrictEqual(validator.validate({}, 'mapped/Partial1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x' }, 'mapped/Partial1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ sex: undefined }, 'mapped/Partial1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 1 }, 'mapped/Partial1'), ValidateResult.innerError('a', ValidateErrorCode.UnexpectedField));

        // Partial2
        assert.deepStrictEqual(validator.validate({}, 'mapped/Partial2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'xxx' }, 'mapped/Partial2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ orders: [1] }, 'mapped/Partial2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1] }, 'mapped/Partial2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1], sex: { value: 'm' } }, 'mapped/Partial2'), ValidateResult.innerError('sex', ValidateErrorCode.UnexpectedField));
        assert.deepStrictEqual(validator.validate({ name: 123 }, 'mapped/Partial2'), ValidateResult.innerError('name', ValidateErrorCode.WrongType));

        // indexSignature
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x' }, 'mapped/IPartial'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ c: 1 }, 'mapped/IPartial'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', c: undefined }, 'mapped/IPartial'), ValidateResult.innerError('c', ValidateErrorCode.NonConditionMet));
    
        // PartialAB
        assert.deepStrictEqual(validator.validate({ type: 'A', valueA: 'AAA', common: 'xxx' }, 'mapped/PartialAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ type: 'A', valueA: 'AAA' }, 'mapped/PartialAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ type: 'B' }, 'mapped/PartialAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ common1: 'string' }, 'mapped/PartialAB'), ValidateResult.success);
    });

    it('Omit', function () {
        // Omit1
        assert.deepStrictEqual(validator.validate({ name: 'x' }, 'mapped/Omit1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1] }, 'mapped/Omit1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1], sex: { value: 'm' } }, 'mapped/Omit1'), ValidateResult.innerError('sex', ValidateErrorCode.UnexpectedField));

        // Omit2
        assert.deepStrictEqual(validator.validate({ name: 'x' }, 'mapped/Omit2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x', orders: [1] }, 'mapped/Omit2'), ValidateResult.innerError('orders', ValidateErrorCode.UnexpectedField));
        assert.deepStrictEqual(validator.validate({ name: 'x', sex: { value: 'f' } }, 'mapped/Omit2'), ValidateResult.innerError('sex', ValidateErrorCode.UnexpectedField));
        assert.deepStrictEqual(validator.validate({}, 'mapped/Omit2'), ValidateResult.innerError('name', ValidateErrorCode.MissingRequiredMember));

        // Omit3
        assert.deepStrictEqual(validator.validate({}, 'mapped/Omit3'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ orders: [1] }, 'mapped/Omit3'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ name: 'x' }, 'mapped/Omit3'), ValidateResult.innerError('name', ValidateErrorCode.UnexpectedField));
        assert.deepStrictEqual(validator.validate({ sex: 'x' }, 'mapped/Omit3'), ValidateResult.innerError('sex', ValidateErrorCode.UnexpectedField));

        // indexSignature
        assert.deepStrictEqual(validator.validate({ a: 'x', d: 'x' }, 'mapped/IOmit'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x' }, 'mapped/IOmit'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 1 }, 'mapped/IOmit'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'b', c: 'c' }, 'mapped/IOmit'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', c: null }, 'mapped/IOmit'), ValidateResult.innerError('c', ValidateErrorCode.NonConditionMet));
    
        // Omit<A|B>
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            valueA: 'AAA'
        }, 'mapped/OmitAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            type: 'B',
            valueB: 'BBB',
            common2: 'xxx'
        }, 'mapped/OmitAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            valueB: 'BBB'
        }, 'mapped/OmitAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({
            type: 'A',
        }, 'mapped/OmitAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            valueA: 'AAA',
            common: 'asdg'
        }, 'mapped/OmitAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
    });

    it('Nested Pick<A|B> Omit<A|B>', function () {
        assert.deepStrictEqual(validator.validate({
            common: 'asdg'
        }, 'mapped/NestedAB'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            common: 'asdg'
        }, 'mapped/NestedAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({
            type: 'A',
            valueA: 'asdg',
            common: 'asdg'
        }, 'mapped/NestedAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({
            common: 'asdg',
            common2: 'asdg'
        }, 'mapped/NestedAB'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
    })

    it('Overwrite', function () {
        // Overwrite1
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            orders: [1, 2],
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            sex: { value: 'm' },
            other: 'xx'
        }, 'mapped/Overwrite1'), ValidateResult.innerError('sex', ValidateErrorCode.NonConditionMet));
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            other: 'xx'
        }, 'mapped/Overwrite1'), ValidateResult.innerError('sex', ValidateErrorCode.MissingRequiredMember));

        // Overwrite2
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            other: 'xx'
        }, 'mapped/Overwrite2'), ValidateResult.innerError('sex', ValidateErrorCode.MissingRequiredMember));
        assert.deepStrictEqual(validator.validate({
            sex: 'f',
            other: 'xx'
        }, 'mapped/Overwrite2'), ValidateResult.innerError('name', ValidateErrorCode.MissingRequiredMember));
        assert.deepStrictEqual(validator.validate({
            name: 'x',
            orders: [1, 2],
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite2'), ValidateResult.innerError('orders', ValidateErrorCode.UnexpectedField));

        // indexSignature
        assert.deepStrictEqual(validator.validate({ a: 1, b: 'x', c: 'x' }, 'mapped/IOverwrite1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: '1', b: 2 }, 'mapped/IOverwrite1'), ValidateResult.innerError('a', ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 'x' }, 'mapped/IOverwrite2'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 1 }, 'mapped/IOverwrite2'), ValidateResult.innerError('c', ValidateErrorCode.WrongType));

    });
});