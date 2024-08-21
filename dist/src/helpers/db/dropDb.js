"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_conf_retriever_1 = __importDefault(require("../../db/connection-conf-retriever"));
const loadPgClient_1 = __importDefault(require("./loadPgClient"));
async function dropDb(connection, dbName) {
    // this was only ever written to clear the db between tests or in development,
    // so there is no way to drop in production
    if (process.env.NODE_ENV === 'production')
        return false;
    const connectionRetriever = new connection_conf_retriever_1.default();
    const dbConf = connectionRetriever.getConnectionConf(connection);
    dbName ||= dbConf.name || null;
    if (!dbName)
        throw `Must either pass a dbName to the drop function, or else ensure that DB_NAME is set in the env`;
    const client = await (0, loadPgClient_1.default)({ useSystemDb: true });
    await client.query(`DROP DATABASE IF EXISTS ${dbName};`);
}
exports.default = dropDb;
