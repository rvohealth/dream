import Dream from '../../../dream';
import Query from '../../../dream/query';
export default function decrementPositionForScopedRecordsGreaterThanPosition(position: number, { dream, positionField, query, scope, }: {
    dream: Dream;
    positionField: string;
    query: Query<Dream>;
    scope?: string | string[];
}): Promise<void>;
