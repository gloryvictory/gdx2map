import type { Feature } from '../../types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { Filter, FilterX, MapPin, Square } from 'lucide-react';

interface FeatureTableProps {
  feature: Feature;
  index: number;
  selectedFeature: Feature | null;
  onFeatureSelect: (feature: Feature | null) => void;
  onFeatureHover: (feature: Feature | null) => void;
  onZoomToFeature?: (feature: Feature) => void;
  onShowBbox?: (feature: Feature) => void;
  onFilterToFeature?: (row: any, type: 'points' | 'lines' | 'polygons') => void;
  onClearFilter?: () => void;
  isFiltered?: boolean;
}

export const FeatureTable = ({ 
  feature, 
  index, 
  selectedFeature, 
  onFeatureSelect, 
  onFeatureHover,
  onZoomToFeature,
  onShowBbox,
  onFilterToFeature,
  onClearFilter,
  isFiltered
}: FeatureTableProps) => {
  const properties = feature.properties || {};

  // Определение типа геометрии
  const layerType = feature.layer.id.split('.')[1];
  const geometryType = layerType === 'stp' ? 'точка' : layerType === 'stl' ? 'линия' : 'полигон';

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

  const isSelected = selectedFeature && selectedFeature.properties.id === feature.properties.id;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="overflow-x-auto mb-6">
          <h3
            className={`font-medium mb-2 dark:text-slate-200 cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-blue-200 dark:bg-blue-800 p-1 rounded' : 'hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded'}`}
            onClick={() => onFeatureSelect(isSelected ? null : feature)}
            onMouseEnter={() => onFeatureHover(feature)}
            onMouseLeave={() => onFeatureHover(null)}
          >
            Отчет {index + 1} ({geometryType})
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
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem 
          onClick={() => {
            if (onZoomToFeature) {
              onZoomToFeature(feature);
            }
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Показать на карте
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => {
            if (onShowBbox) {
              onShowBbox(feature);
            }
          }}
        >
          <Square className="w-4 h-4 mr-2" />
          Показать bbox
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => {
            if (onFilterToFeature) {
              // Передаем properties и тип геометрии
              const type = feature.layer.id.split('.')[1];
              const featureType = type === 'stp' ? 'points' : type === 'stl' ? 'lines' : 'polygons';
              onFilterToFeature(feature.properties, featureType);
            }
          }}
        >
          <Filter className="w-4 h-4 mr-2" />
          Показать только этот
        </ContextMenuItem>
        {isFiltered && (
          <ContextMenuItem 
            onClick={() => {
              if (onClearFilter) {
                onClearFilter();
              }
            }}
          >
            <FilterX className="w-4 h-4 mr-2" />
            Показать все
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
