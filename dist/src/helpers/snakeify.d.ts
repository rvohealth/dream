import { Snakeified } from './stringCasing';
export default function snakeify<const T, RT extends Snakeified<T>>(target: T): RT;
export declare function snakeifyString(str: string): string;
