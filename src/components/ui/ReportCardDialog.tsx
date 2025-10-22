import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface ReportCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowData: any;
  type: 'points' | 'lines' | 'polygons';
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

  // Determine title based on type
  const typeLabels = {
    points: 'Точка',
    lines: 'Линия',
    polygons: 'Полигон'
  };

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
