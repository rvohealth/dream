"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    const dotenvpath = process.env.NODE_ENV === 'test' ? __dirname + '/../../../.env.test' : __dirname + '/../../../.env';
    dotenv_1.default.config({ path: dotenvpath });
}
else {
    dotenv_1.default.config({ path: process.env.NODE_ENV === 'test' ? '../../../.env.test' : '../../../.env' });
}
