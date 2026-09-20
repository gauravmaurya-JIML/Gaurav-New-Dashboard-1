import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { sheets } from '@googleapis/sheets';
export const dynamic = 'force-dynamic';
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const pick = (record, tests) => { const entry = Object.entries(record).find(([key]) => tests.some(test => test.test(key))); return entry ? clean(entry[1]) : ''; };
export async function GET() { try {
  const sheetId = process.env.GOOGLE_SHEET_ID, sheetName = process.env.GOOGLE_SHEET_NAME || 'Ritesh Sharma';
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!sheetId || !email || !privateKey) return NextResponse.json({ live: false, companies: [] });
  const auth = new JWT({ email, key: privateKey, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const client = sheets({ version: 'v4', auth });
  const response = await client.spreadsheets.values.get({ spreadsheetId: sheetId, range: "'" + sheetName + "'!A:AZ" });
  const values = response.data.values || []; if (values.length < 2) return NextResponse.json({ live: true, companies: [] });
  const headers = values[0].map(clean);
  const companies = values.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || '']))).map(record => {
    const details = pick(record, [/^Last Conversation Details$/i]), nextAction = pick(record, [/^Next Planned Action$/i]), status = pick(record, [/^Status of Company$/i]);
    const completed = /^(completed|closed)$/i.test(status) || /process completed|completed process/i.test(details + ' ' + nextAction);
    return { owner: pick(record, [/^Owner$/i]), company: pick(record, [/^Company Name$/i, /^Comany Name$/i]), category: pick(record, [/New\/Existing\/Assigned/i]), status: status || 'Not updated', industry: pick(record, [/^Industry$/i]), expectedCtc: pick(record, [/^Expected CTC$/i, /^Expected Salary$/i]), lastConversation: pick(record, [/^Last Conversation Date/i]), nextAction: nextAction || 'Next action not recorded', targetMonth: pick(record, [/^Targeted Month/i]), processStatus: completed ? 'Completed' : 'Under Discussion' };
  }).filter(company => company.company);
  return NextResponse.json({ live: true, companies, refreshedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
} catch (error) { console.error('Google Sheets read failed:', error.message); return NextResponse.json({ live: false, companies: [], error: 'Unable to read Google Sheet' }, { status: 500 }); } }
