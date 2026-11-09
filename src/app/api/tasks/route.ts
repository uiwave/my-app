import { NextResponse } from 'next/server';
import { getGoogleSheetsInstance } from '@/lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE_FULL = 'Tareas!A2:E';

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
        estado: row[3] || 'todo', // 'todo' | 'in_progress' | 'done'
        diaId: row[4] || '',
      }));

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear una nueva tarea
export async function POST(request: Request) {
  try {
    const { titulo, descripcion, estado = 'todo', diaId = '' } = await request.json();
    const sheets = await getGoogleSheetsInstance();
    const id = `task-${Date.now()}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Tareas!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, titulo, descripcion, estado, diaId]],
      },
    });

    return NextResponse.json({ success: true, message: 'Tarea creada', data: { id, titulo, descripcion, estado, diaId } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Cambiar el estado de una tarea (Al mover entre columnas)
export async function PATCH(request: Request) {
  try {
    const { id, nuevoEstado } = await request.json();
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

    const rowNumber = rowIndex + 2;
    const taskRow = rows[rowIndex];

    // Actualizamos únicamente la celda del estado (Columna D)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Tareas!D${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[nuevoEstado]],
      },
    });

    return NextResponse.json({ success: true, message: 'Estado actualizado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}