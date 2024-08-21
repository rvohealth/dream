import Dream from '../dream';
import { SerializableDreamClassOrViewModelClass, SerializableDreamOrViewModel } from '../dream/types';
export default function inferSerializerFromDreamOrViewModel(obj: Dream | SerializableDreamOrViewModel, serializerKey?: string | undefined): typeof import("..").DreamSerializer | null;
export declare function inferSerializerFromDreamClassOrViewModelClass(classDef: SerializableDreamClassOrViewModelClass, serializerKey?: string | undefined): typeof import("..").DreamSerializer | null;
