import { ValidationType } from './shared';
export default function Validates<VT extends ValidationType, VTArgs extends VT extends 'numericality' ? {
    min?: number;
    max?: number;
} : VT extends 'length' ? {
    min: number;
    max?: number;
} : VT extends 'contains' ? string | RegExp : never>(type: VT, args?: VTArgs): any;
export declare class ValidationInstantiationError extends Error {
}
