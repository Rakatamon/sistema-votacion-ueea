import xlsx from 'xlsx';

try {
    const workbook = xlsx.readFile('DOCS/listado estudiantes 2026 CONSEJO ESTUDIANTIL.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Loaded ${data.length} rows.`);
    console.log('Rows 5 to 10:');
    console.log(data.slice(5, 10));
} catch (e) {
    console.error('Error:', e);
}
