"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = initDreamApp;
const argAndValue_1 = __importDefault(require("./helpers/argAndValue"));
const initDreamAppIntoExistingProject_1 = __importDefault(require("./helpers/initDreamAppIntoExistingProject"));
const primaryKeyTypes_1 = require("./helpers/primaryKeyTypes");
const prompt_1 = __importDefault(require("./helpers/prompt"));
const select_1 = __importDefault(require("./helpers/select"));
async function initDreamApp(args) {
    const opts = await gatherUserInput(args);
    await (0, initDreamAppIntoExistingProject_1.default)('dream app', opts);
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
async function configPath(args, options) {
    const [configPath, value] = (0, argAndValue_1.default)('--configPath', args);
    if (configPath) {
        options.configPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your config files? (defaults to src/conf)').run();
    options.configPath = answer || options.configPath;
}
async function modelsPath(args, options) {
    const [modelsPath, value] = (0, argAndValue_1.default)('--modelsPath', args);
    if (modelsPath) {
        options.modelsPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your models? (defaults to src/app/models)').run();
    options.modelsPath = answer || options.modelsPath;
}
async function serializersPath(args, options) {
    const [serializersPath, value] = (0, argAndValue_1.default)('--serializersPath', args);
    if (serializersPath) {
        options.serializersPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your serializers? (defaults to src/app/serializers)').run();
    options.serializersPath = answer || options.serializersPath;
}
async function dbPath(args, options) {
    const [dbPath, value] = (0, argAndValue_1.default)('--dbPath', args);
    if (dbPath) {
        options.dbPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your db files? (defaults to src/db)').run();
    options.dbPath = answer || options.dbPath;
}
async function modelSpecsPath(args, options) {
    const [modelSpecsPath, value] = (0, argAndValue_1.default)('--modelSpecsPath', args);
    if (modelSpecsPath) {
        options.modelSpecsPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your model tests? (defaults to spec/uspec/models)').run();
    options.modelSpecsPath = answer || options.modelSpecsPath;
}
async function servicesPath(args, options) {
    const [servicesPath, value] = (0, argAndValue_1.default)('--servicesPath', args);
    if (servicesPath) {
        options.servicesPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your services? (defaults to src/app/services)').run();
    options.servicesPath = answer || options.servicesPath;
}
async function factoriesPath(args, options) {
    const [factoriesPath, value] = (0, argAndValue_1.default)('--factoriesPath', args);
    if (factoriesPath) {
        options.factoriesPath = value;
        return;
    }
    const answer = await new prompt_1.default('Relative to the current directory, where would you like us to put your factories? (defaults to spec/factories)').run();
    options.factoriesPath = answer || options.factoriesPath;
}
async function projectPath(args, options) {
    const [projectPath, value] = (0, argAndValue_1.default)('--projectPath', args);
    if (projectPath) {
        options.projectPath = value;
        return;
    }
    const answer = await new prompt_1.default(`Relative to the current directory, where would you like us to put your project? (defaults to the current directory)`).run();
    if (process.env.DREAM_CORE_DEVELOPMENT === '1' && !answer) {
        throw new Error(`
when in dream core development, you must provide an explicit project directory. If you do not specify it,
you risk accidentally overwriting all the root files in the dream directory.
      `);
    }
    options.projectPath = answer || options.projectPath;
    console.log(options.projectPath);
}
async function gatherUserInput(args) {
    const options = {
        projectPath: '.',
        primaryKeyType: 'bigserial',
        configPath: 'src/conf',
        dbPath: 'src/db',
        modelsPath: 'src/app/models',
        serializersPath: 'src/app/serializers',
        servicesPath: 'src/app/services',
        modelSpecsPath: 'spec/uspec/models',
        factoriesPath: 'spec/factories',
    };
    await projectPath(args, options);
    await modelsPath(args, options);
    await configPath(args, options);
    await serializersPath(args, options);
    await dbPath(args, options);
    await modelSpecsPath(args, options);
    await factoriesPath(args, options);
    await servicesPath(args, options);
    await primaryKeyTypeQuestion(args, options);
    return options;
}
