import { NextResponse } from 'next/server';
import { getGoogleSheetsInstance } from '@/lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE_FULL = 'Columnas!A2:D';

// GET: Obtener todas las columnas ordenadas
export async function GET() {
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FULL,
    });

    const rows = response.data.values || [];
    const columns = rows
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0],
        nombre: r[1] || 'Sin Nombre',
        orden: Number(r[2]) || 0,
        color: r[3] || 'blue',
      }))
      .sort((a, b) => a.orden - b.orden);

    return NextResponse.json({ success: true, data: columns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear una nueva columna dinámica
export async function POST(request: Request) {
  try {
    const { nombre, color = 'blue' } = await request.json();

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsInstance();

    // Obtener columnas actuales para calcular el siguiente número de orden
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FULL,
    });
    const rows = res.data.values || [];
    const id = `col-${Date.now()}`;
    const orden = rows.filter((r) => r[0]).length + 1;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Columnas!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nombre.trim(), orden, color]],
      },
    });

    return NextResponse.json({ success: true, message: 'Columna creada', data: { id, nombre, orden, color } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Renombrar, cambiar color o mover (reordenar) una columna
export async function PATCH(request: Request) {
  try {
    const { id, nombre, color, orden } = await request.json();

    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FULL,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: 'Columna no encontrada' }, { status: 404 });
    }

    // Actualizaciones puntuales de nombre (B), orden (C) o color (D)
    if (nombre !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Columnas!B${rowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[nombre]] },
      });
    }

    if (color !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Columnas!D${rowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[color]] },
      });
    }

    if (orden !== undefined) {
      // Reordenar: mover la columna al índice indicado y reescribir la hoja ordenada
      const items = rows
        .filter((r) => r[0])
        .sort((a, b) => (Number(a[2]) || 0) - (Number(b[2]) || 0));

      const idx = items.findIndex((item) => item[0] === id);
      if (idx !== -1) {
        const [moved] = items.splice(idx, 1);
        items.splice(orden, 0, moved);

        const ordered = items.map((item, i) => [item[0], item[1], i + 1, item[3]]);

        await sheets.spreadsheets.values.clear({
          spreadsheetId: SHEET_ID,
          range: 'Columnas!A2:D',
        });

        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Columnas!A:D',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: ordered },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Columna actualizada' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar una columna (solo si no tiene tareas)
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const sheets = await getGoogleSheetsInstance();

    // Bloquear si hay tareas usando esta columna
    const tasksRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Tareas!A2:D',
    });
    const taskRows = tasksRes.data.values || [];
    const hasTasks = taskRows.some((row) => row[3] === id);

    if (hasTasks) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar: la columna tiene tareas. Muévelas o elimínalas primero.' },
        { status: 409 }
      );
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FULL,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: 'Columna no encontrada' }, { status: 404 });
    }

    // Reescribir la hoja sin la columna eliminada y renumerando el orden
    const remaining = rows
      .filter((row) => row[0] && row[0] !== id)
      .map((row, i) => [row[0], row[1], i + 1, row[3]]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'Columnas!A2:D',
    });

    if (remaining.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Columnas!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: remaining },
      });
    }

    return NextResponse.json({ success: true, message: 'Columna eliminada' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
