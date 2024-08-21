import Dream from '../../../dream';
import Query from '../../../dream/query';
import DreamTransaction from '../../../dream/transaction';
export default function afterUpdateSortable({ positionField, dream, query, txn, scope, }: {
    positionField: string;
    dream: Dream;
    query: Query<Dream>;
    txn?: DreamTransaction<any>;
    scope?: string | string[];
}): Promise<void>;
