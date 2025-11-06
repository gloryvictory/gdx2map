import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { BACKEND_SERVER_URL, RGF_URL } from '../../config';
import { useEffect, useState } from 'react';

interface ReportCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowData: any;
  type: 'points' | 'lines' | 'polygons';
}

interface RgfData {
  [key: string]: any;
}

export function ReportCardDialog({ open, onOpenChange, rowData, type }: ReportCardDialogProps) {
  // Define field descriptions for Russian labels
  const fieldDescriptions: Record<string, string> = {
    avts: 'Автор',
    name_otch: 'Отчет',
    org_isp: 'Организация',
    god_nach: 'Год начала',
    god_end: 'Год окончания',
    method: 'Метод',
    nom_1000: 'Лист',
    scale: 'Масштаб',
    tgf: 'ТГФ',
    in_n_rosg: 'инв. № РГФ',
    in_n_tgf: 'инв. № ТГФ',
    n_uk_rosg: '№ РГФ',
    n_uk_tgf: '№ ТГФ',
    web_uk_id: '№',
    vid_iz: 'Вид',
    id: '№',
    name_otch1: 'Отчет (дополнительно)',
  };

  // RGF field descriptions
  const rgfFieldDescriptions: Record<string, string> = {
    // Add descriptions for RGF fields as needed
  };

  // Define the order of fields to display
  const fieldOrder = [
    'id', 'avts', 'name_otch', 'org_isp', 'god_nach', 'god_end',
    'method', 'nom_1000', 'scale', 'tgf', 'in_n_rosg', 'in_n_tgf',
    'n_uk_rosg', 'n_uk_tgf', 'web_uk_id', 'vid_iz', 'name_otch1'
  ];

  // Filter out fields with null or undefined values
  const displayData = rowData && typeof rowData === 'object' ? Object.entries(rowData)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .filter(([key]) => fieldOrder.includes(key) || key === 'id') // Include id if present
    .sort(([a], [b]) => {
      const indexA = fieldOrder.indexOf(a);
      const indexB = fieldOrder.indexOf(b);
      // Sort by field order, with unknown fields at the end
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    }) : [];

  const [rgfData, setRgfData] = useState<RgfData | null>(null);
  const [rgfLoading, setRgfLoading] = useState(false);
  const [rgfError, setRgfError] = useState<string | null>(null);

  // Determine title based on type
  const typeLabels = {
    points: 'Точка',
    lines: 'Линия',
    polygons: 'Полигон'
  };

  // Fetch RGF data when dialog opens and rowData has RGF number
  useEffect(() => {
    if (open && rowData?.n_uk_rosg && rowData.n_uk_rosg !== 'None') {
      const fetchRgfData = async () => {
        setRgfLoading(true);
        setRgfError(null);
        try {
          const url_rgf_get = `${BACKEND_SERVER_URL}${RGF_URL}${rowData.n_uk_rosg}`
          console.log('Fetching RGF data:', url_rgf_get);
          const response = await fetch(url_rgf_get);
          console.log('Error fetching RGF data:', response);
          if (response.ok) {
            const result = await response.json();
            // Check if result.data exists and is not empty
            if (result && result.data && typeof result.data === 'object' && Object.keys(result.data).length > 0) {
              setRgfData(result.data);
            } else {
              setRgfData(null);
            }
          } else {
            setRgfData(null);
          }
        } catch (error) {
          console.error('Error fetching RGF data:', error);
          setRgfError('Ошибка при загрузке данных РГФ');
          setRgfData(null);
        } finally {
          setRgfLoading(false);
        }
      };

      fetchRgfData();
    } else {
      setRgfData(null);
      setRgfError(null);
    }
  }, [open, rowData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Карточка отчета - {typeLabels[type]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {displayData.length > 0 ? (
            displayData.map(([key, value]) => (
              <div key={key} className="flex border-b border-gray-200 pb-2">
                <div className="w-1/3 font-medium text-gray-700">
                  {fieldDescriptions[key] || key}
                </div>
                <div className="w-2/3 text-gray-900">
                  {value !== null && value !== undefined ? String(value) : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Нет данных для отображения
            </div>
          )}
          {/* Display RGF data if available */}
          {rgfLoading && (
            <div className="pt-4 text-center text-muted-foreground">
              <div className="flex justify-center my-4">
                <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
              <p>Загрузка данных РГФ...</p>
            </div>
          )}
          {rgfError && (
            <div className="pt-4 text-center text-red-500">
              {rgfError}
            </div>
          )}
          {!rgfLoading && !rgfError && rgfData && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="font-bold text-lg mb-2">Дополнительная информация из РГФ</h3>
              {Object.entries(rgfData)
                .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                .map(([key, value]) => (
                  <div key={key} className="flex border-b border-gray-200 pb-2">
                    <div className="w-1/3 font-medium text-gray-700">
                      {rgfFieldDescriptions[key] || key}
                    </div>
                    <div className="w-2/3 text-gray-900">
                      {value !== null && value !== undefined ? String(value) : ''}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!rgfLoading && !rgfError && !rgfData && rowData?.n_uk_rosg && rowData.n_uk_rosg !== 'None' && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-center text-muted-foreground">Дополнительные данные отсутствуют</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
