import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ErrorMsg } from '../../../src/ErrorMsg';

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
        validateAndAssert({ name: 'x', orders: [] }, 'mapped/Pick1', ErrorMsg.excessProperty('orders'));
        validateAndAssert({}, 'mapped/Pick1', ErrorMsg.missingRequiredProperty('name'));

        // Pick fields
        validateAndAssert({ name: 'x' }, 'mapped/Pick2', undefined);
        validateAndAssert({ name: 'x', orders: [1, 2, 3] }, 'mapped/Pick2', undefined);
        validateAndAssert({ name: 'x', orders: [1, 2, 3], sex: { value: 'm' } }, 'mapped/Pick2',
            ErrorMsg.excessProperty('sex'));

        // Pick<Pick>
        validateAndAssert({ orders: [1, 2, 3] }, 'mapped/Pick3', undefined);
        validateAndAssert({}, 'mapped/Pick3', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Pick3', ErrorMsg.excessProperty('name'));

        // indexSignature
        validateAndAssert({ a: 'x', c: 'x' }, 'mapped/IPick', undefined);
        validateAndAssert({ a: 'x', c: 1 }, 'mapped/IPick', undefined);
        validateAndAssert({ a: 'x', c: undefined }, 'mapped/IPick', ErrorMsg.missingRequiredProperty('c'));
        validateAndAssert({ a: 'x', c: null }, 'mapped/IPick', ErrorMsg.typeError('string | number', 'null'), ['c']);

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
        }, 'mapped/PickAB', ErrorMsg.excessProperty('valueA'));
        validateAndAssert({
            common: 'xxx',
        }, 'mapped/PickAB', ErrorMsg.missingRequiredProperty('type'));
    });

    it('Partial', function () {
        // Partial1
        validateAndAssert({}, 'mapped/Partial1', undefined);
        validateAndAssert({ name: 'x' }, 'mapped/Partial1', undefined);
        validateAndAssert({ sex: undefined }, 'mapped/Partial1', undefined);
        validateAndAssert({ a: 1 }, 'mapped/Partial1', ErrorMsg.excessProperty('a'));

        // Partial2
        validateAndAssert({}, 'mapped/Partial2', undefined);
        validateAndAssert({ name: 'xxx' }, 'mapped/Partial2', undefined);
        validateAndAssert({ orders: [1] }, 'mapped/Partial2', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Partial2', undefined);
        validateAndAssert({ name: 'x', orders: [1], sex: { value: 'm' } }, 'mapped/Partial2', ErrorMsg.excessProperty('sex'));
        validateAndAssert({ name: 123 }, 'mapped/Partial2', ErrorMsg.typeError('string', 'number'), ['name']);

        // indexSignature
        validateAndAssert({ a: 'x', c: 'x' }, 'mapped/IPartial', undefined);
        validateAndAssert({ c: 1 }, 'mapped/IPartial', undefined);
        validateAndAssert({ a: 'x', c: undefined }, 'mapped/IPartial', ErrorMsg.typeError('string | number', 'undefined'), ['c']);

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
        validateAndAssert({ name: 'x', orders: [1], sex: { value: 'm' } }, 'mapped/Omit1', ErrorMsg.excessProperty('sex'));

        // Omit2
        validateAndAssert({ name: 'x' }, 'mapped/Omit2', undefined);
        validateAndAssert({ name: 'x', orders: [1] }, 'mapped/Omit2', ErrorMsg.excessProperty('orders'));
        validateAndAssert({ name: 'x', sex: { value: 'f' } }, 'mapped/Omit2', ErrorMsg.excessProperty('sex'));
        validateAndAssert({}, 'mapped/Omit2', ErrorMsg.missingRequiredProperty('name'));

        // Omit3
        validateAndAssert({}, 'mapped/Omit3', undefined);
        validateAndAssert({ orders: [1] }, 'mapped/Omit3', undefined);
        validateAndAssert({ name: 'x' }, 'mapped/Omit3', ErrorMsg.excessProperty('name'));
        validateAndAssert({ sex: 'x' }, 'mapped/Omit3', ErrorMsg.excessProperty('sex'));

        // indexSignature
        validateAndAssert({ a: 'x', d: 'x' }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x' }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x', b: 1 }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x', b: 'b', c: 'c' }, 'mapped/IOmit', undefined);
        validateAndAssert({ a: 'x', c: null }, 'mapped/IOmit', ErrorMsg.typeError('string | number', 'null'), ['c']);

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
        }, 'mapped/OmitAB', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('valueA') },
            { errMsg: 'Property `type`: ' + ErrorMsg.invalidLiteralValue('B', 'A') }
        ]));
        validateAndAssert({
            type: 'A',
        }, 'mapped/OmitAB', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('valueA') },
            { errMsg: 'Property `type`: ' + ErrorMsg.invalidLiteralValue('B', 'A') }
        ]));
        validateAndAssert({
            type: 'A',
            valueA: 'AAA',
            common: 'asdg'
        }, 'mapped/OmitAB', ErrorMsg.excessProperty('common'));
    });

    it('Nested Pick<A|B> Omit<A|B>', function () {
        validateAndAssert({
            common: 'asdg'
        }, 'mapped/NestedAB', undefined);
        validateAndAssert({
            type: 'A',
            common: 'asdg'
        }, 'mapped/NestedAB', ErrorMsg.excessProperty('type'));
        validateAndAssert({
            type: 'A',
            valueA: 'asdg',
            common: 'asdg'
        }, 'mapped/NestedAB', ErrorMsg.excessProperty('type'));
        validateAndAssert({
            common: 'asdg',
            common2: 'asdg'
        }, 'mapped/NestedAB', ErrorMsg.excessProperty('common2'));
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
        }, 'mapped/Overwrite1', 'Property `sex`: ' + ErrorMsg.typeError('string', 'Object'));
        validateAndAssert({
            name: 'x',
            other: 'xx'
        }, 'mapped/Overwrite1', ErrorMsg.missingRequiredProperty('sex'));

        // Overwrite2
        validateAndAssert({
            name: 'x',
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite2', undefined);
        validateAndAssert({
            name: 'x',
            other: 'xx'
        }, 'mapped/Overwrite2', ErrorMsg.missingRequiredProperty('sex'));
        validateAndAssert({
            sex: 'f',
            other: 'xx'
        }, 'mapped/Overwrite2', ErrorMsg.missingRequiredProperty('name'));
        validateAndAssert({
            name: 'x',
            orders: [1, 2],
            sex: 'm',
            other: 'xx'
        }, 'mapped/Overwrite2', ErrorMsg.excessProperty('orders'));

        // indexSignature
        validateAndAssert({ a: 1, b: 'x', c: 'x' }, 'mapped/IOverwrite1', undefined);
        validateAndAssert({ a: '1', b: 2 }, 'mapped/IOverwrite1', ErrorMsg.typeError('number', 'string'), ['a']);
        validateAndAssert({ a: 'x', b: 'x', c: 'x' }, 'mapped/IOverwrite2', undefined);
        validateAndAssert({ a: 'x', b: 'x', c: 1 }, 'mapped/IOverwrite2', ErrorMsg.typeError('string', 'number'), ['c']);
    });
});