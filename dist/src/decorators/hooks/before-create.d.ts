import Dream from '../../dream';
import { BeforeHookOpts } from './shared';
export default function BeforeCreate<T extends Dream | null = null>(opts?: BeforeHookOpts<T>): any;
