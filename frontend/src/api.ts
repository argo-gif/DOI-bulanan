import { FilterState, MetadataResponse, SummaryResponse, DOIResponse } from './types';

const API_BASE = '/api/v1';

export async function fetchMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${API_BASE}/metadata`);
  if (!res.ok) throw new Error('Failed to fetch metadata');
  return res.json();
}

export async function fetchSummary(filters: FilterState): Promise<SummaryResponse> {
  const params = new URLSearchParams({
    period: filters.period || '',
    view: filters.view,
    unit: filters.unit,
    gb: filters.gb,
    category: filters.category,
    avg_months: filters.avg_months.toString()
  });

  const res = await fetch(`${API_BASE}/summary?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchDOIData(filters: FilterState): Promise<DOIResponse> {
  const params = new URLSearchParams({
    period: filters.period || '',
    view: filters.view,
    unit: filters.unit,
    gb: filters.gb,
    category: filters.category,
    health_status: filters.health_status,
    search: filters.search,
    avg_months: filters.avg_months.toString(),
    page: filters.page.toString(),
    page_size: filters.page_size.toString()
  });

  const res = await fetch(`${API_BASE}/doi-data?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch DOI data');
  return res.json();
}

export function getExportUrl(filters: FilterState): string {
  const params = new URLSearchParams({
    period: filters.period || '',
    view: filters.view,
    unit: filters.unit,
    gb: filters.gb,
    category: filters.category,
    health_status: filters.health_status,
    search: filters.search,
    avg_months: filters.avg_months.toString()
  });

  return `${API_BASE}/export?${params.toString()}`;
}
