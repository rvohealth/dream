import '../helpers/loadEnv';
export default class DreamBin {
    static sync(): Promise<void>;
    static buildDreamSchema(): Promise<void>;
    static dbCreate(): Promise<void>;
    static dbDrop(): Promise<void>;
    static dbMigrate(): Promise<void>;
    static dbRollback(): Promise<void>;
    static generateDream(): Promise<void>;
    static generateStiChild(): Promise<void>;
    static generateFactory(): Promise<void>;
    static generateMigration(): Promise<void>;
    static generateSerializer(): Promise<void>;
}
