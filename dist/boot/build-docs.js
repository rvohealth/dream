"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./cli/helpers/loadAppEnvFromBoot");
const package_json_1 = __importDefault(require("../package.json"));
const sspawn_1 = __importDefault(require("../src/helpers/sspawn"));
async function buildDocs() {
    console.log('generating docs for dream version: ' + package_json_1.default.version + '...');
    await (0, sspawn_1.default)(`yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs/${package_json_1.default.version}`);
    console.log('done!');
}
exports.default = buildDocs;
void buildDocs();
