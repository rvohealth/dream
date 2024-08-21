import { Kysely } from 'kysely';
export default function createExtension(extensionName: string, db: Kysely<any>, { ifNotExists, publicSchema }?: {
    ifNotExists?: boolean;
    publicSchema?: boolean;
}): Promise<void>;
