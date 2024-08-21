import { Client } from 'pg';
export default function loadPgClient({ useSystemDb }?: {
    useSystemDb?: boolean;
}): Promise<Client>;
