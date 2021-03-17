export const i18n = {
    typeError: (expect: string, actual: string) => `Type is expected to be '${expect}', but actually '${actual}'.`,
    notInstanceof: (expect: string) => `Value is expected to be instance of '${expect}', but actually not.`,
    // invalidScalarType: (value: number, expect: string) => `Value '${value}' is not a valid '${expect}'.`,
    invalidScalarType: (value: number | bigint, scalarType: string) => `'${value}' is not a valid '${scalarType}'.`,
    tupleOverLength: (valueLength: Number, schemaLength: number) => `Value has ${valueLength} elements but schema allows only ${schemaLength}.`,
    invalidEnumValue: (value: string | number) => `Value '${value}' does not exists in enum definition.`,
    invalidLiteralValue: (value: any, literal: any) => `Value is expected to be '${JSON.stringify(literal)}', but actually '${JSON.stringify(value)}'`,
    missingRequiredProperty: (propName: string) => `Missing required property '${propName}'.`,
    excessProperty: (propName: string) => `Excess property '${propName}'.`,
    invalidNumberKey: (key: string) => `'${key}' is not a valid key, the key here should be a 'number'.`,
    noMatchedUnionMember: 'Expected at least 1 matched union\'s member, but actually no.'
}
