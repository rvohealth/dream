"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const kysely_1 = require("kysely");
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("../../db"));
const dream_application_1 = __importDefault(require("../../dream-application"));
async function runMigration({ mode = 'migrate',
// step = 1,
 } = {}) {
    const dreamApp = dream_application_1.default.getOrFail();
    const migrationFolder = path_1.default.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations');
    const migrator = new kysely_1.Migrator({
        db: (0, db_1.default)('primary'),
        allowUnorderedMigrations: true,
        provider: new kysely_1.FileMigrationProvider({
            fs: promises_1.default,
            path: path_1.default,
            migrationFolder,
        }),
    });
    const migrationMethod = mode === 'migrate' ? 'migrateToLatest' : 'migrateDown';
    const { error, results } = await migrator[migrationMethod]();
    const migratedActionPastTense = mode === 'migrate' ? 'migrated' : 'rolled back';
    const migratedActionCurrentTense = mode === 'migrate' ? 'migrate' : 'roll';
    results?.forEach(it => {
        if (it.status === 'Success') {
            console.log(`migration "${it.migrationName}" was ${migratedActionPastTense} successfully`);
        }
        else if (it.status === 'Error') {
            console.log(it);
            console.error(`failed to ${migratedActionCurrentTense} migration "${it.migrationName}"`);
        }
    });
    if (error) {
        console.error(`failed to ${migratedActionCurrentTense}`);
        console.error(error);
        process.exit(1);
    }
}
exports.default = runMigration;
