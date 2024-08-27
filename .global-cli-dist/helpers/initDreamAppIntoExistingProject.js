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
exports.default = initDreamAppIntoExistingProject;
const c = __importStar(require("colorette"));
const fs = __importStar(require("fs"));
const lodash_pick_1 = __importDefault(require("lodash.pick"));
const path_1 = __importDefault(require("path"));
const DreamtsBuilder_1 = __importDefault(require("../file-builders/DreamtsBuilder"));
const EnvBuilder_1 = __importDefault(require("../file-builders/EnvBuilder"));
const PackagejsonBuilder_1 = __importDefault(require("../file-builders/PackagejsonBuilder"));
const copyRecursive_1 = __importDefault(require("./copyRecursive"));
const log_1 = __importDefault(require("./log"));
const sleep_1 = __importDefault(require("./sleep"));
const sspawn_1 = __importDefault(require("./sspawn"));
const welcomeMessage_1 = __importDefault(require("./welcomeMessage"));
async function initDreamAppIntoExistingProject(appName, options) {
    createDirIfNotExists(options.projectPath);
    createDirIfNotExists(path_1.default.join(options.projectPath, options.configPath));
    createDirIfNotExists(path_1.default.join(options.projectPath, options.modelsPath));
    createDirIfNotExists(path_1.default.join(options.projectPath, options.serializersPath));
    createDirIfNotExists(path_1.default.join(options.projectPath, options.servicesPath));
    createDirIfNotExists(path_1.default.join(options.dbPath, options.dbPath));
    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/conf', path_1.default.join(process.cwd(), options.projectPath, options.configPath));
    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/app/models', path_1.default.join(process.cwd(), options.projectPath, options.modelsPath));
    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/app/serializers', path_1.default.join(options.projectPath, options.serializersPath));
    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/db', path_1.default.join(process.cwd(), options.projectPath, options.dbPath));
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 2. building default config files...`));
    }
    fs.writeFileSync(`${options.projectPath}/.env`, EnvBuilder_1.default.build({ appName, env: 'development' }));
    fs.writeFileSync(`${options.projectPath}/.env.test`, EnvBuilder_1.default.build({ appName, env: 'test' }));
    fs.writeFileSync(path_1.default.join(process.cwd(), options.projectPath, options.configPath, 'dream.ts'), DreamtsBuilder_1.default.build({
        dbPath: options.dbPath,
        modelsPath: options.modelsPath,
        serializersPath: options.serializersPath,
        confPath: options.configPath,
        servicesPath: options.servicesPath,
        modelSpecsPath: options.modelSpecsPath,
        factoriesPath: options.factoriesPath,
        primaryKeyType: options.primaryKeyType,
    }));
    const packageJsonPath = path_1.default.join(process.cwd(), options.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packagejson = (await Promise.resolve().then(() => __importStar(require('../../boilerplate/package.json')))).default;
        const userPackagejson = (await Promise.resolve(`${packageJsonPath}`).then(s => __importStar(require(s)))).default;
        mergePackageJsonField('scripts', packagejson, userPackagejson);
        mergePackageJsonField('dependencies', packagejson, userPackagejson);
        mergePackageJsonField('devDependencies', packagejson, userPackagejson);
        fs.writeFileSync(packageJsonPath, JSON.stringify(userPackagejson, null, 2));
    }
    else {
        fs.writeFileSync(packageJsonPath, await PackagejsonBuilder_1.default.buildAPI());
    }
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 2. build default config files: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 3. Installing dream dependencies...`));
        // only run yarn install if not in test env to save time
        await (0, sspawn_1.default)(`cd ${options.projectPath} && yarn install`);
    }
    // sleeping here because yarn has a delayed print that we need to clean up
    if (!testEnv())
        await (0, sleep_1.default)(1000);
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 3. Install dream dependencies: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 4. Building project...`));
    }
    // don't sync yet, since we need to run migrations first
    // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)
    if (!testEnv()) {
        // do not use git during tests, since this will break in CI
        await (0, sspawn_1.default)(`cd ./${options.projectPath} && git add --all && git commit -m 'dream init' --quiet`);
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 5. Build project: Done!`), { cache: true });
        console.log((0, welcomeMessage_1.default)(options.projectPath));
    }
}
function createDirIfNotExists(dir) {
    if (!fs.existsSync(path_1.default.join(process.cwd(), dir))) {
        fs.mkdirSync(path_1.default.join(process.cwd(), dir), { recursive: true });
    }
}
function mergePackageJsonField(field, boilerplatePackagejson, userPackagejson) {
    userPackagejson[field] ||= {};
    userPackagejson[field] = {
        ...userPackagejson[field],
        ...boilerplatePackagejson[field],
    };
    userPackagejson[field] = (0, lodash_pick_1.default)(userPackagejson[field], Object.keys(userPackagejson[field]).sort());
}
function testEnv() {
    return process.env.NODE_ENV === 'test';
}
