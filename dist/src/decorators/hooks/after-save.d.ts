import Dream from '../../dream';
import { AfterHookOpts } from './shared';
export default function AfterSave<T extends Dream | null = null>(opts?: AfterHookOpts<T>): any;
