ValidateError: Type should be string, but actually number
    at <property> a
    at <property> b
    at <schema> rank/PtlGetRank/ReqGetRank
### 错误详情
```js
// 对外返回的错误
{
    // 最内层
    properties: ['a', 'b', 'c'],
    message: `Invalid enum value 'XXXX'`,
    value: 'xxx',
    schema: {...}
}

// 对内抛出的错误
{
    // 二选一
    message?: 'XXX',
    innerError: {
        ...Error,
        property: 'x'
    }

    value: 'xxx',
    schema: {...}
}
```

### 错误类型及文案
```
TypeofError
    Type should be 'string', but actually be 'object'
NotArray
    Type should be 'array', but actually 'object'
NotInstanceOf
    Type should instanceof 'Date'
InvalidScalarType
    '123.4567' is not a valid 'uint'
TupleOverlength
    Invalid array length
InvalidEnumValue
    Invalid enum value 'XXXX'
InvalidLiteralValue
    Value not equals to 'XXXXX'
MissingRequiredProperty
    Missing required property 'xxx'
ExcessProperty
    Excess property 'xxx'
InvalidNumberKeyshould be a number according to schema
    Invalid number key 'xxxx'
```

### 业务报错示例
```
[ReqTypeError] 'spaceIds': Type should be 'string', but actually 'number'
[ResTypeError] 'space': No condition met
```

