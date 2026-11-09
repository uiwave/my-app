import { NextResponse } from 'next/server';
import { getGoogleSheetsInstance } from '@/lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// GET: Obtener días configurados y horarios relacionados
export async function GET() {
  try {
    const sheets = await getGoogleSheetsInstance();

    // Consulta en paralelo de ambas pestañas
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: ['Dias!A2:C', 'Horarios!A2:E'],
    });

    const valueRanges = response.data.valueRanges || [];
    const diasRows = valueRanges[0]?.values || [];
    const horariosRows = valueRanges[1]?.values || [];

    // Map para búsqueda rápida de días por su ID
    const diasMap = new Map(
      diasRows.map((row) => [
        row[0], // id (ej. dia-1)
        { id: row[0], nombre: row[1], activo: row[2] === 'TRUE' },
      ])
    );

    // Lista de días activos (los que el usuario decidió trabajar)
    const diasLista = Array.from(diasMap.values());

    // JOIN de Horarios con la info de Dias
    const horarios = horariosRows
      .filter((row) => row[0]) // Filtra filas vacías
      .map((row) => ({
        id: row[0],
        materia: row[1] || '',
        diaId: row[2] || '',
        dia: diasMap.get(row[2]) || null, // Relación poblada
        horaInicio: row[3] || '',
        horaFin: row[4] || '',
      }));

    return NextResponse.json({
      success: true,
      data: {
        dias: diasLista,
        horarios,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo horario vinculado a un diaId
export async function POST(request: Request) {
  try {
    const { materia, diaId, horaInicio, horaFin } = await request.json();
    const sheets = await getGoogleSheetsInstance();
    const id = Date.now().toString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Horarios!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, materia, diaId, horaInicio, horaFin]],
      },
    });

    return NextResponse.json({ success: true, message: 'Horario registrado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}