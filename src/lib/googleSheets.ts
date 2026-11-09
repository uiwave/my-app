import { google } from 'googleapis';

export async function getGoogleSheetsInstance() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  // Reemplazar saltos de línea escapados de la clave privada
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Usar auth.JWT elimina la advertencia de deprecación
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}