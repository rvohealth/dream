import Dream from '../../dream';
export default function loadModels(modelsPath: string): Promise<Record<string, typeof Dream>>;
export declare function setCachedModels(models: Record<string, typeof Dream>): void;
export declare function getModelsOrFail(): Record<string, typeof Dream>;
export declare function getModelsOrBlank(): Record<string, typeof Dream>;
