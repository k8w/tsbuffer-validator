import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { i18n } from '../../../src/ErrorMsg';
import { ValidateResultError, ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('LogicType', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    function assertValidErr(value: any, schemaId: string, errMsg: string, property?: string[], other?: Partial<ValidateResultError>) {
        if (!property?.length) {
            property = undefined;
        }
        let vRes = validator.validate(value, schemaId);
        assert.deepStrictEqual(vRes.errMsg, ValidateResultError.getErrMsg(errMsg, property));
        assert.deepStrictEqual(vRes.property, property);
        if (other) {
            for (let key in other) {
                let _key = key as keyof ValidateResultError;
                assert.deepStrictEqual(vRes[_key], other[_key]);
            }
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
        assertValidErr({ c: 'c', d: 'd', e: 'e' }, 'logic/CD', i18n.noMatchedUnionMember);
        assertValidErr({ c: 'c', e: 'e' }, 'logic/CD', i18n.noMatchedUnionMember);
        assertValidErr(123, 'logic/CD', i18n.noMatchedUnionMember);

        // B | C | D
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd' }, 'logic/BCD'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 123, d: null }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/BCD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ b: 'b', c: 'c', d: 'd', e: 'e' }, 'logic/BCD', i18n.noMatchedUnionMember);
        assertValidErr({ b: 'b', e: 'e' }, 'logic/BCD', i18n.noMatchedUnionMember);

        // A & B | C & D
        assert.deepStrictEqual(validator.validate({ a: 'aaa', b: 'bb' }, 'logic/ABCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 4, b: null, c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'a' }, 'logic/ABCD', i18n.noMatchedUnionMember);
        assertValidErr({ c: 'c' }, 'logic/ABCD', i18n.noMatchedUnionMember);
        assertValidErr({ a: 'a', c: 'c' }, 'logic/ABCD', i18n.noMatchedUnionMember);
        assertValidErr({ a: 'a', b: 'b', e: 'e' }, 'logic/ABCD', i18n.noMatchedUnionMember);

        // A | B&C | D
        assert.deepStrictEqual(validator.validate({ a: 'aaa' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 1, c: true, d: null }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: null, b: 1, c: true, d: 'd' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: null, b: 'b', c: 'c', d: 12 }, 'logic/ABCD1'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'a', e: 'e' }, 'logic/ABCD1', i18n.noMatchedUnionMember);
        assertValidErr({ d: 'a', e: 'e' }, 'logic/ABCD1', i18n.noMatchedUnionMember);
        assertValidErr({ b: 'b', c: 'c', e: 'e' }, 'logic/ABCD1', i18n.noMatchedUnionMember);

        // A&B | B&C | C&D
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'x', c: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x', a: 1, b: 2 }, 'logic/ABCD2'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'x', c: 'x' }, 'logic/ABCD2', i18n.noMatchedUnionMember);
        assertValidErr({ b: 'x', d: 'x' }, 'logic/ABCD2', i18n.noMatchedUnionMember);
        assertValidErr({ a: 'x', d: 'x' }, 'logic/ABCD2', i18n.noMatchedUnionMember);

        // A | null
        assert.strictEqual(validator.validate({ a: 'sss' }, 'logic/AOrNull'), ValidateResultUtil.succ);
        assert.strictEqual(validator.validate(null, 'logic/AOrNull'), ValidateResultUtil.succ);
        assert.strictEqual(validator.validate([{ a: 'sss' }], 'logic/AOrNullArr'), ValidateResultUtil.succ);
        assert.strictEqual(validator.validate([null], 'logic/AOrNullArr'), ValidateResultUtil.succ);
    });

    it('Intersection: Basic', function () {
        // A & B
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic/AB'), ValidateResultUtil.succ);
        assertValidErr({ a: 'aa', b: 'bb', c: 'cc' }, 'logic/AB', i18n.excessProperty('c'));
        assertValidErr({ a: 'x' }, 'logic/AB', i18n.missingRequiredProperty('b'));
        assertValidErr({ a: 'x', b: 123 }, 'logic/AB', i18n.typeError('string', 'number'), ['b']);

        // (A & B) & C
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', c: 'c' }, 'logic/ABC'), ValidateResultUtil.succ);
        assertValidErr({ a: 'x', b: 'x' }, 'logic/ABC', i18n.missingRequiredProperty('c'), undefined, {
            fromIntersection: {
                schema: validator.proto['logic/ABC'] as any,
                errorMemberIndex: 1
            }
        });
        assertValidErr({ a: 'x', b: 'x', c: 'x', d: 1223 }, 'logic/ABC', i18n.excessProperty('d'), undefined, {
            fromIntersection: {
                schema: validator.proto['logic/ABC'] as any,
                errorMemberIndex: 0
            }
        });
        assertValidErr({ a: 'x', b: 'x', c: 123 }, 'logic/ABC', i18n.typeError('string', 'number'), ['c'], {
            fromIntersection: {
                schema: validator.proto['logic/ABC'] as any,
                errorMemberIndex: 1
            }
        });

        // A & (B|C) & D & { [key: string]: string | number }
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x', d: 'x', e: 1, f: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 1, d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 1, c: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assertValidErr({ a: 'x', d: 'x' }, 'logic/ABCD3', i18n.noMatchedUnionMember, undefined, {
            // unionMemberErrors: [
            //     ValidateResultUtil.error(i18n.missingRequiredProperty('b'), { a: 'x', d: 'x' }, validator.proto['logic/B']),
            //     ValidateResultUtil.error(i18n.missingRequiredProperty('c'), { a: 'x', d: 'x' }, validator.proto['logic/C']),
            // ],
            fromIntersection: {
                schema: validator.proto['logic/ABCD3'] as any,
                errorMemberIndex: 1
            }
        })
        assertValidErr({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD3', i18n.noMatchedUnionMember, ['b'], {
            unionMemberErrors: [
                ValidateResultUtil.error(i18n.typeError('string', 'boolean'), true, { type: 'String' }),
                ValidateResultUtil.error(i18n.typeError('number', 'boolean'), true, { type: 'Number' }),
            ],
            fromIntersection: {
                schema: validator.proto['logic/ABCD3'] as any,
                errorMemberIndex: 3
            }
        })

    })

    // it('Intersection: Conflict', function () {
    //     assert.deepStrictEqual(validator.validate({ value: 'xx' }, 'logic/Conflict'), ValidateResultUtil.error(
    //         ValidateErrorCode.InnerError, '<Condition1>', ValidateResultUtil.error(ValidateErrorCode.InnerError, 'value', ValidateResultUtil.error(ValidateErrorCode.WrongType))
    //     ));
    //     assert.deepStrictEqual(validator.validate({ value: 123 }, 'logic/Conflict'), ValidateResultUtil.error(
    //         ValidateErrorCode.InnerError, '<Condition0>', ValidateResultUtil.error(ValidateErrorCode.InnerError, 'value', ValidateResultUtil.error(ValidateErrorCode.WrongType))
    //     ));
    // });

    // it('Union: mutual exclusion', function () {
    //     assert.deepStrictEqual(validator.validate({ type: 'string', value: 'x' }, 'logic/Conflict2'), ValidateResultUtil.succ);
    //     assert.deepStrictEqual(validator.validate({ type: 'number', value: 123 }, 'logic/Conflict2'), ValidateResultUtil.succ);
    //     assert.deepStrictEqual(validator.validate({ type: 'string', value: 123 }, 'logic/Conflict2'), ValidateResultUtil.error(ValidateErrorCode.NonConditionMet));
    //     assert.deepStrictEqual(validator.validate({ type: 'number', value: 'x' }, 'logic/Conflict2'), ValidateResultUtil.error(ValidateErrorCode.NonConditionMet));
    //     assert.deepStrictEqual(validator.validate({}, 'logic/Conflict2'), ValidateResultUtil.error(ValidateErrorCode.NonConditionMet));
    // })

    // it('Union: indexSignature & excess check', function () {
    //     assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD4'), ValidateResultUtil.succ);
    //     assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: true }, 'logic/ABCD4'), ValidateResultUtil.succ);
    //     assert.deepStrictEqual(validator.validate({ a: true, b: true, c: true }, 'logic/ABCD4'), ValidateResultUtil.error(ValidateErrorCode.NonConditionMet));
    //     assert.deepStrictEqual(validator.validate({ a: true, b: true, c: 1 }, 'logic/ABCD4'), ValidateResultUtil.error(ValidateErrorCode.NonConditionMet));
    //     assert.deepStrictEqual(validator.validate({ a: 1, b: 1, c: 1 }, 'logic/ABCD4'), ValidateResultUtil.succ);
    // })

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