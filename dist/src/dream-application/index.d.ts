import Dream from '../dream';
import { primaryKeyTypes } from '../dream/types';
import DreamSerializer from '../serializer';
export default class DreamApplication {
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
    static init(cb: (dreamApp: DreamApplication) => void | Promise<void>, opts?: Partial<DreamApplicationOpts>, deferCb?: (dreamApp: DreamApplication) => Promise<void> | void): Promise<DreamApplication>;
    /**
     * Returns the cached dream application if it has been set.
     * If it has not been set, an exception is raised.
     *
     * The dream application can be set by calling DreamApplication#init,
     * or alternatively, if you are using Psychic along with Dream,
     * it can be set during PsychicApplication#init, which will set caches
     * for both the dream and psychic applications at once.
     */
    static getOrFail(): DreamApplication;
    dbCredentials: DreamDbCredentialOptions;
    primaryKeyType: (typeof primaryKeyTypes)[number];
    projectRoot: string;
    paths: Required<DreamDirectoryPaths>;
    inflections?: () => void | Promise<void>;
    protected loadedModels: boolean;
    constructor(opts?: Partial<DreamApplicationOpts>);
    get models(): Record<string, typeof Dream>;
    get serializers(): Record<string, typeof DreamSerializer>;
    get services(): Record<string, any>;
    load(resourceType: 'models' | 'serializers' | 'services', resourcePath: string): Promise<void>;
    set<ApplyOpt extends ApplyOption>(applyOption: ApplyOpt, options: ApplyOpt extends 'db' ? DreamDbCredentialOptions : ApplyOpt extends 'primaryKeyType' ? (typeof primaryKeyTypes)[number] : ApplyOpt extends 'projectRoot' ? string : ApplyOpt extends 'inflections' ? () => void | Promise<void> : ApplyOpt extends 'paths' ? DreamDirectoryPaths : never): void;
}
export interface DreamApplicationOpts {
    projectRoot: string;
    primaryKeyType: (typeof primaryKeyTypes)[number];
    db: DreamDbCredentialOptions;
    inflections?: () => void | Promise<void>;
    paths?: DreamDirectoryPaths;
}
export type ApplyOption = 'db' | 'primaryKeyType' | 'projectRoot' | 'inflections' | 'paths';
export interface DreamDirectoryPaths {
    models?: string;
    serializers?: string;
    services?: string;
    conf?: string;
    db?: string;
    modelSpecs?: string;
    factories?: string;
}
export interface DreamDbCredentialOptions {
    primary: SingleDbCredential;
    replica?: SingleDbCredential;
}
export interface SingleDbCredential {
    user: string;
    password: string;
    host: string;
    name: string;
    port: number;
    useSsl: boolean;
}
