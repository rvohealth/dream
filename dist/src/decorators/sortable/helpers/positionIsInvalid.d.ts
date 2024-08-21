import Dream from '../../../dream';
import Query from '../../../dream/query';
export default function positionIsInvalid({ query, dream, position, scope, }: {
    query: Query<Dream>;
    dream: Dream;
    position: number | null | undefined;
    scope?: string | string[];
}): Promise<boolean>;
