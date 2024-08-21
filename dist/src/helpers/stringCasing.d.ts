import { ReadonlyHead, NotReadonlyHead, ReadonlyTail, NotReadonlyTail } from './typeutils';
type RecursivelyStringCaseObjectKeysInTuple<T extends any[], StringCaseType extends StringCasingOptions> = T['length'] extends 0 ? [] : [
    RecursiveStringCase<NotReadonlyHead<T>, StringCaseType>,
    ...RecursivelyStringCaseObjectKeysInTuple<NotReadonlyTail<T>, StringCaseType>
];
type ReadOnlyRecursivelyStringCaseObjectKeysInTuple<T extends readonly any[], StringCaseType extends StringCasingOptions> = T['length'] extends 0 ? readonly [] : readonly [
    RecursiveStringCase<ReadonlyHead<T>, StringCaseType>,
    ...ReadOnlyRecursivelyStringCaseObjectKeysInTuple<ReadonlyTail<T>, StringCaseType>
];
type RecursiveStringCase<T, StringCaseType extends StringCasingOptions, RT = T extends string ? T : T extends readonly string[] | string[] ? T : T extends readonly any[] ? ReadOnlyRecursivelyStringCaseObjectKeysInTuple<T, StringCaseType> : T extends any[] ? RecursivelyStringCaseObjectKeysInTuple<T, StringCaseType> : T extends object ? {
    -readonly [key in keyof T as key extends string ? StringCaseString<key, StringCaseType> : key]: RecursiveStringCase<T[key], StringCaseType>;
} : T> = RT;
type StringCasingOptions = 'Camelize' | 'Snakeify' | 'Hyphenize' | 'Pascalize';
export type Camelized<T> = StringCase<'Camelize', T>;
export type Snakeified<T> = StringCase<'Snakeify', T>;
export type Hyphenized<T> = StringCase<'Hyphenize', T>;
export type Pascalized<T> = StringCase<'Pascalize', T>;
type StringCase<StringCaseType extends StringCasingOptions, T, RT = T extends string ? StringCaseString<T, StringCaseType> : RecursiveStringCase<T, StringCaseType>> = RT;
type StringCaseString<T extends string, StringCaseType extends StringCasingOptions> = StringCaseType extends 'Camelize' ? CamelizeString<T> : StringCaseType extends 'Snakeify' ? SnakeifyString<T> : StringCaseType extends 'Hyphenize' ? HyphenizeString<T> : StringCaseType extends 'Pascalize' ? PascalizeString<T> : never;
type InnerCamelizeString<T extends string> = T extends `${infer A}_${infer B}` ? `${A}${InnerCamelizeString<Capitalize<B>>}` : T extends `${infer A}-${infer B}` ? `${A}${InnerCamelizeString<Capitalize<B>>}` : T;
type Punctuation = ',' | '.' | '/' | '<' | '>' | '?' | ';' | "'" | ':' | '"' | '[' | ']' | '{' | '}' | '\\' | '|' | '!' | '@' | '#' | '$' | '%' | '^' | '&' | '*' | '(' | ')' | '`';
type InnerCapitalsToCharacterDelimiter<S extends string, Delimiter extends '-' | '_'> = S extends `${infer P extends Punctuation}${infer T}${infer U}` ? `${P}${Lowercase<T>}${InnerCapitalsToCharacterDelimiter<U, Delimiter>}` : S extends `${infer T}${infer U}` ? T extends Capitalize<T> ? T extends Lowercase<T> ? `${T}${InnerCapitalsToCharacterDelimiter<U, Delimiter>}` : `${Delimiter}${Lowercase<T>}${InnerCapitalsToCharacterDelimiter<U, Delimiter>}` : `${T}${InnerCapitalsToCharacterDelimiter<U, Delimiter>}` : S;
type SnakeifyString<S extends string> = InnerCapitalsToCharacterDelimiter<CamelizeString<S>, '_'>;
type HyphenizeString<S extends string> = InnerCapitalsToCharacterDelimiter<CamelizeString<S>, '-'>;
type PascalizeString<S extends string> = Capitalize<InnerCamelizeString<S>>;
type CamelizeString<S extends string> = Uncapitalize<InnerCamelizeString<S>>;
export default function stringCase(target: any, stringCaser: (x: string) => string): any;
export {};
