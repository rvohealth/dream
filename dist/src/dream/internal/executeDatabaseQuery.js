"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function executeDatabaseQuery(kyselyQuery, command) {
    try {
        return await kyselyQuery[command]();
    }
    catch (error) {
        if (process.env.DEBUG === '1') {
            const sqlString = kyselyQuery.compile().sql;
            const paramsString = kyselyQuery.compile().parameters.join(', ');
            console.error(`Error executing the following SQL:
${error.message}

${sqlString}
[ ${paramsString} ]
NOTE: to turn this message off, remove the DEBUG=1 env variable`);
        }
        // throw the original error to maintain stack trace
        throw error;
    }
}
exports.default = executeDatabaseQuery;
