"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
async function createExtension(extensionName, db, { ifNotExists = true, publicSchema = true } = {}) {
    const ifNotExistsText = ifNotExists ? ' IF NOT EXISTS ' : ' ';
    const publicSchemaText = publicSchema ? ' WITH SCHEMA public' : '';
    await (0, kysely_1.sql) `
    CREATE EXTENSION${kysely_1.sql.raw(ifNotExistsText)}"${kysely_1.sql.raw(extensionName)}"${kysely_1.sql.raw(publicSchemaText)};
  `.execute(db);
}
exports.default = createExtension;
