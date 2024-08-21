"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAllDbConnections = exports.dreamDbConnections = void 0;
const kysely_1 = require("kysely");
const pg_1 = require("pg");
const connection_conf_retriever_1 = __importDefault(require("./connection-conf-retriever"));
const connections = {};
class DreamDbConnection {
    static getConnection(connectionType) {
        const connection = connections[connectionType];
        if (connection)
            return connection;
        const connectionConf = new connection_conf_retriever_1.default().getConnectionConf(connectionType);
        const dbConn = new kysely_1.Kysely({
            log: process.env.DEBUG === '1' ? ['query', 'error'] : undefined,
            dialect: new kysely_1.PostgresDialect({
                pool: new pg_1.Pool({
                    user: connectionConf.user || '',
                    password: connectionConf.password || '',
                    database: connectionConf.name,
                    host: connectionConf.host || 'localhost',
                    port: connectionConf.port || 5432,
                    ssl: connectionConf.useSsl ? sslConfig(connectionConf) : false,
                }),
            }),
            plugins: [new kysely_1.CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
        });
        connections[connectionType] = dbConn;
        return dbConn;
    }
}
exports.default = DreamDbConnection;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sslConfig(connectionConf) {
    // TODO: properly configure (https://rvohealth.atlassian.net/browse/PDTC-2914)
    return {
        rejectUnauthorized: false,
        // ca: fs.readFileSync('/path/to/server-certificates/root.crt').toString(),
        // key: fs.readFileSync('/path/to/client-key/postgresql.key').toString(),
        // cert: fs.readFileSync('/path/to/client-certificates/postgresql.crt').toString(),
    };
}
function dreamDbConnections() {
    return connections;
}
exports.dreamDbConnections = dreamDbConnections;
async function closeAllDbConnections() {
    await Promise.all(Object.values(connections).map(conn => conn.destroy()));
}
exports.closeAllDbConnections = closeAllDbConnections;
