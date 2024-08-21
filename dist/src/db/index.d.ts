import { Kysely } from 'kysely';
import Dream from '../dream';
import '../helpers/loadEnv';
import { DbConnectionType } from './types';
export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(connectionType?: DbConnectionType): Kysely<DB>;
