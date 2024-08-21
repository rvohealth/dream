export default function loadServices(servicesPath: string): Promise<Record<string, any>>;
export declare function setCachedServices(services: Record<string, any>): void;
export declare function getServicesOrFail(): Record<string, any>;
export declare function getServicesOrBlank(): Record<string, any>;
