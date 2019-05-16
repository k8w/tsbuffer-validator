type A = { a: string };
type B = { b: string };
type C = { c: string };
type D = { d: string };

export type AB = A & B;
export type CD = C | D;
export type ABC = A & B & C;
export type BCD = B | C | D;
export type ABCD = A & B | C & D;
export type ABCD1 = A | B & C | D;
export type ABCD2 = A & B | B & C | C & D;

export type Conflict = { value: string } & { value: number };
export type Conflict2 = { type: 'string', value: string } | { type: 'number', value: number };