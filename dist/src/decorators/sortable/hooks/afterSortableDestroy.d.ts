import Dream from '../../../dream';
import Query from '../../../dream/query';
export default function afterSortableDestroy({ positionField, dream, query, scope, }: {
    positionField: string;
    dream: Dream;
    query: Query<Dream>;
    scope?: string | string[];
}): Promise<void>;
