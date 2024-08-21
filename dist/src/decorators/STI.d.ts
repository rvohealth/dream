import Dream from '../dream';
export declare const STI_SCOPE_NAME = "dream:STI";
export default function STI(dreamClass: typeof Dream, { value }?: {
    value?: string;
}): ClassDecorator;
