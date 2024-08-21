import { Hyphenized } from './stringCasing';
export default function hyphenize<const T, RT extends Hyphenized<T>>(target: T): RT;
