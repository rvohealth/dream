"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildNewDreamApp;
const c = __importStar(require("colorette"));
const fs = __importStar(require("fs"));
const DreamtsBuilder_1 = __importDefault(require("../file-builders/DreamtsBuilder"));
const EnvBuilder_1 = __importDefault(require("../file-builders/EnvBuilder"));
const PackagejsonBuilder_1 = __importDefault(require("../file-builders/PackagejsonBuilder"));
const argAndValue_1 = __importDefault(require("./argAndValue"));
const copyRecursive_1 = __importDefault(require("./copyRecursive"));
const log_1 = __importDefault(require("./log"));
const primaryKeyTypes_1 = require("./primaryKeyTypes");
const select_1 = __importDefault(require("./select"));
const sleep_1 = __importDefault(require("./sleep"));
const sspawn_1 = __importDefault(require("./sspawn"));
const welcomeMessage_1 = __importDefault(require("./welcomeMessage"));
function testEnv() {
    return process.env.NODE_ENV === 'test';
}
async function buildNewDreamApp(appName, projectPath, args) {
    const userOptions = await gatherUserInput(args);
    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate', `${projectPath}/src`);
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 2. building default config files...`));
    }
    fs.writeFileSync(`${projectPath}/.env`, EnvBuilder_1.default.build({ appName, env: 'development' }));
    fs.writeFileSync(`${projectPath}/.env.test`, EnvBuilder_1.default.build({ appName, env: 'test' }));
    fs.writeFileSync(projectPath + '/package.json', await PackagejsonBuilder_1.default.buildAPI());
    fs.writeFileSync(`${projectPath}/src/conf/dream.ts`, DreamtsBuilder_1.default.build({
        dbPath: 'src/db',
        modelsPath: 'src/app/models',
        serializersPath: 'src/app/serializers',
        confPath: 'src/conf',
        servicesPath: 'src/app/services',
        modelSpecsPath: 'spec/unit/models',
        factoriesPath: 'spec/factories',
        primaryKeyType: userOptions.primaryKeyType,
    }));
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 2. build default config files: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 3. Installing dream dependencies...`));
        // only run yarn install if not in test env to save time
        await (0, sspawn_1.default)(`cd ${projectPath} && yarn install`);
    }
    // sleeping here because yarn has a delayed print that we need to clean up
    if (!testEnv())
        await (0, sleep_1.default)(1000);
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 3. Install dream dependencies: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 4. Initializing git repository...`));
        // only do this if not test, since using git in CI will fail
        await (0, sspawn_1.default)(`cd ./${appName} && git init`);
    }
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 4. Initialize git repository: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 5. Building project...`));
    }
    // don't sync yet, since we need to run migrations first
    // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)
    if (!testEnv()) {
        // do not use git during tests, since this will break in CI
        await (0, sspawn_1.default)(`cd ./${appName} && git add --all && git commit -m 'dream init' --quiet`);
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 5. Build project: Done!`), { cache: true });
        console.log((0, welcomeMessage_1.default)(appName));
    }
}
async function primaryKeyTypeQuestion(args, options) {
    const [primaryKeyArg, value] = (0, argAndValue_1.default)('--primaryKey', args);
    if (primaryKeyArg && primaryKeyTypes_1.primaryKeyTypes.includes(value)) {
        options.primaryKeyType = value;
        return;
    }
    const answer = await new select_1.default('what primary key type would you like to use?', primaryKeyTypes_1.primaryKeyTypes).run();
    options.primaryKeyType = answer;
}
async function gatherUserInput(args) {
    const options = {
        primaryKeyType: 'bigserial',
    };
    await primaryKeyTypeQuestion(args, options);
    return options;
}
