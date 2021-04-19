// https://github.com/microsoft/TypeScript/issues/15012#issuecomment-365453623
export type Integral<T> = { [ P in keyof T ]-?: NonNullable<T[P]>; }
