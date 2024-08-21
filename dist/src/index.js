"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hyphenize = exports.developmentOrTestEnv = exports.debug = exports.compact = exports.capitalize = exports.camelize = exports.Benchmark = exports.CalendarDate = exports.ValidationError = exports.GlobalNameNotSet = exports.CreateOrFindByFailedToCreateAndFind = exports.NonLoadedAssociation = exports.primaryKeyTypes = exports.TRIGRAM_OPERATORS = exports.DreamConst = exports.DreamTransaction = exports.Query = exports.lookupClassByGlobalName = exports.DreamApplication = exports.Dream = exports.Virtual = exports.Validates = exports.Validate = exports.Sortable = exports.SoftDelete = exports.Scope = exports.ReplicaSafe = exports.BeforeUpdate = exports.BeforeSave = exports.BeforeDestroy = exports.BeforeCreate = exports.AfterUpdateCommit = exports.AfterUpdate = exports.AfterSaveCommit = exports.AfterSave = exports.AfterDestroyCommit = exports.AfterDestroy = exports.AfterCreateCommit = exports.AfterCreate = exports.STI = exports.validateTable = exports.validateColumn = exports.createGinIndex = exports.createExtension = exports.dropConstraint = exports.addDeferrableUniqueConstraint = exports.dreamDbConnections = exports.closeAllDbConnections = exports.db = exports.DreamBin = void 0;
exports.Attribute = exports.RendersOne = exports.RendersMany = exports.DreamSerializer = exports.ops = exports.openapiShorthandPrimitiveTypes = exports.openapiPrimitiveTypes = exports.uniq = exports.uncapitalize = exports.testEnv = exports.snakeify = exports.round = exports.range = exports.Range = exports.dreamPath = exports.pascalize = exports.loadRepl = exports.inferSerializerFromDreamOrViewModel = exports.inferSerializerFromDreamClassOrViewModelClass = void 0;
var bin_1 = require("./bin");
Object.defineProperty(exports, "DreamBin", { enumerable: true, get: function () { return __importDefault(bin_1).default; } });
var db_1 = require("./db");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return __importDefault(db_1).default; } });
var dream_db_connection_1 = require("./db/dream-db-connection");
Object.defineProperty(exports, "closeAllDbConnections", { enumerable: true, get: function () { return dream_db_connection_1.closeAllDbConnections; } });
Object.defineProperty(exports, "dreamDbConnections", { enumerable: true, get: function () { return dream_db_connection_1.dreamDbConnections; } });
var addDeferrableUniqueConstraint_1 = require("./db/migration-helpers/addDeferrableUniqueConstraint");
Object.defineProperty(exports, "addDeferrableUniqueConstraint", { enumerable: true, get: function () { return __importDefault(addDeferrableUniqueConstraint_1).default; } });
Object.defineProperty(exports, "dropConstraint", { enumerable: true, get: function () { return __importDefault(addDeferrableUniqueConstraint_1).default; } });
var createExtension_1 = require("./db/migration-helpers/createExtension");
Object.defineProperty(exports, "createExtension", { enumerable: true, get: function () { return __importDefault(createExtension_1).default; } });
var createGinIndex_1 = require("./db/migration-helpers/createGinIndex");
Object.defineProperty(exports, "createGinIndex", { enumerable: true, get: function () { return __importDefault(createGinIndex_1).default; } });
var validateColumn_1 = require("./db/validators/validateColumn");
Object.defineProperty(exports, "validateColumn", { enumerable: true, get: function () { return __importDefault(validateColumn_1).default; } });
var validateTable_1 = require("./db/validators/validateTable");
Object.defineProperty(exports, "validateTable", { enumerable: true, get: function () { return __importDefault(validateTable_1).default; } });
var STI_1 = require("./decorators/STI");
Object.defineProperty(exports, "STI", { enumerable: true, get: function () { return __importDefault(STI_1).default; } });
var after_create_1 = require("./decorators/hooks/after-create");
Object.defineProperty(exports, "AfterCreate", { enumerable: true, get: function () { return __importDefault(after_create_1).default; } });
var after_create_commit_1 = require("./decorators/hooks/after-create-commit");
Object.defineProperty(exports, "AfterCreateCommit", { enumerable: true, get: function () { return __importDefault(after_create_commit_1).default; } });
var after_destroy_1 = require("./decorators/hooks/after-destroy");
Object.defineProperty(exports, "AfterDestroy", { enumerable: true, get: function () { return __importDefault(after_destroy_1).default; } });
var after_destroy_commit_1 = require("./decorators/hooks/after-destroy-commit");
Object.defineProperty(exports, "AfterDestroyCommit", { enumerable: true, get: function () { return __importDefault(after_destroy_commit_1).default; } });
var after_save_1 = require("./decorators/hooks/after-save");
Object.defineProperty(exports, "AfterSave", { enumerable: true, get: function () { return __importDefault(after_save_1).default; } });
var after_save_commit_1 = require("./decorators/hooks/after-save-commit");
Object.defineProperty(exports, "AfterSaveCommit", { enumerable: true, get: function () { return __importDefault(after_save_commit_1).default; } });
var after_update_1 = require("./decorators/hooks/after-update");
Object.defineProperty(exports, "AfterUpdate", { enumerable: true, get: function () { return __importDefault(after_update_1).default; } });
var after_update_commit_1 = require("./decorators/hooks/after-update-commit");
Object.defineProperty(exports, "AfterUpdateCommit", { enumerable: true, get: function () { return __importDefault(after_update_commit_1).default; } });
var before_create_1 = require("./decorators/hooks/before-create");
Object.defineProperty(exports, "BeforeCreate", { enumerable: true, get: function () { return __importDefault(before_create_1).default; } });
var before_destroy_1 = require("./decorators/hooks/before-destroy");
Object.defineProperty(exports, "BeforeDestroy", { enumerable: true, get: function () { return __importDefault(before_destroy_1).default; } });
var before_save_1 = require("./decorators/hooks/before-save");
Object.defineProperty(exports, "BeforeSave", { enumerable: true, get: function () { return __importDefault(before_save_1).default; } });
var before_update_1 = require("./decorators/hooks/before-update");
Object.defineProperty(exports, "BeforeUpdate", { enumerable: true, get: function () { return __importDefault(before_update_1).default; } });
var replica_safe_1 = require("./decorators/replica-safe");
Object.defineProperty(exports, "ReplicaSafe", { enumerable: true, get: function () { return __importDefault(replica_safe_1).default; } });
var scope_1 = require("./decorators/scope");
Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return __importDefault(scope_1).default; } });
var soft_delete_1 = require("./decorators/soft-delete");
Object.defineProperty(exports, "SoftDelete", { enumerable: true, get: function () { return __importDefault(soft_delete_1).default; } });
var sortable_1 = require("./decorators/sortable");
Object.defineProperty(exports, "Sortable", { enumerable: true, get: function () { return __importDefault(sortable_1).default; } });
var validate_1 = require("./decorators/validations/validate");
Object.defineProperty(exports, "Validate", { enumerable: true, get: function () { return __importDefault(validate_1).default; } });
var validates_1 = require("./decorators/validations/validates");
Object.defineProperty(exports, "Validates", { enumerable: true, get: function () { return __importDefault(validates_1).default; } });
var virtual_1 = require("./decorators/virtual");
Object.defineProperty(exports, "Virtual", { enumerable: true, get: function () { return __importDefault(virtual_1).default; } });
var dream_1 = require("./dream");
Object.defineProperty(exports, "Dream", { enumerable: true, get: function () { return __importDefault(dream_1).default; } });
var dream_application_1 = require("./dream-application");
Object.defineProperty(exports, "DreamApplication", { enumerable: true, get: function () { return __importDefault(dream_application_1).default; } });
var lookupClassByGlobalName_1 = require("./dream-application/helpers/lookupClassByGlobalName");
Object.defineProperty(exports, "lookupClassByGlobalName", { enumerable: true, get: function () { return __importDefault(lookupClassByGlobalName_1).default; } });
var query_1 = require("./dream/query");
Object.defineProperty(exports, "Query", { enumerable: true, get: function () { return __importDefault(query_1).default; } });
var transaction_1 = require("./dream/transaction");
Object.defineProperty(exports, "DreamTransaction", { enumerable: true, get: function () { return __importDefault(transaction_1).default; } });
var types_1 = require("./dream/types");
Object.defineProperty(exports, "DreamConst", { enumerable: true, get: function () { return types_1.DreamConst; } });
Object.defineProperty(exports, "TRIGRAM_OPERATORS", { enumerable: true, get: function () { return types_1.TRIGRAM_OPERATORS; } });
Object.defineProperty(exports, "primaryKeyTypes", { enumerable: true, get: function () { return types_1.primaryKeyTypes; } });
var non_loaded_association_1 = require("./exceptions/associations/non-loaded-association");
Object.defineProperty(exports, "NonLoadedAssociation", { enumerable: true, get: function () { return __importDefault(non_loaded_association_1).default; } });
var create_or_find_by_failed_to_create_and_find_1 = require("./exceptions/create-or-find-by-failed-to-create-and-find");
Object.defineProperty(exports, "CreateOrFindByFailedToCreateAndFind", { enumerable: true, get: function () { return __importDefault(create_or_find_by_failed_to_create_and_find_1).default; } });
var global_name_not_set_1 = require("./exceptions/dream-application/global-name-not-set");
Object.defineProperty(exports, "GlobalNameNotSet", { enumerable: true, get: function () { return __importDefault(global_name_not_set_1).default; } });
var validation_error_1 = require("./exceptions/validation-error");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return __importDefault(validation_error_1).default; } });
var CalendarDate_1 = require("./helpers/CalendarDate");
Object.defineProperty(exports, "CalendarDate", { enumerable: true, get: function () { return __importDefault(CalendarDate_1).default; } });
var benchmark_1 = require("./helpers/benchmark");
Object.defineProperty(exports, "Benchmark", { enumerable: true, get: function () { return __importDefault(benchmark_1).default; } });
var camelize_1 = require("./helpers/camelize");
Object.defineProperty(exports, "camelize", { enumerable: true, get: function () { return __importDefault(camelize_1).default; } });
var capitalize_1 = require("./helpers/capitalize");
Object.defineProperty(exports, "capitalize", { enumerable: true, get: function () { return __importDefault(capitalize_1).default; } });
var compact_1 = require("./helpers/compact");
Object.defineProperty(exports, "compact", { enumerable: true, get: function () { return __importDefault(compact_1).default; } });
var debug_1 = require("./helpers/debug");
Object.defineProperty(exports, "debug", { enumerable: true, get: function () { return __importDefault(debug_1).default; } });
var developmentOrTestEnv_1 = require("./helpers/developmentOrTestEnv");
Object.defineProperty(exports, "developmentOrTestEnv", { enumerable: true, get: function () { return __importDefault(developmentOrTestEnv_1).default; } });
var hyphenize_1 = require("./helpers/hyphenize");
Object.defineProperty(exports, "hyphenize", { enumerable: true, get: function () { return __importDefault(hyphenize_1).default; } });
var inferSerializerFromDreamOrViewModel_1 = require("./helpers/inferSerializerFromDreamOrViewModel");
Object.defineProperty(exports, "inferSerializerFromDreamClassOrViewModelClass", { enumerable: true, get: function () { return inferSerializerFromDreamOrViewModel_1.inferSerializerFromDreamClassOrViewModelClass; } });
Object.defineProperty(exports, "inferSerializerFromDreamOrViewModel", { enumerable: true, get: function () { return __importDefault(inferSerializerFromDreamOrViewModel_1).default; } });
var loadRepl_1 = require("./helpers/loadRepl");
Object.defineProperty(exports, "loadRepl", { enumerable: true, get: function () { return __importDefault(loadRepl_1).default; } });
var pascalize_1 = require("./helpers/pascalize");
Object.defineProperty(exports, "pascalize", { enumerable: true, get: function () { return __importDefault(pascalize_1).default; } });
var dreamPath_1 = require("./helpers/path/dreamPath");
Object.defineProperty(exports, "dreamPath", { enumerable: true, get: function () { return __importDefault(dreamPath_1).default; } });
var range_1 = require("./helpers/range");
Object.defineProperty(exports, "Range", { enumerable: true, get: function () { return range_1.Range; } });
Object.defineProperty(exports, "range", { enumerable: true, get: function () { return __importDefault(range_1).default; } });
var round_1 = require("./helpers/round");
Object.defineProperty(exports, "round", { enumerable: true, get: function () { return __importDefault(round_1).default; } });
var snakeify_1 = require("./helpers/snakeify");
Object.defineProperty(exports, "snakeify", { enumerable: true, get: function () { return __importDefault(snakeify_1).default; } });
var testEnv_1 = require("./helpers/testEnv");
Object.defineProperty(exports, "testEnv", { enumerable: true, get: function () { return __importDefault(testEnv_1).default; } });
var uncapitalize_1 = require("./helpers/uncapitalize");
Object.defineProperty(exports, "uncapitalize", { enumerable: true, get: function () { return __importDefault(uncapitalize_1).default; } });
var uniq_1 = require("./helpers/uniq");
Object.defineProperty(exports, "uniq", { enumerable: true, get: function () { return __importDefault(uniq_1).default; } });
var types_2 = require("./openapi/types");
Object.defineProperty(exports, "openapiPrimitiveTypes", { enumerable: true, get: function () { return types_2.openapiPrimitiveTypes; } });
Object.defineProperty(exports, "openapiShorthandPrimitiveTypes", { enumerable: true, get: function () { return types_2.openapiShorthandPrimitiveTypes; } });
var ops_1 = require("./ops");
Object.defineProperty(exports, "ops", { enumerable: true, get: function () { return __importDefault(ops_1).default; } });
var serializer_1 = require("./serializer");
Object.defineProperty(exports, "DreamSerializer", { enumerable: true, get: function () { return __importDefault(serializer_1).default; } });
var renders_many_1 = require("./serializer/decorators/associations/renders-many");
Object.defineProperty(exports, "RendersMany", { enumerable: true, get: function () { return __importDefault(renders_many_1).default; } });
var renders_one_1 = require("./serializer/decorators/associations/renders-one");
Object.defineProperty(exports, "RendersOne", { enumerable: true, get: function () { return __importDefault(renders_one_1).default; } });
var attribute_1 = require("./serializer/decorators/attribute");
Object.defineProperty(exports, "Attribute", { enumerable: true, get: function () { return __importDefault(attribute_1).default; } });
