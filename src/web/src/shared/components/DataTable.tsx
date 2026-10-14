import { useTranslation } from 'react-i18next';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({ columns, data, loading, onRowClick, emptyMessage }: DataTableProps<T>) {
  const { t } = useTranslation();
  if (loading) return <div className="table-loading">{t('common.loading')}</div>;
  if (!data.length) return <div className="table-empty">{emptyMessage || t('common.noData')}</div>;
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>{columns.map((col) => <th key={col.key}>{col.header}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.id as string || i} onClick={() => onRowClick?.(item)} className={onRowClick ? 'clickable' : ''}>
              {columns.map((col) => <td key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
