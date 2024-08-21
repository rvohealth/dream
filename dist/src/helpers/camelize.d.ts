import { Camelized } from './stringCasing';
export default function camelize<const T, RT extends Camelized<T>>(target: T): RT;
export declare function camelizeString(str: string): string;
