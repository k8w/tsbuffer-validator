<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [tsbuffer-validator](./tsbuffer-validator.md) &gt; [TSBufferValidatorOptions](./tsbuffer-validator.tsbuffervalidatoroptions.md)

## TSBufferValidatorOptions interface


**Signature:**

```typescript
export interface TSBufferValidatorOptions 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [cloneProto?](./tsbuffer-validator.tsbuffervalidatoroptions.cloneproto.md) |  | boolean | _(Optional)_ Clone the proto, don't change this if you don't know what it is. |
|  [excessPropertyChecks](./tsbuffer-validator.tsbuffervalidatoroptions.excesspropertychecks.md) |  | boolean | <p>检查interface中是否包含Schema之外的字段</p><p>例1：</p>
```
type AB = { a: string, b: string };
let ab: AB = { a: 'x', b: 'x', c: 'x' }
```
<p>字段 <code>c</code> 为 excess property，当 <code>excessPropertyChecks</code> 启用时将会报错。</p><p>例2：</p>
```
type AB = { a: string} | { b: string };
let ab: AB = { a: 'x', b: 'x', c: 'x' }
```
<p>字段 <code>c</code> 为 excess property，当 <code>excessPropertyChecks</code> 启用时将会报错。</p><p>默认：<code>true</code></p> |
|  [strictNullChecks](./tsbuffer-validator.tsbuffervalidatoroptions.strictnullchecks.md) |  | boolean | 同 <code>tsconfig.json</code> 中的 <code>strictNullChecks</code> 是否使用严格等于去判定 <code>undefined</code> 和 <code>null</code> |

