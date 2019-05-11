import * as assert from 'assert';
import { TSBufferValidator } from '../../..';
import { ValidateResult, ValidateErrorCode } from '../../../src/ValidateResult';

describe('ClassName', function () {
    it('Reference', function () {
        let validator = new TSBufferValidator({
            a: {
                // 原始
                a1: {
                    type: 'Boolean'
                },
                // 文件内直接引用
                a2: {
                    type: 'Reference',
                    path: 'a',
                    targetName: 'a1'
                },
                // 文件内间接引用
                a3: {
                    type: 'Reference',
                    path: 'a',
                    targetName: 'a2'
                }
            },
            b: {
                // 跨文件直接引用
                b1: {
                    type: 'Reference',
                    path: 'a',
                    targetName: 'a1'
                },
                // 跨文件间接引用
                b2: {
                    type: 'Reference',
                    path: 'a',
                    targetName: 'a2'
                }
            },
            c: {
                // 跨多文件间接引用
                c1: {
                    type: 'Reference',
                    path: 'b',
                    targetName: 'b2'
                }
            }
        });

        assert.strictEqual(validator.validate(true, 'a', 'a1').isSucc, true);
        assert.strictEqual(validator.validate(true, 'a', 'a2').isSucc, true);
        assert.strictEqual(validator.validate(true, 'a', 'a3').isSucc, true);
        assert.strictEqual(validator.validate(true, 'b', 'b1').isSucc, true);
        assert.strictEqual(validator.validate(true, 'b', 'b2').isSucc, true);
        assert.strictEqual(validator.validate(true, 'c', 'c1').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'a', 'a1'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a', 'a2'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'a', 'a3'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'b', 'b1'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'b', 'b2'), ValidateResult.error(ValidateErrorCode.WrongType));
        assert.deepStrictEqual(validator.validate(123, 'c', 'c1'), ValidateResult.error(ValidateErrorCode.WrongType));
    });

    it('IndexedAccess', function () {
        let validator = new TSBufferValidator({
            a: {
                // 原始
                a1: {
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
                }
            },
            b: {
                b1: {
                    type: 'IndexedAccess',
                    objectType: {
                        type: 'Reference',
                        path: 'a',
                        targetName: 'a1'
                    },
                    index: 'aaa'
                }
            }
        });

        assert.strictEqual(validator.validate(true, 'b', 'b1').isSucc, true);
        assert.deepStrictEqual(validator.validate(123, 'b', 'b1'), ValidateResult.error(ValidateErrorCode.WrongType));
    });

    // TODO optional 转为 | undefined
})