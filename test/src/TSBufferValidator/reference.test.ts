import * as assert from 'assert';
import { TSBufferValidator } from '../../..';
import { i18n } from '../../../src/ErrorMsg';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('TypeReference Validate', function () {
    it('Reference', function () {
        let schema = {
            type: 'Boolean'
        } as const;
        let validator = new TSBufferValidator({
            // 原始
            'a/a1': schema,
            // 文件内直接引用
            'a/a2': {
                type: 'Reference',
                target: 'a/a1'
            },
            // 文件内间接引用
            'a/a3': {
                type: 'Reference',
                target: 'a/a2'
            },
            // 跨文件直接引用
            'b/b1': {
                type: 'Reference',
                target: 'a/a1'
            },
            // 跨文件间接引用
            'b/b2': {
                type: 'Reference',
                target: 'a/a2'
            },
            // 跨多文件间接引用
            'c/c1': {
                type: 'Reference',
                target: 'b/b2'
            }
        });

        assert.strictEqual(validator.validate(true, 'a/a1').isSucc, true);
        assert.strictEqual(validator.validate(true, 'a/a2').isSucc, true);
        assert.strictEqual(validator.validate(true, 'a/a3').isSucc, true);
        assert.strictEqual(validator.validate(true, 'b/b1').isSucc, true);
        assert.strictEqual(validator.validate(true, 'b/b2').isSucc, true);
        assert.strictEqual(validator.validate(true, 'c/c1').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'a/a1'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate(123, 'a/a2'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate(123, 'a/a3'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate(123, 'b/b1'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate(123, 'b/b2'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
        assert.deepStrictEqual(validator.validate(123, 'c/c1'), ValidateResultUtil.error(i18n.typeError('boolean', 'number'), 123, schema));
    });

    it('IndexedAccess', function () {
        let validator = new TSBufferValidator({
            // 原始
            'a/a1': {
                type: 'Interface',
                properties: [
                    {
                        id: 0,
                        name: 'aaa',
                        type: {
                            type: 'Boolean'
                        }
                    }
                ],
                indexSignature: {
                    keyType: 'String',
                    type: {
                        type: 'Boolean'
                    }
                }
            },
            'b/b1': {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Reference',
                    target: 'a/a1'
                },
                index: 'aaa'
            },
            'b/b2': {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Reference',
                    target: 'a/a1'
                },
                index: 'bbb'
            },
            'e/e1': {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Any' as any
                },
                index: 'xxx'
            },
            'e/e2': {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Interface',
                    properties: []
                },
                index: 'xxx'
            }
        });

        assert.strictEqual(validator.validate(true, 'b/b1').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'b/b1'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(null, 'b/b1'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'b/b1'), ValidateResult.error(ValidateErrorCode.WrongType));

        assert.strictEqual(validator.validate(true, 'b/b2').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'b/b2'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(null, 'b/b2'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(undefined, 'b/b2'), ValidateResult.error(ValidateErrorCode.WrongType));

        assert.throws(() => {
            validator.validate(123, 'e/e1');
        })
        assert.throws(() => {
            validator.validate(123, 'e/e2');
        })
    });

    it('Optional to | undefined', function () {
        let validator = new TSBufferValidator({
            'a/a1': {
                type: 'Interface',
                properties: [
                    {
                        id: 0,
                        optional: true,
                        name: 'aaa',
                        type: { type: 'String' }
                    }
                ]
            },
            'a/b1': {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Reference',
                    target: 'a/a1'
                },
                index: 'aaa'
            }
        });

        assert.deepStrictEqual(validator.validate('abc', 'a/b1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate(undefined, 'a/b1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate(123, 'a/b1'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
    });

    it('IndexedAccess a optional fields with | undefined', function () {
        let validator = new TSBufferValidator({
            'a/a1': {
                type: 'Interface',
                properties: [
                    {
                        id: 0,
                        optional: true,
                        name: 'aaa',
                        type: {
                            type: 'Union',
                            members: [
                                { id: 0, type: { type: 'String' } },
                                { id: 0, type: { type: 'Literal', literal: undefined } }
                            ]
                        }
                    }
                ]
            },
            'a/b1': {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Reference',
                    target: 'a/a1'
                },
                index: 'aaa'
            }
        });

        assert.deepStrictEqual(validator.validate('abc', 'a/b1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate(undefined, 'a/b1'), ValidateResult.success);
        assert.deepStrictEqual(validator.validate(123, 'a/b1'), ValidateResult.error(ValidateErrorCode.NonConditionMet));
    })
})