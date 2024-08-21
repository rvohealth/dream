"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
require("../helpers/loadEnv");
const dream_db_connection_1 = __importDefault(require("./dream-db-connection"));
if (process.env.TZ)
    luxon_1.Settings.defaultZone = process.env.TZ;
function db(connectionType = 'primary') {
    return dream_db_connection_1.default.getConnection(connectionType);
}
exports.default = db;
