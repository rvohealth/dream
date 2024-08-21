"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dream_application_1 = __importDefault(require("../../dream-application"));
async function loadPgClient({ useSystemDb } = {}) {
    const dreamconf = dream_application_1.default.getOrFail();
    const creds = dreamconf.dbCredentials.primary;
    const client = new pg_1.Client({
        host: creds.host || 'localhost',
        port: creds.port,
        database: useSystemDb ? 'postgres' : creds.name,
        user: creds.user,
        password: creds.password,
    });
    await client.connect();
    return client;
}
exports.default = loadPgClient;
