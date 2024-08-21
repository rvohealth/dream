"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const setCoreDevelopmentFlag_1 = __importDefault(require("./setCoreDevelopmentFlag"));
function nodeOrTsnodeCmd(filePath, programArgs, { nodeFlags = [], tsnodeFlags = [], fileArgs = [], } = {}) {
    const coreDevFlag = (0, setCoreDevelopmentFlag_1.default)(programArgs);
    const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1';
    const nodeCmd = useTsnode ? 'npx ts-node' : 'node';
    const omitDistFromPathEnv = useTsnode ? 'DREAM_OMIT_DIST_FOLDER=1 ' : '';
    const realFilePath = useTsnode ? filePath : path_1.default.join('dist', filePath.replace(/\.ts$/, '.js'));
    if (useTsnode)
        fileArgs.push('--tsnode');
    const nodeEnvFlag = process.env.NODE_ENV ? `NODE_ENV=${process.env.NODE_ENV} ` : '';
    return `${nodeEnvFlag}${coreDevFlag}${omitDistFromPathEnv}${nodeCmd} ${useTsnode ? tsnodeFlags.join(' ') : nodeFlags.join(' ')} ${realFilePath} ${fileArgs.join(' ')} `;
}
exports.default = nodeOrTsnodeCmd;
