import * as assert from 'assert';
import { TSBufferSchema } from 'tsbuffer-schema';
import { LiteralTypeSchema } from 'tsbuffer-schema/src/schemas/LiteralTypeSchema';
import { i18n } from '../../../src/i18n';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('BasicType Validate', function () {
    it('Unexist path or symbolName', function () {
        let validator = new TSBufferValidator({
            'a/b': {
                type: 'xxx' as any
            },
            'a/c': {
                type: 'Reference',
                target: 'x/x'
            },
            'a/d': {
                type: 'Reference',
                target: 'a/x'
            }
        }, {});

        assert.throws(() => {
            validator.validate(1, 'xxx/xxx' as any)
        })

        assert.throws(() => {
            validator.validate(1, 'a/xxx' as any)
        })

        assert.throws(() => {
            validator.validate(1, 'a/b')
        })

        assert.throws(() => {
            validator.validate(1, 'a/c')
        })

        assert.throws(() => {
            validator.validate(1, 'a/d')
        })
    })

    it('Boolean', function () {
        let schema: TSBufferSchema = {
            type: 'Boolean'
        };
        let validator = new TSBufferValidator({
            'a/b': schema
        });

        assert.strictEqual(validator.validate(true, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate(false, 'a/b').isSucc, true);
        assert.deepStrictEqual(validator.validate(null, 'a/b'), ValidateResultUtil.error(i18n.typeError('boolean', 'null'), null, schema));
        assert.deepStrictEqual(validator.validate(undefined, 'a/b'), ValidateResultUtil.error(i18n.typeError('boolean', 'undefined'), undefined, schema));
        assert.deepStrictEqual(validator.validate(123, 'a/b'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate({}, 'a/b'), ValidateResultUtil.error(i18n.typeError('boolean', 'object'), {}, schema));
        assert.deepStrictEqual(validator.validate('123', 'a/b'), ValidateResultUtil.error(i18n.typeError('boolean', 'string'), '123', schema));
    })

    it('Number: number', function () {
        let scalarTypes = [undefined, 'double'] as const;
        for (let scalarType of scalarTypes) {
            let schema: TSBufferSchema = {
                type: 'Number',
                scalarType: scalarType
            };
            let validator = new TSBufferValidator({
                'a/b': schema
            });

            assert.strictEqual(validator.validate(123, 'a/b').isSucc, true);
            assert.strictEqual(validator.validate(-123.4, 'a/b').isSucc, true);
            assert.deepStrictEqual(validator.validate(BigInt(1234), 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'bigint'), BigInt(1234), schema));
            assert.deepStrictEqual(validator.validate(null, 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'null'), null, schema));
            assert.deepStrictEqual(validator.validate(undefined, 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'undefined'), undefined, schema));
            assert.deepStrictEqual(validator.validate(true, 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'boolean'), true, schema));
            assert.deepStrictEqual(validator.validate({}, 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'object'), {}, schema));
            assert.deepStrictEqual(validator.validate('123', 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'string'), '123', schema));
            assert.deepStrictEqual(validator.validate('0', 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'string'), '0', schema));
            assert.deepStrictEqual(validator.validate('', 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'string'), '', schema));
        }
    });

    it('Number: int', function () {
        let scalarTypes = ['int', 'uint'] as const;
        for (let scalarType of scalarTypes) {
            let schema: TSBufferSchema = {
                type: 'Number',
                scalarType: scalarType
            };
            let validator = new TSBufferValidator({
                'a/b': schema
            });

            assert.strictEqual(validator.validate(123, 'a/b').isSucc, true);
            assert.strictEqual(validator.validate(0.0, 'a/b').isSucc, true);

            // Unsigned
            if (scalarType.startsWith('u') || scalarType.startsWith('fixed')) {
                assert.deepStrictEqual(validator.validate(-123, 'a/b'), ValidateResultUtil.error(i18n.invalidScalarType(-123, scalarType), -123, schema));
            }
            // Signed
            else {
                assert.strictEqual(validator.validate(-123, 'a/b').isSucc, true);
            }

            // not BigInt
            assert.deepStrictEqual(validator.validate(BigInt(1234), 'a/b'), ValidateResultUtil.error(i18n.typeError('number', 'bigint'), BigInt(1234), schema));

            // 小数
            assert.deepStrictEqual(validator.validate(1.234, 'a/b'), ValidateResultUtil.error(i18n.invalidScalarType(1.234, scalarType), 1.234, schema));
            assert.deepStrictEqual(validator.validate(-1.234, 'a/b'), ValidateResultUtil.error(i18n.invalidScalarType(-1.234, scalarType), -1.234, schema));
        }
    });

    it('Number: bigint', function () {
        (['bigint', 'bigint64', 'biguint64'] as const).forEach(v => {
            let schema: TSBufferSchema = {
                type: 'Number',
                scalarType: v
            };
            let validator = new TSBufferValidator({
                'a/b': schema
            });
            assert.deepStrictEqual(validator.validate(BigInt(1234), 'a/b'), ValidateResultUtil.succ);
            assert.deepStrictEqual(validator.validate(1234, 'a/b'), ValidateResultUtil.error(i18n.typeError('bigint', 'number'), 1234, schema));
            assert.deepStrictEqual(validator.validate(1.234, 'a/b'), ValidateResultUtil.error(i18n.typeError('bigint', 'number'), 1.234, schema));
            assert.deepStrictEqual(validator.validate(true, 'a/b'), ValidateResultUtil.error(i18n.typeError('bigint', 'boolean'), true, schema));
            assert.deepStrictEqual(validator.validate('', 'a/b'), ValidateResultUtil.error(i18n.typeError('bigint', 'string'), '', schema));
            assert.deepStrictEqual(validator.validate('123', 'a/b'), ValidateResultUtil.error(i18n.typeError('bigint', 'string'), '123', schema));

        })
    })

    it('String', function () {
        let schema = {
            type: 'String'
        } as const;
        let validator = new TSBufferValidator({
            'a/b': schema
        });

        assert.strictEqual(validator.validate('asdgasdg', 'a/b').isSucc, true);
        assert.strictEqual(validator.validate('false', 'a/b').isSucc, true);
        ([
            [null, 'null'],
            [undefined, 'undefined'],
            [123, 'number'],
            [{}, 'object'],
        ] as [any, string][]).forEach(v => {
            assert.deepStrictEqual(validator.validate(v[0], 'a/b'), ValidateResultUtil.error(i18n.typeError('string', v[1]), v[0], schema));
        })
    })

    it('Enum', function () {
        let schema: TSBufferSchema = {
            type: 'Enum',
            members: [
                { id: 0, value: 0 },
                { id: 1, value: 1 },
                { id: 2, value: 'ABC' },
            ]
        };
        let validator = new TSBufferValidator({
            'a/b': schema
        });

        assert.strictEqual(validator.validate(0, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate(1, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate('ABC', 'a/b').isSucc, true);
        ([
            '0',
            '1',
            123
        ] as any[]).forEach(v => {
            assert.deepStrictEqual(validator.validate(v, 'a/b'), ValidateResultUtil.error(i18n.invalidEnumValue(v), v, schema));
        });
        ([
            [{}, 'object'],
            [true, 'boolean'],
            [null, 'null'],
            [undefined, 'undefined']
        ] as [any, string][]).forEach(v => {
            assert.deepStrictEqual(validator.validate(v[0], 'a/b'), ValidateResultUtil.error(i18n.typeError('string | number', v[1]), v[0], schema));
        });
    })

    it('Any', function () {
        let validator = new TSBufferValidator({
            'a/b': {
                type: 'Any'
            }
        });

        assert.strictEqual(validator.validate(true, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate(null, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate(undefined, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate(123, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate('123', 'a/b').isSucc, true);
        assert.strictEqual(validator.validate({}, 'a/b').isSucc, true);
    })

    it('Literal', function () {
        let schema: LiteralTypeSchema = {
            type: 'Literal',
            literal: '123'
        }
        let validator = new TSBufferValidator({
            'a/b': schema
        });
        assert.strictEqual(validator.validate('123', 'a/b').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue(123, schema.literal), 123, schema));
        assert.deepStrictEqual(validator.validate(null, 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue(null, schema.literal), null, schema));
        assert.deepStrictEqual(validator.validate(undefined, 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue(undefined, schema.literal), undefined, schema));

        let schema1: LiteralTypeSchema = {
            type: 'Literal',
            literal: 123
        };
        let validator1 = new TSBufferValidator({
            'a/b': schema1
        });
        assert.strictEqual(validator1.validate(123, 'a/b').isSucc, true);
        assert.deepStrictEqual(validator1.validate('123', 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue('123', schema1.literal), '123', schema1));

        let schema2: LiteralTypeSchema = {
            type: 'Literal',
            literal: true
        }
        let validator2 = new TSBufferValidator({
            'a/b': schema2
        });
        assert.strictEqual(validator2.validate(true, 'a/b').isSucc, true);
        assert.deepStrictEqual(validator2.validate(1, 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue(1, schema2.literal), 1, schema2));

        let schema3: LiteralTypeSchema = {
            type: 'Literal',
            literal: null
        };
        let validator3 = new TSBufferValidator({
            'a/b': schema3
        });
        assert.strictEqual(validator3.validate(null, 'a/b').isSucc, true);
        assert.deepStrictEqual(validator3.validate(undefined, 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue(undefined, schema3.literal), undefined, schema3));

        let schema4: LiteralTypeSchema = {
            type: 'Literal',
            literal: undefined
        };
        let validator4 = new TSBufferValidator({
            'a/b': schema4
        });
        assert.strictEqual(validator4.validate(undefined, 'a/b').isSucc, true);
        assert.deepStrictEqual(validator4.validate(null, 'a/b'), ValidateResultUtil.error(i18n.invalidLiteralValue(null, schema4.literal), null, schema4));
    })

    it('strictNullChecks false', function () {
        let validator = new TSBufferValidator({
            'a/b': {
                type: 'Literal',
                literal: null
            }
        }, {
            strictNullChecks: false
        });
        assert.deepStrictEqual(validator.validate(undefined, 'a/b'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate(null, 'a/b'), ValidateResultUtil.succ);

        let validator1 = new TSBufferValidator({
            'a/b': {
                type: 'Literal',
                literal: undefined
            }
        }, {
            strictNullChecks: false
        });
        assert.deepStrictEqual(validator1.validate(undefined, 'a/b'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator1.validate(null, 'a/b'), ValidateResultUtil.succ);

        let validator2 = new TSBufferValidator({
            'a/b': {
                type: 'Interface',
                properties: [
                    {
                        id: 0,
                        name: 'value',
                        type: {
                            type: 'String'
                        },
                        optional: true
                    }
                ]
            }
        }, {
            strictNullChecks: false
        });
        assert.deepStrictEqual(validator2.validate({ value: undefined }, 'a/b'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator2.validate({ value: null }, 'a/b'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator2.validate({}, 'a/b'), ValidateResultUtil.succ);
    })

    it('NonPrimitive', function () {
        let schema = {
            type: 'NonPrimitive'
        } as const;
        let validator = new TSBufferValidator({
            'a/b': schema
        });

        assert.strictEqual(validator.validate({ a: 1 }, 'a/b').isSucc, true);
        assert.strictEqual(validator.validate([1, 2, 3], 'a/b').isSucc, true);
        assert.deepStrictEqual(validator.validate(null, 'a/b'), ValidateResultUtil.error(i18n.typeError('object', 'null'), null, schema));
        assert.deepStrictEqual(validator.validate(undefined, 'a/b'), ValidateResultUtil.error(i18n.typeError('object', 'undefined'), undefined, schema));
        assert.deepStrictEqual(validator.validate(123, 'a/b'), ValidateResultUtil.error(i18n.typeError('object', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate(true, 'a/b'), ValidateResultUtil.error(i18n.typeError('object', 'boolean'), true, schema));
        assert.deepStrictEqual(validator.validate('123', 'a/b'), ValidateResultUtil.error(i18n.typeError('object', 'string'), '123', schema));
    })

    it('Buffer', function () {
        let schema = {
            type: 'Buffer'
        } as const;
        let validator = new TSBufferValidator({
            'a/b': schema,
            'a/c': {
                type: 'Buffer',
                arrayType: 'xxx' as any
            }
        });

        assert.throws(() => {
            validator.validate(new Uint16Array(1), 'a/c');
        })

        assert.strictEqual(validator.validate(new ArrayBuffer(10), 'a/b').isSucc, true);

        [
            new Uint8Array(10),
            null,
            undefined,
            123,
            true,
            123,
            {},
            []
        ].forEach(v => {
            assert.deepStrictEqual(validator.validate(v, 'a/b'), ValidateResultUtil.error(i18n.notInstanceof('ArrayBuffer'), v, schema));
        })

        let typedArrays = ['Int8Array', 'Int16Array', 'Int32Array', 'BigInt64Array', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'BigUint64Array', 'Float32Array', 'Float64Array'] as const;
        for (let arrayType of typedArrays) {
            let schema2 = {
                type: 'Buffer',
                arrayType: arrayType
            } as const;
            let validator = new TSBufferValidator({
                'a/b': schema2
            });

            let typedArray = eval(arrayType);
            assert.strictEqual(validator.validate(new typedArray(10), 'a/b').isSucc, true);
            assert.deepStrictEqual(validator.validate(new ArrayBuffer(10), 'a/b'), ValidateResultUtil.error(i18n.notInstanceof(arrayType), new ArrayBuffer(10), schema2));
            if (arrayType !== 'Uint8Array') {
                assert.deepStrictEqual(validator.validate(new Uint8Array(10), 'a/b'), ValidateResultUtil.error(i18n.notInstanceof(arrayType), new Uint8Array(10), schema2));
            }
            else {
                assert.deepStrictEqual(validator.validate(new Uint16Array(10), 'a/b'), ValidateResultUtil.error(i18n.notInstanceof(arrayType), new Uint16Array(10), schema2));
            }
        }
    })
})