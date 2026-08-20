export interface DOIRecord {
  period: string;
  product_code: string;
  principal_product_code: string;
  product_name: string;
  gb: string;
  category: string;
  harga_dasar: number;
  
  stok_mnj_qty: number;
  stok_kx_qty: number;
  total_stok_qty: number;
  avg_sales_qty: number;

  stok_mnj_value: number;
  stok_kx_value: number;
  total_stok_value: number;
  avg_sales_value: number;

  doi_mnj_days: number;
  doi_kx_days: number;
  doi_total_days: number;

  health_status_mnj: 'Understock' | 'Normal' | 'Overstock';
  health_status_kx: 'Understock' | 'Normal' | 'Overstock';
  health_status_total: 'Understock' | 'Normal' | 'Overstock';
}

export interface MetadataResponse {
  periods: string[];
  gb_options: string[];
  categories: string[];
  avg_months_options: number[];
  total_products: number;
}

export interface SummaryResponse {
  period: string;
  view: 'mnj' | 'kx' | 'total';
  unit: 'qty' | 'value';
  total_sku: number;
  understock_count: number;
  normal_count: number;
  overstock_count: number;
  total_stok_value: number;
  total_avg_sales_value: number;
}

export interface DOIResponse {
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: DOIRecord[];
}

export interface FilterState {
  period: string;
  view: 'total' | 'mnj' | 'kx';
  unit: 'qty' | 'value';
  gb: string;
  category: string;
  health_status: string;
  search: string;
  avg_months: number;
  page: number;
  page_size: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}
