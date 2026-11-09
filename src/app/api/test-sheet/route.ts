import { NextResponse } from 'next/server';
import { getGoogleSheetsInstance } from '@/lib/googleSheets';

// 1. GET: Leer datos de la hoja
export async function GET() {
  try {
    const sheets = await getGoogleSheetsInstance();
    
    // Lee desde la primera pestaña (Hoja 1) rango A1 a Z100
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Hoja 1!A1:Z100',
    });

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa',
      data: response.data.values || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 2. POST: Insertar una fila de prueba
export async function POST() {
  try {
    const sheets = await getGoogleSheetsInstance();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Hoja 1!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['Prueba Next.js', 'Funciona correctamente', new Date().toLocaleString('es-PE')],
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Fila agregada correctamente a Google Sheets',
      updatedCells: response.data.updates?.updatedCells,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}