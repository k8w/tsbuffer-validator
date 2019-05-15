import { Interface3 } from './interface1';
export interface Interface4 {
    value1: Interface3,
    value2: 'a' | 'b' | 'c'
}

export interface Interface5 {
    value3: any
}

enum TestEnum {
    va,
    vb,
    vc
}

export interface Interface6 extends Interface3, Interface5{
    value4: TestEnum
}