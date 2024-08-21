"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../helpers/loadEnv");
const connection_conf_retriever_1 = __importDefault(require("../db/connection-conf-retriever"));
const SchemaBuilder_1 = __importDefault(require("../helpers/cli/SchemaBuilder"));
const generateDream_1 = __importDefault(require("../helpers/cli/generateDream"));
const generateFactory_1 = __importDefault(require("../helpers/cli/generateFactory"));
const generateMigration_1 = __importDefault(require("../helpers/cli/generateMigration"));
const generateSerializer_1 = __importDefault(require("../helpers/cli/generateSerializer"));
const createDb_1 = __importDefault(require("../helpers/db/createDb"));
const dropDb_1 = __importDefault(require("../helpers/db/dropDb"));
const runMigration_1 = __importDefault(require("../helpers/db/runMigration"));
const sync_1 = __importDefault(require("./helpers/sync"));
class DreamBin {
    static async sync() {
        await (0, sync_1.default)();
        await this.buildDreamSchema();
    }
    static async buildDreamSchema() {
        console.log('writing dream schema...');
        await new SchemaBuilder_1.default().build();
        console.log('Done!');
    }
    static async dbCreate() {
        const connectionRetriever = new connection_conf_retriever_1.default();
        const primaryDbConf = connectionRetriever.getConnectionConf('primary');
        console.log(`creating ${primaryDbConf.name}`);
        await (0, createDb_1.default)('primary');
        // TODO: add support for creating replicas. Began doing it below, but it is very tricky,
        // and we don't need it at the moment, so kicking off for future development when we have more time
        // to flesh this out.
        // if (connectionRetriever.hasReplicaConfig()) {
        //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
        //   console.log(`creating ${process.env[replicaDbConf.name]}`)
        //   await createDb('replica')
        // }
        console.log('complete!');
    }
    static async dbDrop() {
        const connectionRetriever = new connection_conf_retriever_1.default();
        const primaryDbConf = connectionRetriever.getConnectionConf('primary');
        console.log(`dropping ${primaryDbConf.name}`);
        await (0, dropDb_1.default)('primary');
        // TODO: add support for dropping replicas. Began doing it below, but it is very tricky,
        // and we don't need it at the moment, so kicking off for future development when we have more time
        // to flesh this out.
        // if (connectionRetriever.hasReplicaConfig()) {
        //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
        //   console.log(`dropping ${process.env[replicaDbConf.name]}`)
        //   await _dropDb('replica')
        // }
        console.log('complete!');
    }
    static async dbMigrate() {
        await (0, runMigration_1.default)({ mode: 'migrate' });
        // release the db connection
        // await db('primary', DreamApplication.getOrFail()).destroy()
    }
    static async dbRollback() {
        let step = process.argv[3] ? parseInt(process.argv[3]) : 1;
        while (step > 0) {
            await (0, runMigration_1.default)({ mode: 'rollback', step });
            step -= 1;
        }
        // await db('primary', DreamApplication.getOrFail()).destroy()
    }
    static async generateDream() {
        const argv = process.argv.filter(arg => !/^--/.test(arg));
        const name = argv[3];
        const args = argv.slice(4, argv.length);
        await (0, generateDream_1.default)(name, args);
    }
    static async generateStiChild() {
        const argv = process.argv.filter(arg => !/^--/.test(arg));
        const name = argv[3];
        const extendsWord = argv[4];
        if (extendsWord !== 'extends')
            throw new Error('Expecting: `<child-name> extends <parent-name> <args>');
        const parentName = argv[5];
        const args = argv.slice(6, argv.length);
        await (0, generateDream_1.default)(name, args, parentName);
    }
    static async generateFactory() {
        const argv = process.argv.filter(arg => !/^--/.test(arg));
        const name = argv[3];
        const args = argv.slice(4, argv.length);
        await (0, generateFactory_1.default)(name, args);
    }
    static async generateMigration() {
        const argv = process.argv.filter(arg => !/^--/.test(arg));
        const name = argv[3];
        await (0, generateMigration_1.default)(name, []);
    }
    static async generateSerializer() {
        const argv = process.argv.filter(arg => !/^--/.test(arg));
        const name = argv[3];
        const args = argv.slice(4, argv.length);
        await (0, generateSerializer_1.default)(name, args);
    }
}
exports.default = DreamBin;
