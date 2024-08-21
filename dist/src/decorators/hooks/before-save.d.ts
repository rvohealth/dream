import Dream from '../../dream';
import { BeforeHookOpts } from './shared';
export default function BeforeSave<T extends Dream | null = null>(opts?: BeforeHookOpts<T>): any;
