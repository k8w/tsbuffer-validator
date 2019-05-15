import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

const proto: TSBufferProto = require('../../genTestSchemas/output');
let validator = new TSBufferValidator(proto);

describe('Interface Validate', function () {
    it('Interface: basic properties', function () {
        // 正常
        assert.strictEqual(validator.validate({ a: 'aaa', b: 1 }, 'interface1', 'default').isSucc, true);
        assert.strictEqual(validator.validate({ a: 'aaa', b: 1 }, 'interface1', 'Interface1').isSucc, true);

        // 缺少必须字段
        assert.deepStrictEqual(
            validator.validate({ a: 'aaa' }, 'interface1', 'Interface1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'b', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        );

        // 字段类型错误
        // 缺少必须字段
        assert.deepStrictEqual(
            validator.validate({ a: 'aaa', b: '123' }, 'interface1', 'Interface1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'b', ValidateResult.error(ValidateErrorCode.WrongType))
        )
    });

    it('Interface: optional fields', function () {
        // 可选字段
        assert.deepStrictEqual(
            validator.validate({ c: true }, 'interface1', 'Interface2'),
            ValidateResult.success
        )
        assert.strictEqual(validator.validate({ c: true }, 'interface1', 'Interface2').isSucc, true);
        assert.strictEqual(validator.validate({ c: true, d: undefined }, 'interface1', 'Interface2').isSucc, true);
        assert.strictEqual(validator.validate({ c: true, d: 'abc' }, 'interface1', 'Interface2').isSucc, true);

        // 字段类型错误
        assert.deepStrictEqual(
            validator.validate({ c: false, d: 123 }, 'interface1', 'Interface2'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'd', ValidateResult.error(ValidateErrorCode.WrongType))
        )
    });

    it('Interface: indexSignature: string key', function () {
        // 正常
        assert.strictEqual(validator.validate({
            a: 'aaa',
            b: 'bbbbb',
            name: 'test123',
            sex: 'm'
        }, 'interface1', 'Interface2_1').isSucc, true);

        // 缺少必须字段
        assert.deepStrictEqual(
            validator.validate({ name: 'test' }, 'interface1', 'Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'sex', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        );
        assert.deepStrictEqual(
            validator.validate({ sex: 'm' }, 'interface1', 'Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'name', ValidateResult.error(ValidateErrorCode.MissingRequiredMember))
        );

        // property优先级高于indexSignature
        assert.deepStrictEqual(
            validator.validate({
                name: 'xxxx',
                sex: 'yyyy'
            }, 'interface1', 'Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'sex', ValidateResult.error(ValidateErrorCode.NonConditionMet))
        );

        // index类型错误
        assert.deepStrictEqual(
            validator.validate({
                name: 'test',
                sex: 'm',
                other: 123
            }, 'interface1', 'Interface2_1'),
            ValidateResult.error(ValidateErrorCode.InnerError, 'other', ValidateResult.error(ValidateErrorCode.WrongType))
        );
    });

    it('Interface: indexSignature: number key', function () {
        // 正常
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx'
        }, 'interface1', 'Interface2_2'), ValidateResult.success);

        // Infinity和NaN不可作为NumberKey
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            Infinity: 'xxx'
        }, 'interface1', 'Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, 'Infinity',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            NaN: 'xxx'
        }, 'interface1', 'Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, 'NaN',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));

        // 字符串不可用作为Key
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            test123: 'xxx'
        }, 'interface1', 'Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, 'test123',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));
        assert.deepStrictEqual(validator.validate({
            0: 'aaa',
            123: 'xxxx',
            '000': 'xxx'
        }, 'interface1', 'Interface2_2'), ValidateResult.error(ValidateErrorCode.InnerError, '000',
            ValidateResult.error(ValidateErrorCode.InvalidNumberKey)
        ));
    });

    it('Interface: extends', function () {

    });

    it('Interface: nested interface', function () {

    })
})