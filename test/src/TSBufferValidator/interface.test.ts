import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { i18n } from '../../../src/i18n';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResultError, ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('Interface Validate', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    function assertValidErr(value: any, schemaId: string, errMsg: string, property?: string[], other?: Partial<ValidateResultError>) {
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

    it('Interface: basic properties', function () {
        // 正常
        assert.strictEqual(validator.validate({ a: 'aaa', b: 1 }, 'interface1/default').isSucc, true);
        assert.strictEqual(validator.validate({ a: 'aaa', b: 1 }, 'interface1/Interface1').isSucc, true);

        // 缺少必须字段
        assertValidErr({ a: 'aaa' }, 'interface1/Interface1', i18n.missingRequiredProperty('b'))

        // 字段类型错误
        // 缺少必须字段
        assertValidErr({ a: 'aaa', b: '123' }, 'interface1/Interface1', i18n.typeError('number', 'string'), ['b'])
    });

    it('Interface: optional fields', function () {
        // 可选字段
        assert.deepStrictEqual(
            validator.validate({ c: true }, 'interface1/Interface2'),
            ValidateResultUtil.succ
        )
        assert.strictEqual(validator.validate({ c: true }, 'interface1/Interface2').isSucc, true);
        assert.strictEqual(validator.validate({ c: true, d: undefined }, 'interface1/Interface2').isSucc, true);
        assert.strictEqual(validator.validate({ c: true, d: 'abc' }, 'interface1/Interface2').isSucc, true);

        // 字段类型错误
        assertValidErr({ c: false, d: 123 }, 'interface1/Interface2', i18n.typeError('string', 'number'), ['d']);
    });

    it('Interface: indexSignature: string key', function () {
        // 正常
        assert.deepStrictEqual(validator.validate({
            a: 'aaa',
            b: 'bbbbb',
            name: 'test123',
            sex: 'm'
        }, 'interface1/Interface2_1'), ValidateResultUtil.succ);

        // 缺少必须字段
        assertValidErr({ name: 'test' }, 'interface1/Interface2_1', i18n.missingRequiredProperty('sex'))
        assertValidErr({ sex: 'm' }, 'interface1/Interface2_1', i18n.missingRequiredProperty('name'))

        // property优先级高于indexSignature
        assertValidErr({
            name: 'xxxx',
            sex: 'yyyy'
        }, 'interface1/Interface2_1', i18n.noMatchedUnionMember, ['sex'])

        // index类型错误
        assertValidErr({
            name: 'test',
            sex: 'm',
            other: 123
        }, 'interface1/Interface2_1', i18n.typeError('string', 'number'), ['other'])
    });

    it('Interface: indexSignature: number key', function () {
        // 正常
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx'
        }, 'interface1/Interface2_2'), ValidateResultUtil.succ);

        // Infinity和NaN不可作为NumberKey
        assertValidErr({
            0: 'aaa',
            123: 'xxxx',
            Infinity: 'xxx'
        }, 'interface1/Interface2_2', i18n.invalidNumberKey('Infinity'))

        // 字符串不可用作为Key
        assertValidErr({
            0: 'aaa',
            123: 'xxxx',
            test123: 'xxx'
        }, 'interface1/Interface2_2', i18n.invalidNumberKey('test123'))
        assertValidErr({
            0: 'aaa',
            123: 'xxxx',
            '000': 'xxx'
        }, 'interface1/Interface2_2', i18n.invalidNumberKey('000'))
    });

    it('Interface: extends properties', function () {
        // 成功
        assert.deepStrictEqual(validator.validate({
            value1: {
                a: 'a',
                b: 1
            },
            value2: {
                c: false,
                d: 'ddd'
            },
            value3: 'xxxxxx',
            value4: { value: 0 }
        }, 'interface2/Interface6'), ValidateResultUtil.succ);

        // 缺少必要字段
        ['value1', 'value2', 'value3', 'value4'].forEach(v => {
            let value: any = {
                value1: {
                    a: 'a',
                    b: 1
                },
                value2: {
                    c: false,
                    d: 'ddd'
                },
                value3: 'xxxxxx',
                value4: { value: 0 }
            };
            delete value[v];
            assertValidErr(value, 'interface2/Interface6', i18n.missingRequiredProperty(v))
        });

        // 字段类型错误
        assertValidErr({
            value1: {
                a: 1,
                b: 1
            },
            value2: {
                c: false
            },
            value3: 'xxxxxx',
            value4: { value: 0 }
        }, 'interface2/Interface6', i18n.typeError('string', 'number'), ['value1', 'a'])
    });

    it('Interface: extends indexSignature', function () {
        // 成功
        assert.deepStrictEqual(validator.validate({
            value3: '1234',
            value4: 'abcd',
            is1: 'xxx',
            is2: 'xxx'
        }, 'interface2/Interface8'), ValidateResultUtil.succ);

        // property内字段，property对，但indexSignature错误
        assertValidErr({
            value3: 1234,
            value4: 'abcd'
        }, 'interface2/Interface8', i18n.typeError('string', 'number'), ['value3'])

        // indexSignature错误
        assertValidErr({
            value3: '1234',
            value4: 'abcd',
            aaaa: 1234
        }, 'interface2/Interface8', i18n.typeError('string', 'number'), ['aaaa']);
    })

    it('Interface: nested interface', function () {
        // 成功
        assert.deepStrictEqual(validator.validate({
            value1: {
                value1: {
                    a: 'a',
                    b: 1
                },
                value2: {
                    c: true
                }
            },
            value2: 'b'
        }, 'interface2/Interface4'), ValidateResultUtil.succ);

        // 内部错误
        // 成功
        assertValidErr({
            value1: {
                value1: {
                    a: 1,
                    b: 1
                },
                value2: {
                    c: true
                }
            },
            value2: 'b'
        }, 'interface2/Interface4', i18n.typeError('string', 'number'), ['value1', 'value1', 'a'], {
            value: 1,
            schema: { type: 'String' }
        })
    })

    it('Cannot extend from non-interface', function () {
        let validator = new TSBufferValidator({
            'a/a1': {
                type: 'String'
            },
            'a/b1': {
                type: 'Interface',
                extends: [{
                    id: 0,
                    type: {
                        type: 'Reference',
                        target: 'a/a1'
                    }
                }]
            }
        })
        assert.throws(() => {
            validator.validate({ a: 1 }, 'a/b1')
        })
    })

    it('Required | undefined', function () {
        let validator = new TSBufferValidator({
            'a/b': {
                type: 'Interface',
                properties: [
                    {
                        id: 0,
                        name: 'value',
                        type: {
                            type: 'Union',
                            members: [
                                {
                                    id: 0,
                                    type: { type: 'String' }
                                },
                                {
                                    id: 1,
                                    type: {
                                        type: 'Literal',
                                        literal: undefined
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        })

        assert.deepStrictEqual(validator.validate({}, 'a/b'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ value: 'aaa' }, 'a/b'), ValidateResultUtil.succ);
    })
})