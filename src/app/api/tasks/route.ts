import { NextResponse } from 'next/server';
import { getGoogleSheetsInstance } from '@/lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE_FULL = 'Tareas!A2:D';

// GET: Obtener todas las tareas
export async function GET() {
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FULL,
    });

    const rows = response.data.values || [];
    const tasks = rows
      .filter((row) => row[0])
      .map((row) => ({
        id: row[0],
        titulo: row[1] || '',
        descripcion: row[2] || '',
        columnaId: row[3] || '',
      }));

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear una nueva tarea en una columna específica
export async function POST(request: Request) {
  try {
    const { titulo, descripcion, columnaId } = await request.json();

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ success: false, error: 'El título es obligatorio' }, { status: 400 });
    }

    if (!columnaId) {
      return NextResponse.json({ success: false, error: 'Debe indicarse la columna' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsInstance();

    // Validar que la columna exista
    const colsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Columnas!A2:A',
    });
    const colIds = (colsRes.data.values || []).map((r) => r[0]);
    if (!colIds.includes(columnaId)) {
      return NextResponse.json({ success: false, error: 'La columna no existe' }, { status: 400 });
    }

    const id = `task-${Date.now()}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Tareas!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, titulo.trim(), descripcion || '', columnaId]],
      },
    });

    return NextResponse.json({ success: true, message: 'Tarea creada', data: { id, titulo, descripcion, columnaId } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Mover una tarea de columna
export async function PATCH(request: Request) {
  try {
    const { id, nuevaColumnaId } = await request.json();

    if (!id || !nuevaColumnaId) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsInstance();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FULL,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Actualizamos únicamente la celda de columnaId (Columna D)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Tareas!D${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[nuevaColumnaId]],
      },
    });

    return NextResponse.json({ success: true, message: 'Tarea movida exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
