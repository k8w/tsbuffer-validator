import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

describe('BasicType Validate', function () {
    it('Boolean', function () {
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

    it('Number', function () {
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

    it('Number: int', function () {
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

    it('String', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'String'
                }
            }
        });

        assert.strictEqual(validator.validate('asdgasdg', 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate('false', 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    })

    it('Enum', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Enum',
                    members: [
                        { id: 0, value: 0 },
                        { id: 1, value: 1 },
                        { id: 2, value: 'ABC' },
                    ]
                }
            }
        });

        assert.strictEqual(validator.validate(0, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate(1, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate('ABC', 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate('0', 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidEnumValue));
        assert.deepStrictEqual(validator.validate('1', 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidEnumValue));
        assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidEnumValue));
        assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    })

    it('Any', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Any'
                }
            }
        });

        assert.strictEqual(validator.validate(true, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate(null, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate(undefined, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate('123', 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate({}, 'a', 'b').isSucc, true);
    })

    it('Literal', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Literal',
                    literal:'123'
                }
            }
        });
        assert.strictEqual(validator.validate('123', 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

        validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Literal',
                    literal: 123
                }
            }
        });
        assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

        validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Literal',
                    literal: true
                }
            }
        });
        assert.strictEqual(validator.validate(true, 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(1, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

        validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Literal',
                    literal: null
                }
            }
        });
        assert.strictEqual(validator.validate(null, 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

        validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Literal',
                    literal: undefined
                }
            }
        });
        assert.strictEqual(validator.validate(undefined, 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));
    })

    it('NonPrimitive', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'NonPrimitive'
                }
            }
        });

        assert.strictEqual(validator.validate({a:1}, 'a', 'b').isSucc, true);
        assert.strictEqual(validator.validate([1, 2, 3], 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    })

    it('Buffer', function () {
        let validator = new TSBufferValidator({
            a: {
                b: {
                    type: 'Buffer'
                }
            }
        });
        assert.strictEqual(validator.validate(new ArrayBuffer(10), 'a', 'b').isSucc, true);
        assert.deepStrictEqual(validator.validate(new Uint8Array(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate([], 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    
        let typedArrays = ['Int8Array', 'Int16Array', 'Int32Array', 'BigInt64Array', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'BigUint64Array', 'Float32Array', 'Float64Array'] as const;
        for (let arrayType of typedArrays) {
            validator = new TSBufferValidator({
                a: {
                    b: {
                        type: 'Buffer',
                        arrayType: arrayType
                    }
                }
            });

            let typedArray = eval(arrayType);
            assert.strictEqual(validator.validate(new typedArray(10), 'a', 'b').isSucc, true);
            assert.deepStrictEqual(validator.validate(new ArrayBuffer(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            if (arrayType !== 'Uint8Array') {
                assert.deepStrictEqual(validator.validate(new Uint8Array(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            }
            else {
                assert.deepStrictEqual(validator.validate(new Uint16Array(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
            }
        }
    })
})