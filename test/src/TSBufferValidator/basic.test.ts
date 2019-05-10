import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

describe('BasicType Validate', function () {
    it('boolean', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Boolean'
                }
            }
        });

        assert.strictEqual(validator.validate(true, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate(false, 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    })

    it('number', function () {
        let scalarTypes = [undefined, 'float', 'double'] as const;
        for (let scalarType of scalarTypes) {
            let validator = new TSBufferValidator({
                a: {
                    b: {
                        type: 'Number',
                        scalarType: scalarType
                    }
                }
            });

            assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
            assert.strictEqual(validator.validate(-123.4, 'a', 'b').isSucc, true);
            assert.deepStrictEqual(validator.validate(BigInt(1234), 'a', 'b'), ValidateResult.error(ValidateErrorCode.CantBeBigInt));
            assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            assert.deepStrictEqual(validator.validate('0', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            assert.deepStrictEqual(validator.validate('', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        }
    });

    it('int', function () {
        let scalarTypes = ['int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'fixed32', 'fixed64', 'sfixed32', 'sfixed64'] as const;
        for (let scalarType of scalarTypes) {
            let validator = new TSBufferValidator({
                a: {
                    b: {
                        type: 'Number',
                        scalarType: scalarType
                    }
                }
            });

            assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
            assert.strictEqual(validator.validate(0.0, 'a', 'b').isSucc, true);

            // Unsigned
            if (scalarType.startsWith('u') || scalarType.startsWith('fixed')) {
                assert.deepStrictEqual(validator.validate(-123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidUnsignedNumber));
            }
            // Signed
            else {
                assert.strictEqual(validator.validate(-123, 'a', 'b').isSucc, true);
            }

            // BigInt
            if (scalarType.indexOf('64') > -1) {
                assert.deepStrictEqual(validator.validate(BigInt(1234), 'a', 'b'), ValidateResult.success);
            }
            // not BigInt
            else {
                assert.deepStrictEqual(validator.validate(BigInt(1234), 'a', 'b'), ValidateResult.error(ValidateErrorCode.CantBeBigInt));
            }

            // 小数
            assert.deepStrictEqual(validator.validate(1.234, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidInteger));
            assert.deepStrictEqual(validator.validate(-1.234, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidInteger));
        }
    });
})