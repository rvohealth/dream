import DreamSerializer from '../../serializer';
export default function loadSerializers(serializersPath: string): Promise<Record<string, typeof DreamSerializer>>;
export declare function setCachedSerializers(serializers: Record<string, typeof DreamSerializer>): void;
export declare function getSerializersOrFail(): Record<string, typeof DreamSerializer>;
export declare function getSerializersOrBlank(): Record<string, typeof DreamSerializer>;
