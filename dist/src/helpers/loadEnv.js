"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fileName = `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`;
let dotenvpath = '';
if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    dotenvpath =
        process.env.DREAM_CORE_SPEC_RUN === '1'
            ? __dirname + `/../../${fileName}`
            : __dirname + `/../../../${fileName}`;
}
else {
    dotenvpath = `../../${fileName}`;
}
dotenv_1.default.config({ path: dotenvpath });
