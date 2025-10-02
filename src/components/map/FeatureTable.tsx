import { MapGeoJSONFeature } from 'maplibre-gl';

interface FeatureTableProps {
  feature: MapGeoJSONFeature;
  index: number;
}

export const FeatureTable = ({ feature, index }: FeatureTableProps) => {
  const properties = feature.properties || {};
  
  // Массив строк таблицы с названиями и ключами свойств
  const tableRows = [
    { label: 'Автор', key: 'avts' },
    { label: 'Отчет', key: 'name_otch' },
    { label: 'Организация', key: 'org_isp' },
    { label: 'Год начала', key: 'god_nach' },
    { label: 'Год окончания', key: 'god_end' },
    { label: 'Метод', key: 'method' },
    { label: 'Лист', key: 'nom_1000' },
    { label: 'Масштаб', key: 'scale' },
    { label: 'ТГФ', key: 'tgf' },
    { label: 'инв. № РГФ', key: 'in_n_rosg' },
    { label: 'инв. № ТГФ', key: 'in_n_tgf' },
    { label: '№ РГФ', key: 'n_uk_rosg' },
    { label: '№ ТГФ', key: 'n_uk_tgf' },
    { label: '№', key: 'web_uk_id' }, 
    { label: 'Вид', key: 'vid_iz' },
    { label: '№', key: 'id' },
  ];

  return (
    <div className="overflow-x-auto mb-6">
      <h3 className="font-medium mb-2 dark:text-slate-200">
        Отчет {index + 1}
      </h3>
      <table className="min-w-full border-collapse mb-4">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 dark:bg-slate-800 dark:text-slate-200">Параметр</th>
            <th className="border border-gray-300 p-2 dark:bg-slate-800 dark:text-slate-200">Значение</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, rowIndex) => (
            <tr 
              key={row.key}
              className={rowIndex % 2 === 0 ? 
                'bg-white dark:bg-slate-800' : 
                'bg-gray-50 dark:bg-slate-700'
              }
            >
              <td className="border border-gray-300 p-2 dark:text-slate-200">{row.label}</td>
              <td className="border border-gray-300 p-2 dark:text-slate-200">
                {properties[row.key] || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
