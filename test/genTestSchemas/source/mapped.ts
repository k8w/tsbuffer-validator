import { Picked } from './mapped';
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