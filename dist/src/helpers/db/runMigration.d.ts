export default function runMigration({ mode, }?: {
    mode?: 'migrate' | 'rollback';
    step?: number;
}): Promise<void>;
