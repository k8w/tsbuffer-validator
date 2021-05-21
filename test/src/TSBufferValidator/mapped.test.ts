import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src';
import { ErrorMsg, ErrorType } from '../../../src/ErrorMsg';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('MappedType Validate', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    function validateAndAssert(value: any, schemaId: string, errMsg: string | undefined, property?: string[]) {
        let vRes = validator.validate(value, schemaId);
        if (property) {
            assert.strictEqual(vRes.errMsg, `Property \`${property.join('.')}\`: ${errMsg}`);
        }
        else {
            assert.strictEqual(vRes.errMsg, errMsg)
        }
    }

    it('Pick', function () {
        // simple Pick
        validateAndAssert({ name: 'x' }, 'mapped/Pick1', undefined);
        validateAndAssert({ name: 'x', orders: [] }, 'mapped/Pick1', ErrorMsg[ErrorType.ExcessProperty]('orders'));
        validateAndAssert({}, 'mapped/Pick1', ErrorMsg[ErrorType.MissingRequiredProperty]('name'));

        // Pick fields
        validateAndAssert({ name: 'x' }, 'mapped/Pick2', undefined);
        validateAndAssert({ name: 'x', orders: [1, 2, 3] }, 'mapped/Pick2', undefined);
        validateAndAssert({ name: 'x', orders: [1, 2, 3], sex: { value: 'm' } }, 'mapped/Pick2',
            ErrorMsg[ErrorType.ExcessProperty]('sex'));

        // Pick<Pick>
        validateAndAssert({ orders: [1, 2, 3] }, 'mapped/Pick3', undefined);
        validateAndAssert({}, 'mapped/Pick3', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Pick3', ErrorMsg[ErrorType.ExcessProperty]('name'));

        // indexSignature
        validateAndAssert({ a: 'x', c: 'x' }, 'mapped/IPick', undefined);
        validateAndAssert({ a: 'x', c: 1 }, 'mapped/IPick', undefined);
        validateAndAssert({ a: 'x', c: undefined }, 'mapped/IPick', ErrorMsg[ErrorType.MissingRequiredProperty]('c'));
        validateAndAssert({ a: 'x', c: null }, 'mapped/IPick', ErrorMsg[ErrorType.TypeError]('string | number', 'null'), ['c']);

        // Pick<A|B>
        validateAndAssert({
            type: 'A',
            common: 'xxx'
        }, 'mapped/PickAB', undefined);
        validateAndAssert({
            type: 'B',
            common: 'xxx'
        }, 'mapped/PickAB', undefined);
        validateAndAssert({
            type: 'A',
            common: 'xxx',
            valueA: 'asdg'
        }, 'mapped/PickAB', ErrorMsg[ErrorType.ExcessProperty]('valueA'));
        validateAndAssert({
            common: 'xxx',
        }, 'mapped/PickAB', ErrorMsg[ErrorType.MissingRequiredProperty]('type'));
    });

    it('Partial', function () {
        // Partial1
        validateAndAssert({}, 'mapped/Partial1', undefined);
        validateAndAssert({ name: 'x' }, 'mapped/Partial1', undefined);
        validateAndAssert({ sex: undefined }, 'mapped/Partial1', undefined);
        validateAndAssert({ a: 1 }, 'mapped/Partial1', ErrorMsg[ErrorType.ExcessProperty]('a'));

        // Partial2
        validateAndAssert({}, 'mapped/Partial2', undefined);
        validateAndAssert({ name: 'xxx' }, 'mapped/Partial2', undefined);
        validateAndAssert({ orders: [1] }, 'mapped/Partial2', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Partial2', undefined);
        validateAndAssert({ name: 'x', orders: [1], sex: { value: 'm' } }, 'mapped/Partial2', ErrorMsg[ErrorType.ExcessProperty]('sex'));
        validateAndAssert({ name: 123 }, 'mapped/Partial2', ErrorMsg[ErrorType.TypeError]('string', 'number'), ['name']);

        // indexSignature
        validateAndAssert({ a: 'x', c: 'x' }, 'mapped/IPartial', undefined);
        validateAndAssert({ c: 1 }, 'mapped/IPartial', undefined);
        validateAndAssert({ a: 'x', c: undefined }, 'mapped/IPartial', ErrorMsg[ErrorType.TypeError]('string | number', 'undefined'), ['c']);

        // PartialAB
        validateAndAssert({ type: 'A', valueA: 'AAA', common: 'xxx' }, 'mapped/PartialAB', undefined);
        validateAndAssert({ type: 'A', valueA: 'AAA' }, 'mapped/PartialAB', undefined);
        validateAndAssert({ type: 'B' }, 'mapped/PartialAB', undefined);
        validateAndAssert({ common1: 'string' }, 'mapped/PartialAB', undefined);
    });

    it('Omit', function () {
        // Omit1
        validateAndAssert({ name: 'x' }, 'mapped/Omit1', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Omit1', undefined);
        validateAndAssert({ name: 'x', orders: [1], sex: { value: 'm' } }, 'mapped/Omit1', ErrorMsg[ErrorType.ExcessProperty]('sex'));

        // Omit2
        validateAndAssert({ name: 'x' }, 'mapped/Omit2', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Omit2', ErrorMsg[ErrorType.ExcessProperty]('orders'));
        validateAndAssert({ name: 'x', sex: { value: 'f' } }, 'mapped/Omit2', ErrorMsg[ErrorType.ExcessProperty]('sex'));
        validateAndAssert({}, 'mapped/Omit2', ErrorMsg[ErrorType.MissingRequiredProperty]('name'));

        // Omit3
        validateAndAssert({}, 'mapped/Omit3', undefined);
        validateAndAssert({ orders: [1] }, 'mapped/Omit3', undefined);
        validateAndAssert({ name: 'x' }, 'mapped/Omit3', ErrorMsg[ErrorType.ExcessProperty]('name'));
        validateAndAssert({ sex: 'x' }, 'mapped/Omit3', ErrorMsg[ErrorType.ExcessProperty]('sex'));

        // indexSignature
        validateAndAssert({ a: 'x', d: 'x' }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x' }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x', b: 1 }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x', b: 'b', c: 'c' }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x', c: null }, 'mapped/IOmit', ErrorMsg[ErrorType.TypeError]('string | number', 'null'), ['c']);

        // Omit<A|B>
        validateAndAssert({
            type: 'A',
            valueA: 'AAA'
        }, 'mapped/OmitAB', undefined);
        validateAndAssert({
            type: 'B',
            valueB: 'BBB',
            common2: 'xxx'
        }, 'mapped/OmitAB', undefined);
        validateAndAssert({
            type: 'A',
            valueB: 'BBB'
        }, 'mapped/OmitAB', ErrorMsg[ErrorType.MissingRequiredProperty]('valueA'));
        validateAndAssert({
            type: 'A',
        }, 'mapped/OmitAB', ErrorMsg[ErrorType.MissingRequiredProperty]('valueA'));
        validateAndAssert({
            type: 'A',
            valueA: 'AAA',
            common: 'asdg'
        }, 'mapped/OmitAB', ErrorMsg[ErrorType.ExcessProperty]('common'));
    });

    it('Nested Pick<A|B> Omit<A|B>', function () {
        validateAndAssert({
            common: 'asdg'
        }, 'mapped/NestedAB', undefined);
        validateAndAssert({
            type: 'A',
            common: 'asdg'
        }, 'mapped/NestedAB', ErrorMsg[ErrorType.ExcessProperty]('type'));
        validateAndAssert({
            type: 'A',
            valueA: 'asdg',
            common: 'asdg'
        }, 'mapped/NestedAB', ErrorMsg[ErrorType.ExcessProperty]('type'));
        validateAndAssert({
            common: 'asdg',
            common2: 'asdg'
        }, 'mapped/NestedAB', ErrorMsg[ErrorType.ExcessProperty]('common2'));
    })

    it('Overwrite', function () {
        // Overwrite1
        validateAndAssert({
            name: 'x',
            orders: [1, 2],
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite1', undefined);
        validateAndAssert({
            name: 'x',
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite1', undefined);
        validateAndAssert({
            name: 'x',
            sex: { value: 'm' },
            other: 'xx'
        }, 'mapped/Overwrite1', 'Property `sex`: ' + ErrorMsg[ErrorType.TypeError]('string', 'Object'));
        validateAndAssert({
            name: 'x',
            other: 'xx'
        }, 'mapped/Overwrite1', ErrorMsg[ErrorType.MissingRequiredProperty]('sex'));

        // Overwrite2
        validateAndAssert({
            name: 'x',
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite2', undefined);
        validateAndAssert({
            name: 'x',
            other: 'xx'
        }, 'mapped/Overwrite2', ErrorMsg[ErrorType.MissingRequiredProperty]('sex'));
        validateAndAssert({
            sex: 'f',
            other: 'xx'
        }, 'mapped/Overwrite2', ErrorMsg[ErrorType.MissingRequiredProperty]('name'));
        validateAndAssert({
            name: 'x',
            orders: [1, 2],
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite2', ErrorMsg[ErrorType.ExcessProperty]('orders'));

        // indexSignature
        validateAndAssert({ a: 1, b: 'x', c: 'x' }, 'mapped/IOverwrite1', undefined);
        validateAndAssert({ a: '1', b: 2 }, 'mapped/IOverwrite1', ErrorMsg[ErrorType.TypeError]('number', 'string'), ['a']);
        validateAndAssert({ a: 'x', b: 'x', c: 'x' }, 'mapped/IOverwrite2', undefined);
        validateAndAssert({ a: 'x', b: 'x', c: 1 }, 'mapped/IOverwrite2', ErrorMsg[ErrorType.TypeError]('string', 'number'), ['c']);
    });

    it('NonNullable', function () {
        validateAndAssert(undefined, 'mapped/NonNullable1', ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', 'undefined').errMsg);
        validateAndAssert(undefined, 'mapped/NonNullable2', ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', 'undefined').errMsg);
        validateAndAssert(undefined, 'mapped/NonNullable3', ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', 'undefined').errMsg);

        validateAndAssert(null, 'mapped/NonNullable1', ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', 'null').errMsg);
        validateAndAssert(null, 'mapped/NonNullable2', ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', 'null').errMsg);
        validateAndAssert(null, 'mapped/NonNullable3', ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', 'null').errMsg);

        validateAndAssert('ABC', 'mapped/NonNullable1', undefined);
        validateAndAssert('ABC', 'mapped/NonNullable2', undefined);
        validateAndAssert('ABC', 'mapped/NonNullable3', undefined);

        validateAndAssert(12345, 'mapped/NonNullable1', ValidateResultUtil.error(ErrorType.TypeError, 'string', 'number').errMsg);
        validateAndAssert(12345, 'mapped/NonNullable2', ValidateResultUtil.error(ErrorType.TypeError, 'string', 'number').errMsg);
        validateAndAssert(12345, 'mapped/NonNullable3', ValidateResultUtil.error(ErrorType.TypeError, 'string', 'number').errMsg);

        validateAndAssert({}, 'mapped/NonNullable4', undefined);
        validateAndAssert({ a: null }, 'mapped/NonNullable4', undefined);
        validateAndAssert({ a: {} }, 'mapped/NonNullable4', undefined);
        validateAndAssert({ a: { b: null } }, 'mapped/NonNullable4', undefined);
        validateAndAssert({ a: { b: 'ABC' } }, 'mapped/NonNullable4', undefined);
    });
});