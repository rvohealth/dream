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
const init_missing_call_to_load_models_1 = __importDefault(require("../exceptions/dream-application/init-missing-call-to-load-models"));
const init_missing_project_root_1 = __importDefault(require("../exceptions/dream-application/init-missing-project-root"));
const cache_1 = require("./cache");
const loadModels_1 = __importStar(require("./helpers/loadModels"));
const loadSerializers_1 = __importStar(require("./helpers/loadSerializers"));
const loadServices_1 = __importStar(require("./helpers/loadServices"));
class DreamApplication {
    /**
     * initializes a new dream application and caches it for use
     * within this processes lifecycle.
     *
     * Within dream, we rely on cached information about your app
     * to be able to serve routes, perform serializer lookups,
     * generate files, connect to the database, etc...
     *
     * In order for this to work properly, the DreamApplication#init
     * function must be called before anything else is called within
     * Dream.
     */
    static async init(cb, opts = {}, deferCb) {
        const dreamApp = new DreamApplication(opts);
        await cb(dreamApp);
        await dreamApp.inflections?.();
        await deferCb?.(dreamApp);
        if (!dreamApp.projectRoot)
            throw new init_missing_project_root_1.default();
        if (!dreamApp.loadedModels)
            throw new init_missing_call_to_load_models_1.default();
        if (!dreamApp.serializers)
            (0, loadSerializers_1.setCachedSerializers)({});
        if (!dreamApp.services)
            (0, loadServices_1.setCachedServices)({});
        (0, cache_1.cacheDreamApplication)(dreamApp);
        return dreamApp;
    }
    /**
     * Returns the cached dream application if it has been set.
     * If it has not been set, an exception is raised.
     *
     * The dream application can be set by calling DreamApplication#init,
     * or alternatively, if you are using Psychic along with Dream,
     * it can be set during PsychicApplication#init, which will set caches
     * for both the dream and psychic applications at once.
     */
    static getOrFail() {
        return (0, cache_1.getCachedDreamApplicationOrFail)();
    }
    constructor(opts) {
        this.primaryKeyType = 'bigserial';
        this.loadedModels = false;
        if (opts?.db)
            this.dbCredentials = opts.db;
        if (opts?.primaryKeyType)
            this.primaryKeyType = opts.primaryKeyType;
        if (opts?.projectRoot)
            this.projectRoot = opts.projectRoot;
        if (opts?.inflections)
            this.inflections = opts.inflections;
        this.paths = {
            conf: opts?.paths?.conf || 'src/app/conf',
            db: opts?.paths?.db || 'src/db',
            factories: opts?.paths?.factories || 'spec/factories',
            models: opts?.paths?.models || 'src/app/models',
            modelSpecs: opts?.paths?.modelSpecs || 'spec/unit/models',
            serializers: opts?.paths?.serializers || 'src/app/serializers',
            services: opts?.paths?.services || 'src/app/services',
        };
    }
    get models() {
        return (0, loadModels_1.getModelsOrFail)();
    }
    get serializers() {
        return (0, loadSerializers_1.getSerializersOrFail)();
    }
    get services() {
        return (0, loadServices_1.getServicesOrFail)();
    }
    async load(resourceType, resourcePath) {
        switch (resourceType) {
            case 'models':
                await (0, loadModels_1.default)(resourcePath);
                this.loadedModels = true;
                break;
            case 'serializers':
                await (0, loadSerializers_1.default)(resourcePath);
                break;
            case 'services':
                await (0, loadServices_1.default)(resourcePath);
                break;
        }
    }
    set(applyOption, options) {
        switch (applyOption) {
            case 'db':
                this.dbCredentials = options;
                break;
            case 'primaryKeyType':
                this.primaryKeyType = options;
                break;
            case 'projectRoot':
                this.projectRoot = options;
                break;
            case 'inflections':
                this.inflections = options;
                break;
            case 'paths':
                this.paths = {
                    ...this.paths,
                    ...options,
                };
                break;
            default:
                throw new Error(`Unhandled applyOption encountered in Dreamconf: ${applyOption}`);
        }
    }
}
exports.default = DreamApplication;
