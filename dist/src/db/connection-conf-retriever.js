"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_application_1 = __importDefault(require("../dream-application"));
class ConnectionConfRetriever {
    getConnectionConf(connection) {
        const dreamApplication = dream_application_1.default.getOrFail();
        const conf = dreamApplication.dbCredentials?.[connection] || dreamApplication.dbCredentials?.primary;
        if (!conf)
            throw new Error(`
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
    `);
        return conf;
    }
    hasReplicaConfig() {
        const dreamApplication = dream_application_1.default.getOrFail();
        return !!dreamApplication.dbCredentials.replica;
    }
}
exports.default = ConnectionConfRetriever;
