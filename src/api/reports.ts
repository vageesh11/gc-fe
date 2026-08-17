import client from './client';
import type { WeeklyReport, DailyReport, MonthlyReport, ReportData } from '../types';

// ─── Daily ────────────────────────────────────────────────────────────────────

export async function getDailyReport(date: string): Promise<ReportData> {
  const res = await client.get('/reports/daily', { params: { date } });
  const d: DailyReport = res.data.data;
  return {
    period_label: new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    }),
    summary: d.summary,
    table_breakdown: d.table_breakdown,
    top_items: d.top_items,
    sessions: d.sessions,
  };
}

export async function downloadDailyExcel(date: string): Promise<void> {
  const token = localStorage.getItem('gc_token');
  const res = await fetch(`http://localhost:3000/api/reports/daily/excel?date=${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to download');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `bengaluru-snooker-club-daily-${date}.xlsx`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Weekly ───────────────────────────────────────────────────────────────────

export async function getWeeklyReport(weekStart: string): Promise<ReportData> {
  const res = await client.get('/reports/weekly', { params: { week_start: weekStart } });
  const d: WeeklyReport = res.data.data;
  const from = new Date(d.week_start + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const to   = new Date(d.week_end   + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return {
    period_label: `${from} — ${to}`,
    summary: d.summary,
    table_breakdown: d.table_breakdown,
    top_items: d.top_items,
    sessions: d.sessions,
  };
}

export async function downloadWeeklyExcel(weekStart: string): Promise<void> {
  const token = localStorage.getItem('gc_token');
  const res = await fetch(`http://localhost:3000/api/reports/weekly/excel?week_start=${weekStart}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to download');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `bengaluru-snooker-club-weekly-${weekStart}.xlsx`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Monthly ──────────────────────────────────────────────────────────────────

export async function getMonthlyReport(month: string): Promise<ReportData> {
  const res = await client.get('/reports/monthly', { params: { month } });
  const d: MonthlyReport = res.data.data;
  return {
    period_label: new Date(d.from + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    summary: d.summary,
    table_breakdown: d.table_breakdown,
    top_items: d.top_items,
    sessions: d.sessions,
  };
}

export async function downloadMonthlyExcel(month: string): Promise<void> {
  const token = localStorage.getItem('gc_token');
  const res = await fetch(`http://localhost:3000/api/reports/monthly/excel?month=${month}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to download');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `bengaluru-snooker-club-monthly-${month}.xlsx`; a.click();
  URL.revokeObjectURL(url);
}
