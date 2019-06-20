import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

const proto: TSBufferProto = require('../../genTestSchemas/output');
let validator = new TSBufferValidator(proto);

describe('Interface Validate', function () {
    it('Interface: basic properties', function () {
        // 正常
        assert.strictEqual(validator.validate({ a: 'aaa', b: 1 }, 'interface1/default').isSucc, true);
        assert.strictEqual(validator.validate({ a: 'aaa', b: 1 }, 'interface1/Interface1').isSucc, true);

        // 缺少必须字段
        assert.deepStrictEqual(
            validator.validate({ a: 'aaa' }, 'interface1/Interface1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'b', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        );

        // 字段类型错误
        // 缺少必须字段
        assert.deepStrictEqual(
            validator.validate({ a: 'aaa', b: '123' }, 'interface1/Interface1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'b', ValidateResult.error(ValidateErrorCode.WrongType))
        )
    });

    it('Interface: optional fields', function () {
        // 可选字段
        assert.deepStrictEqual(
            validator.validate({ c: true }, 'interface1/Interface2'),
            ValidateResult.success
        )
        assert.strictEqual(validator.validate({ c: true }, 'interface1/Interface2').isSucc, true);
        assert.strictEqual(validator.validate({ c: true, d: undefined }, 'interface1/Interface2').isSucc, true);
        assert.strictEqual(validator.validate({ c: true, d: 'abc' }, 'interface1/Interface2').isSucc, true);

        // 字段类型错误
        assert.deepStrictEqual(
            validator.validate({ c: false, d: 123 }, 'interface1/Interface2'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'd', ValidateResult.error(ValidateErrorCode.WrongType))
        )
    });

    it('Interface: indexSignature: string key', function () {
        // 正常
        assert.deepStrictEqual(validator.validate({
            a: 'aaa',
            b: 'bbbbb',
            name: 'test123',
            sex: 'm'
        }, 'interface1/Interface2_1'), ValidateResult.success);

        // 缺少必须字段
        assert.deepStrictEqual(
            validator.validate({ name: 'test' }, 'interface1/Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'sex', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        );
        assert.deepStrictEqual(
            validator.validate({ sex: 'm' }, 'interface1/Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'name', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        );

        // property优先级高于indexSignature
        assert.deepStrictEqual(
            validator.validate({
                name: 'xxxx',
                sex: 'yyyy'
            }, 'interface1/Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'sex', ValidateResult.error(ValidateErrorCode.NonConditionMet))
        );

        // index类型错误
        assert.deepStrictEqual(
            validator.validate({
                name: 'test',
                sex: 'm',
                other: 123
            }, 'interface1/Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'other', ValidateResult.error(ValidateErrorCode.WrongType))
        );
    });

    it('Interface: indexSignature: number key', function () {
        // 正常
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx'
        }, 'interface1/Interface2_2'), ValidateResult.success);

        // Infinity和NaN不可作为NumberKey
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            Infinity: 'xxx'
        }, 'interface1/Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, 'Infinity',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            NaN: 'xxx'
        }, 'interface1/Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, 'NaN',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));

        // 字符串不可用作为Key
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            test123: 'xxx'
        }, 'interface1/Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, 'test123',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            '000': 'xxx'
        }, 'interface1/Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, '000',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));
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
        }, 'interface2/Interface6'), ValidateResult.success);

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
            assert.deepStrictEqual(validator.validate(value, 'interface2/Interface6'), ValidateResult.error(
                ValidateErrorCode.InnerError,
                v,
                ValidateResult.error(ValidateErrorCode.MissingRequiredMember)
            ));
        });

        // 字段类型错误
        assert.deepStrictEqual(validator.validate({
            value1: {
                a: 1,
                b: 1
            },
            value2: {
                c: false
            },
            value3: 'xxxxxx',
            value4: { value: 0 }
        }, 'interface2/Interface6'), ValidateResult.error(
            ValidateErrorCode.InnerError,
            'value1',
            ValidateResult.error(ValidateErrorCode.InnerError, 'a', ValidateResult.error(ValidateErrorCode.WrongType))
        ));
    });

    it('Interface: extends indexSignature', function () {
        // 成功
        assert.deepStrictEqual(validator.validate({
            value3: '1234',
            value4: 'abcd',
            is1: 'xxx',
            is2: 'xxx'
        }, 'interface2/Interface8'), ValidateResult.success);

        // property内字段，property对，但indexSignature错误
        assert.deepStrictEqual(validator.validate({
            value3: 1234,
            value4: 'abcd'
        }, 'interface2/Interface8'), ValidateResult.error(ValidateErrorCode.InnerError, 'value3', ValidateResult.error(ValidateErrorCode.WrongType)));

        // indexSignature错误
        assert.deepStrictEqual(validator.validate({
            value3: '1234',
            value4: 'abcd',
            aaaa: 1234
        }, 'interface2/Interface8'), ValidateResult.error(ValidateErrorCode.InnerError, 'aaaa', ValidateResult.error(ValidateErrorCode.WrongType)));

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
        }, 'interface2/Interface4'), ValidateResult.success);

        // 内部错误
        // 成功
        assert.deepStrictEqual(validator.validate({
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
        }, 'interface2/Interface4'), ValidateResult.error(ValidateErrorCode.InnerError, 'value1',
            ValidateResult.error(ValidateErrorCode.InnerError, 'value1', ValidateResult.error(ValidateErrorCode.InnerError, 'a',
                ValidateResult.error(ValidateErrorCode.WrongType)
            ))
        ));

        // originalError
        let originalError = validator.validate({
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
        }, 'interface2/Interface4').originalError
        assert.deepStrictEqual(originalError, new ValidateResult(ValidateErrorCode.WrongType, 'value1.value1.a'));
        assert.deepStrictEqual(originalError.message, 'value1.value1.a: WrongType');
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

        assert.deepStrictEqual(validator.validate({}, 'a/b'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate({ value: 'aaa' }, 'a/b'), ValidateResult.success);
    })
})