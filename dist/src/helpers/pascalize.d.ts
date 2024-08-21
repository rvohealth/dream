import { Pascalized } from './stringCasing';
export default function pascalize<const T, RT extends Pascalized<T>>(target: T): RT;
