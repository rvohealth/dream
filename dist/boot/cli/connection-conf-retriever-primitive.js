"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_application_1 = __importDefault(require("../../src/dream-application"));
class ConnectionConfRetriever {
    getConnectionConf(connection) {
        const dreamconf = dream_application_1.default.getOrFail();
        const dbConfig = dreamconf.dbCredentials;
        const nodeEnv = process.env.NODE_ENV;
        const conf = dbConfig[connection] || dbConfig.primary;
        if (!conf)
            throw `
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
        NODE_ENV: ${nodeEnv}
    `;
        return conf;
    }
}
exports.default = ConnectionConfRetriever;
