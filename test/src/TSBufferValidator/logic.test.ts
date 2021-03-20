import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ErrorMsg } from '../../../src/ErrorMsg';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('LogicType', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    function assertValidErr(value: any, schemaId: string, errMsg: string | undefined, property?: string[]) {
        let vRes = validator.validate(value, schemaId);
        if (property) {
            assert.strictEqual(vRes.errMsg, `Property \`${property.join('.')}\`: ${errMsg}`);
        }
        else {
            assert.strictEqual(vRes.errMsg, errMsg)
        }
    }

    it('Union: Basic', function () {
        // C | D
        assert.deepStrictEqual(validator.validate({ c: 'cc' }, 'logic/CD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ d: 'dd' }, 'logic/CD'), ValidateResultUtil.succ);
        // excess check
        assert.deepStrictEqual(validator.validate({ c: 'cc', d: 123 }, 'logic/CD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/CD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ c: 'c', d: 'd', e: 'e' }, 'logic/CD', ErrorMsg.excessProperty('e'));
        assertValidErr({ c: 'c', e: 'e' }, 'logic/CD', ErrorMsg.excessProperty('e'));
        assertValidErr(123, 'logic/CD', ErrorMsg.typeError('Object', 'number'));

        // B | C | D
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd' }, 'logic/BCD'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 123, d: null }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/BCD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ b: 'b', c: 'c', d: 'd', e: 'e' }, 'logic/BCD', ErrorMsg.excessProperty('e'));
        assertValidErr({ b: 'b', e: 'e' }, 'logic/BCD', ErrorMsg.excessProperty('e'));

        // A & B | C & D
        assert.deepStrictEqual(validator.validate({ a: 'aaa', b: 'bb' }, 'logic/ABCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 4, b: null, c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'a' }, 'logic/ABCD', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('c') }
        ]));
        assertValidErr({ c: 'c' }, 'logic/ABCD', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('a') },
            { errMsg: ErrorMsg.missingRequiredProperty('d') }
        ]));
        assertValidErr({ a: 'a', c: 'c' }, 'logic/ABCD', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('d') }
        ]));
        assertValidErr({ a: 'a', b: 'b', e: 'e' }, 'logic/ABCD', ErrorMsg.excessProperty('e'));

        // A | B&C | D
        assert.deepStrictEqual(validator.validate({ a: 'aaa' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 1, c: true, d: null }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: null, b: 1, c: true, d: 'd' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: null, b: 'b', c: 'c', d: 12 }, 'logic/ABCD1'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'a', e: 'e' }, 'logic/ABCD1', ErrorMsg.excessProperty('e'));
        assertValidErr({ d: 'a', e: 'e' }, 'logic/ABCD1', ErrorMsg.excessProperty('e'));
        assertValidErr({ b: 'b', c: 'c', e: 'e' }, 'logic/ABCD1', ErrorMsg.excessProperty('e'));

        // A&B | B&C | C&D
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'x', c: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x', a: 1, b: 2 }, 'logic/ABCD2'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'x', c: 'x' }, 'logic/ABCD2', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('d') },
        ]));
        assertValidErr({ b: 'x', d: 'x' }, 'logic/ABCD2', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('a') },
            { errMsg: ErrorMsg.missingRequiredProperty('c') },
            { errMsg: ErrorMsg.missingRequiredProperty('c') },
        ]));
        assertValidErr({ a: 'x', d: 'x' }, 'logic/ABCD2', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('c') },
        ]));

        // A | null
        assert.strictEqual(validator.validate({ a: 'sss' }, 'logic/AOrNull'), ValidateResultUtil.succ);
        assert.strictEqual(validator.validate(null, 'logic/AOrNull'), ValidateResultUtil.succ);
        assert.strictEqual(validator.validate([{ a: 'sss' }], 'logic/AOrNullArr'), ValidateResultUtil.succ);
        assert.strictEqual(validator.validate([null], 'logic/AOrNullArr'), ValidateResultUtil.succ);
    });

    it('Intersection: Basic', function () {
        // A & B
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic/AB'), ValidateResultUtil.succ);
        assertValidErr({ a: 'aa', b: 'bb', c: 'cc' }, 'logic/AB', ErrorMsg.excessProperty('c'));
        assertValidErr({ a: 'x' }, 'logic/AB', ErrorMsg.missingRequiredProperty('b'));
        assertValidErr({ a: 'x', b: 123 }, 'logic/AB', ErrorMsg.typeError('string', 'number'), ['b']);

        // (A & B) & C
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', c: 'c' }, 'logic/ABC'), ValidateResultUtil.succ);
        assertValidErr({ a: 'x', b: 'x' }, 'logic/ABC', ErrorMsg.missingRequiredProperty('c'));
        assertValidErr({ a: 'x', b: 'x', c: 'x', d: 1223 }, 'logic/ABC', ErrorMsg.excessProperty('d'));
        assertValidErr({ a: 'x', b: 'x', c: 123 }, 'logic/ABC', ErrorMsg.typeError('string', 'number'), ['c']);

        // A & (B|C) & D & { [key: string]: string | number }
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x', d: 'x', e: 1, f: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 1, d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 1, c: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assertValidErr({ a: 'x', d: 'x' }, 'logic/ABCD3', ErrorMsg.unionMembersNotMatch([
            { errMsg: ErrorMsg.missingRequiredProperty('b') },
            { errMsg: ErrorMsg.missingRequiredProperty('c') },
        ]));
        assertValidErr({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD3', ErrorMsg.typeError('string | number', 'boolean'), ['b'])
    })

    it('Intersection: Conflict', function () {
        assertValidErr({ value: 'xx' }, 'logic/Conflict', ErrorMsg.typeError('number', 'string'), ['value']);
        assertValidErr({ value: 123 }, 'logic/Conflict', ErrorMsg.typeError('string', 'number'), ['value']);
    });

    it('Union: mutual exclusion', function () {
        assert.deepStrictEqual(validator.validate({ type: 'string', value: 'x' }, 'logic/Conflict2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ type: 'number', value: 123 }, 'logic/Conflict2'), ValidateResultUtil.succ);
        assertValidErr({ type: 'string', value: 123 }, 'logic/Conflict2', ErrorMsg.unionMembersNotMatch([
            { errMsg: 'Property `value`: ' + ErrorMsg.typeError('string', 'number') },
            { errMsg: 'Property `type`: ' + ErrorMsg.invalidLiteralValue('number', 'string') },
        ]));
        assertValidErr({ type: 'number', value: 'x' }, 'logic/Conflict2', ErrorMsg.unionMembersNotMatch([
            { errMsg: 'Property `type`: ' + ErrorMsg.invalidLiteralValue('string', 'number') },
            { errMsg: 'Property `value`: ' + ErrorMsg.typeError('number', 'string') },
        ]));
        assertValidErr({}, 'logic/Conflict2', ErrorMsg.missingRequiredProperty('type'));
    })

    it('Union: indexSignature & excess check', function () {
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD4'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: true }, 'logic/ABCD4'), ValidateResultUtil.succ);
        assertValidErr({ a: true, b: true, c: true }, 'logic/ABCD4', ErrorMsg.unionMembersNotMatch([
            { errMsg: 'Property `a`: ' + ErrorMsg.typeError('string', 'boolean') },
            { errMsg: 'Property `b`: ' + ErrorMsg.typeError('string', 'boolean') },
            { errMsg: 'Property `a`: ' + ErrorMsg.typeError('number', 'boolean') },
        ]));
        assertValidErr({ a: true, b: true, c: 1 }, 'logic/ABCD4', ErrorMsg.unionMembersNotMatch([
            { errMsg: 'Property `a`: ' + ErrorMsg.typeError('string', 'boolean') },
            { errMsg: 'Property `b`: ' + ErrorMsg.typeError('string', 'boolean') },
            { errMsg: 'Property `a`: ' + ErrorMsg.typeError('number', 'boolean') },
        ]));
        assertValidErr({ a: 1, b: 1, c: 1 }, 'logic/ABCD4', undefined);
    })

    // it('Basic Intersection', function () {
    //     let validator = new TSBufferValidator({
    //         'a/a1': {
    //             type: 'Intersection',
    //             members: [
    //                 { id: 0, type: { type: 'String' } },
    //                 { id: 1, type: { type: 'String' } },
    //             ]
    //         },
    //         'a/a2': {
    //             type: 'Intersection',
    //             members: [
    //                 { id: 0, type: { type: 'String' } },
    //                 { id: 1, type: { type: 'Any' } },
    //             ]
    //         }
    //     });

    //     assert.deepStrictEqual(validator.validate('abc', 'a/a1'), ValidateResultUtil.succ);
    //     assert.deepStrictEqual(validator.validate('abc', 'a/a2'), ValidateResultUtil.succ);
    //     assert.deepStrictEqual(validator.validate(123, 'a/a1'), ValidateResultUtil.innerError('<Condition0>', ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(123, 'a/a2'), ValidateResultUtil.innerError('<Condition0>', ValidateErrorCode.WrongType));
    // });
})