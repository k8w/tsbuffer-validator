import * as assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBufferValidator } from '../../..';
import { ErrorMsg } from '../../../src/ErrorMsg';

describe('NestedType', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    function validateAndAssert(value: any, schemaId: string, errMsg: string | undefined, property?: string[]) {
        let vRes = validator.validate(value, schemaId);
        if (property) {
            assert.strictEqual(vRes.errMsg, `Property \`${property.join('.')}\`: ${errMsg}`);
        }
        else {
            assert.strictEqual(vRes.errMsg, errMsg)
        }
    }

    it('Array', function () {
        // succ
        validateAndAssert([], 'nested/ArrStr', undefined);
        validateAndAssert(['a', 'b', 'c'], 'nested/ArrStr', undefined);
        validateAndAssert([{ value: 'xxx' }, { value: 'xxx' }], 'nested/ArrObj', undefined);
        validateAndAssert([[{ value: 'xxx' }], [{ value: 'xxx' }]], 'nested/ArrArr', undefined);
        validateAndAssert([123, 'xx', 123, 'xx'], 'nested/UnionArr', undefined);
        // fail
        validateAndAssert(null, 'nested/ArrStr', ErrorMsg.typeError('Array', 'null'));
        validateAndAssert(['a', 123, 'c'], 'nested/ArrStr', ErrorMsg.typeError('string', 'number'), ['1']);
        validateAndAssert([0, { value: 'xxx' }], 'nested/ArrObj', ErrorMsg.typeError('Object', 'number'), ['0']);
        validateAndAssert([[{ value: 'xxx' }], [{ value: 123 }]], 'nested/ArrArr', ErrorMsg.typeError('string', 'number'), ['1', '0', 'value']);
        validateAndAssert([123, 'xx', null, 'xx'], 'nested/UnionArr', ErrorMsg.typeError('string | number', 'null'), ['2']);
    })

    it('Tuple', function () {
        // succ
        validateAndAssert([123, 'x'], 'nested/Tuple1', undefined);
        validateAndAssert([123, 'x', 123], 'nested/Tuple1', undefined);
        validateAndAssert([{ value: 'x' }, 'x', [true, false]], 'nested/Tuple2', undefined);
        validateAndAssert([{ value: 'x' }, 'x', []], 'nested/Tuple2', undefined);
        validateAndAssert([{ value: 'x' }, 'x', [false, undefined]], 'nested/Tuple2', undefined);
        validateAndAssert([{ value: 'x' }, 'x'], 'nested/Tuple2', undefined);
        validateAndAssert([{ value: 'x' }], 'nested/Tuple2', undefined);
        validateAndAssert([{ value: 'x' }, undefined, [undefined, true]], 'nested/Tuple2', undefined);
        // fail
        validateAndAssert(123, 'nested/Tuple1', ErrorMsg.typeError('Array', 'number'));
        validateAndAssert([123, 123], 'nested/Tuple1', ErrorMsg.typeError('string', 'number'), ['1']);
        validateAndAssert([{ value: 'x' }, 'x', [1, false]], 'nested/Tuple2', ErrorMsg.typeError('boolean', 'number'), ['2', '0']);
        validateAndAssert([{ value: 'x' }, 'x', [], 123], 'nested/Tuple2', ErrorMsg.tupleOverLength(4, 3));
        validateAndAssert([], 'nested/Tuple2', ErrorMsg.missingRequiredProperty('0'));
    })
})