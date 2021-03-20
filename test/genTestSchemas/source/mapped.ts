import { Overwrite } from "k8w-extend-native";

export interface Base {
    name: string,
    orders?: number[],
    sex?: {
        value: 'm' | 'f'
    }
}

export type Pick1 = Pick<Base, 'name'>;
export type Pick2 = Pick<Base, 'name' | 'orders'>;
export type Pick3 = Pick<Pick2, 'orders'>;

export type Partial1 = Partial<Base>;
export type Partial2 = Partial<Pick2>;

export type Omit1 = Omit<Base, 'sex'>;
export type Omit2 = Omit<Pick2, 'orders'>;
export type Omit3 = Omit<Omit1, 'name'>;

export type Overwrite1 = Overwrite<Base, {
    sex: 'm' | 'f';
    other: string
}>;
export type Overwrite2 = Overwrite<Pick<Base, 'name' | 'sex'>, {
    sex: 'm' | 'f';
    other: string
}>

// indexSignature
export interface Base1 {
    a: string,
    b: number,
    [key: string]: string | number
}

export type IPick = Pick<Base1, 'a' | 'c'>;
export type IPartial = Partial<Base1>;
export type IOmit = Omit<Base1, 'b' | 'c'>;
export type IOverwrite1 = Overwrite<Base1, {
    a: number,
    b: string
}>
export type IOverwrite2 = Overwrite<Base1, {
    b: string
    [key: string]: string
}>

export interface A {
    type: 'A',
    common: string,
    valueA: string,
    common1?: string,
    common2?: string,
}
export interface B {
    type: 'B',
    common: string,
    valueB: string,
    common1?: string,
    common2?: string,
}
export type AB = A | B;
export type PickAB = Pick<AB, 'type' | 'common'>;
export type OmitAB = Omit<AB, 'common' | 'common1'>;
// only common
export type NestedAB = Pick<Omit<Pick<AB, 'type' | 'common' | 'common1'>, 'common1' | 'type'>, 'common'>
export type PartialAB = Partial<AB>;
export type PartialPick = Partial<PickAB>;
export type PickPartial = Pick<PartialAB, 'type'>;