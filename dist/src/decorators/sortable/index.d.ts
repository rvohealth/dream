export default function Sortable(opts?: SortableOpts): any;
export interface SortableOpts {
    scope?: string | string[];
}
export interface SortableFieldConfig {
    scope: string[];
    positionField: string;
}
