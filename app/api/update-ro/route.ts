import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '1i3Ji1Mxh65RwzQ4lp6lSWw0Axc6yeWtszbbf1FtAn_I';
const SHEET_NAME = 'roDatabase';

// Service account credentials
const GOOGLE_CREDENTIALS = {
  "type": "service_account",
  "project_id": "harvey-wayan-ai",
  "private_key_id": "9c696ef621d4eec8fea74f35cab18d5f0aae87a9",
  "private_key": process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDn6s/p3Z69js+z
iamgDLOI43+8ddkJEwkcYFNj/e6AlKW3PNUoo3xNQcX59m20seTULbIopxKboVjK
SWjC6TMEt3TqK6E9XVZzw3WOQij7f6lreS5plvuDP7mt+GaWwjI0nx4HCLTzSrqC
Hy/T+w60MsOMBuxhvrG+T9zvOmvFkj/ZRX0iTizpzYgDxek3uw0IhaZYCVx72jvU
kopZLmrLMmhRm879e6G9byEMGot/VAg4yuGHoHEwhTsW67CBGEl4zAU2Wvg2syFE
JnFHstGjTyPEb67NE5llI/x6z5osq6OQEPbMjGyYD38w3lo5IVTl9Y86wWrlGule
++kXDz7LAgMBAAECggEAFUN6v6sMXb3v05AeJ34H91eV2SOG/DrXaCzOyIlk6jt2
0Yz4JaCOX45VxrwuRSsrBhHl1q4G2efFD9BY6hyz4E1VILlSWyF+houtG2zRJsoG
2xiXxaJMZOAdYqg2o8D3ayAMV+xs8YJFr8jd5kDhEWrhcf/FLEBt5JCcUFTaF8RL
JeiiL0rWySVIlTPg4XSGjn5lrcM2C10TcScNdphYtQvYE4i/bD38/woY0UTKa7Xa
JdtTc7ioSx65kOJnM9p3fsU13ACZFlXuA76XYnnSJVrH6/oGn0QVvjHr4pnqa05b
7/GoOlcTLIcnqtH1FkWQakyHhoh2klbck1cgIfkTQQKBgQD27yFEqkK4uLC0CxcM
jEGmSx2oCg3tfaqPm9GWARC/67OicN1exPR1xGgz3RGZc0FnmSOdFftGPPfaK+oF
kbyicPfxoTjyMRxJDj+k/FKhLuX3TqAEW1m29O2V5RI3BKaltL25Ju+jTCADjiMm
9PWhkLeo7WRoVTs0bV7KdXJFiwKBgQDwborkYQX9egMZhd/KAI7sRFPpl6C1p801
iBUe6AaiXvps+cugSRyhZSi0DOs0/CmrApaEmKptwbnmHVSHV7kughQrKXBlkjPs
shSXfbe+BvqGzEkE2C/XG6L810mPf2GYWqg/6YKeqsAw/M4MotSKAYGP6baSv9Aw
OyO8LS6TwQKBgAlKojPVPEF7IZsEt89PD8FUHj+OcUu4aMySjmZYj+rI0a+RE6NX
QeOUil85OEpP3ewqBP8KLrRL4v+gm2OuQizSl2HOMThbxLazBI4OuIU8IIcXvEmt
rkiGGtKDFhZf5G1jyafH4UiBusqndIcovH1h1qdSl26dlma4ntJ7bNtVAoGAS3in
qKC8HKEcL/rSELq0In4gSQcLr3oI9HDPEHCNBJMD0QloXdwVXKRAbqRPgMZW3hNl
5CF3/hP9oro6OnHS80JpylKrsXZ/TiFoTVVtQ/00zvN5SEgEXGWUeAGsWZsGq6hp
gAZwthWrVrVEiLrkNJ3caaxXXyFO3JTz1rHoGQECgYEArF5dhIdWwADonna76HET
t6ofTnbFZzQeFVP1Q4jTToXUATSx0mP5Pj1w5gyMZg1S9BHRpTAqGOZVSTKHrMRP
12eFpE3NYnHq4BZSL967sHxQ8TnDbWDHm9seriqfl1VCw/tQpKTY5oarWbulZTCJ
GlH3B0VtTznIJM/tEH0bgS0=
-----END PRIVATE KEY-----`,
  "client_email": "harvey-access@harvey-wayan-ai.iam.gserviceaccount.com",
  "client_id": "101497754115633578359",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
};

export async function POST(request: Request) {
  try {
    const { roId, articles } = await request.json();
    
    const auth = new JWT({
      email: GOOGLE_CREDENTIALS.client_email,
      key: GOOGLE_CREDENTIALS.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get all data to find rows
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
          const rowNumber = i + 1;
          updates.push({
            range: `${SHEET_NAME}!E${rowNumber}:G${rowNumber}`,
            values: [[article.ddd.toString(), article.ljbb.toString(), (article.ddd + article.ljbb).toString()]],
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
      message: `Updated ${updates.length} articles`,
      updates: updates.length
    });
    
  } catch (error: any) {
    console.error('Error updating sheet:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
