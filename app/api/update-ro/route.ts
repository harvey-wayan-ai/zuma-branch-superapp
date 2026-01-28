import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '1i3Ji1Mxh65RwzQ4lp6lSWw0Axc6yeWtszbbf1FtAn_I';
const SHEET_NAME = 'roDatabase';

export async function POST(request: Request) {
  try {
    const { roId, articles } = await request.json();
    
    // Load service account credentials
    const credentials = require('/root/.google-credentials.json');
    
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // First, get all data to find rows
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
    });
    
    const rows = getResponse.data.values || [];
    const updates = [];
    
    // Find and update each article
    for (const article of articles) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === roId && row[2] === article.code) {
          // Row index is i+1 (1-based for Sheets API)
          const rowNumber = i + 1;
          updates.push({
            range: `${SHEET_NAME}!E${rowNumber}:F${rowNumber}`,
            values: [[article.ddd.toString(), article.ljbb.toString()]],
          });
          
          // Update total (column G)
          const total = article.ddd + article.ljbb;
          updates.push({
            range: `${SHEET_NAME}!G${rowNumber}`,
            values: [[total.toString()]],
          });
        }
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No matching rows found' }, { status: 404 });
    }
    
    // Batch update all changes
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updates.length / 2} articles`,
      updates: updates.length / 2
    });
    
  } catch (error: any) {
    console.error('Error updating sheet:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
