"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
class ConnectedToDB {
    constructor(dreamInstance, opts = {}) {
        this.dreamInstance = dreamInstance;
        this.dreamTransaction = null;
        this.dreamClass = dreamInstance.constructor;
        this.dreamTransaction = opts.transaction || null;
        this.connectionOverride = opts.connection;
    }
    dbConnectionType(sqlCommandType) {
        if (this.dreamTransaction)
            return 'primary';
        switch (sqlCommandType) {
            case 'select':
                return this.connectionOverride || (this.dreamClass['replicaSafe'] ? 'replica' : 'primary');
            default:
                return 'primary';
        }
    }
    // ATTENTION FRED
    // stop trying to make this async. You never learn...
    dbFor(sqlCommandType) {
        if (this.dreamTransaction?.kyselyTransaction)
            return this.dreamTransaction?.kyselyTransaction;
        return (0, db_1.default)(this.dbConnectionType(sqlCommandType));
    }
}
exports.default = ConnectedToDB;
