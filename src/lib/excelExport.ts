import * as XLSX from 'xlsx';
import type { Feature, ReportRow } from '../types';

// Функция для экспорта атрибутивных данных в Excel
export function exportLuFeaturesToExcel(luFeature: Feature, pointsData: ReportRow[], linesData: ReportRow[], polygonsData: ReportRow[]) {
  // Создаем новую рабочую книгу
  const wb = XLSX.utils.book_new();

  // Определяем описания полей
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
    // Добавляем возможные поля для лицензионных участков
    name_rus: 'Название (рус.)',
    name: 'Название',
    // Добавьте другие возможные поля по мере необходимости
  };

  // Функция для преобразования данных с русскими заголовками
  const convertDataWithHeaders = (data: ReportRow[]) => {
    if (data.length === 0) return { data: [], headers: [] };
    
    // Получаем все уникальные ключи
    const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
    
    // Создаем заголовки с русскими названиями
    const headers = allKeys.map(key => fieldDescriptions[key] || key);
    
    // Преобразуем данные, заменяя ключи на русские заголовки
    const convertedData = [
      headers, // Заголовки в первой строке
      ...data.map(item => allKeys.map(key => item[key as keyof ReportRow] || ''))
    ];
    
    return { data: convertedData, headers: allKeys };
  };

 // Создаем вкладки для каждой категории данных с русскими заголовками
  if (pointsData && pointsData.length > 0) {
    const { data: convertedPointsData } = convertDataWithHeaders(pointsData);
    const wsPoints = XLSX.utils.aoa_to_sheet(convertedPointsData);
    XLSX.utils.book_append_sheet(wb, wsPoints, 'Точки');
  }

  if (linesData && linesData.length > 0) {
    const { data: convertedLinesData } = convertDataWithHeaders(linesData);
    const wsLines = XLSX.utils.aoa_to_sheet(convertedLinesData);
    XLSX.utils.book_append_sheet(wb, wsLines, 'Линии');
  }

  if (polygonsData && polygonsData.length > 0) {
    const { data: convertedPolygonsData } = convertDataWithHeaders(polygonsData);
    const wsPolygons = XLSX.utils.aoa_to_sheet(convertedPolygonsData);
    XLSX.utils.book_append_sheet(wb, wsPolygons, 'Полигоны');
  }

  // Создаем вкладку "Поля" с соответствиями латинских и русских названий
  const fieldMappings = Object.entries(fieldDescriptions).map(([latin, russian]) => [latin, russian]);
  const wsFields = XLSX.utils.aoa_to_sheet([
    ['Латинское название', 'Русское название'],
    ...fieldMappings
  ]);
  XLSX.utils.book_append_sheet(wb, wsFields, 'Поля');

  // Генерируем имя файла на основе имени участка
  const fileName = `Лицензионный_участок_${luFeature.properties.name_rus || luFeature.properties.name || luFeature.properties.id}.xlsx`;

  // Сохраняем файл
 XLSX.writeFile(wb, fileName);
}
