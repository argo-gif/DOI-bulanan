"""
ETL Pipeline & Metric Calculator Engine for DOI MNJ Dashboard (Group Business & Trend Analytics)
Supports period selection, GB aggregation summary, lookback sales window, and historical DOI trends.
"""

import os
import openpyxl
import datetime
from typing import Dict, List, Any, Optional, Set

def parse_year_month(val: Any) -> Optional[str]:
    """Converts datetime or date string into YYYY-MM string."""
    if not val:
        return None
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime("%Y-%m")
    val_str = str(val).strip()
    if len(val_str) >= 7 and val_str[0:4].isdigit() and val_str[5:7].isdigit():
        return val_str[0:7]
    return None

class DataEngine:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.master_file = os.path.join(base_dir, "Master produk.xlsx")
        self.mnj_file = os.path.join(base_dir, "Stok Akhir bulan MNJ.xlsx")
        self.sales_file = os.path.join(base_dir, "Data sales.xlsx")

        self.master_products: Dict[str, Dict[str, Any]] = {}
        self.old_code_map: Dict[str, str] = {}
        self.principal_code_map: Dict[str, str] = {}
        self.available_periods: List[str] = []

        self._is_preloaded = False
        self._mnj_cache: Dict[str, Dict[str, Dict[str, float]]] = {}  # {period: {pcode: {baik, bdp, total}}}
        self._sales_cache: Dict[str, Dict[str, float]] = {}          # {month: {pcode: qty}}

    def load_master_data(self) -> Dict[str, Dict[str, Any]]:
        """Reads Master produk.xlsx and builds lookup tables."""
        if self.master_products:
            return self.master_products

        if not os.path.exists(self.master_file):
            raise FileNotFoundError(f"Master file not found: {self.master_file}")

        wb = openpyxl.load_workbook(self.master_file, read_only=True, data_only=True)
        sheet = wb.active

        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not row or len(row) < 8 or not row[1]:
                continue

            principal_code = str(row[0]).strip() if row[0] is not None else ""
            product_code = str(row[1]).strip()
            old_code = str(row[2]).strip() if row[2] is not None else ""
            product_name = str(row[3]).strip() if row[3] is not None else ""
            gb = str(row[4]).strip() if row[4] is not None else ""
            try:
                harga_dasar = float(row[5]) if row[5] is not None else 0.0
            except (ValueError, TypeError):
                harga_dasar = 0.0
            kategori = str(row[6]).strip() if row[6] is not None else ""
            keterangan = str(row[7]).strip() if row[7] is not None else "Regular"
            if not keterangan:
                keterangan = "Regular"

            product_info = {
                "principal_code": principal_code,
                "product_code": product_code,
                "old_code": old_code,
                "product_name": product_name,
                "gb": gb if gb else "Unassigned",
                "harga_dasar": harga_dasar,
                "kategori": kategori,
                "keterangan": keterangan
            }

            self.master_products[product_code] = product_info
            
            if old_code:
                self.old_code_map[old_code] = product_code
            if principal_code:
                self.principal_code_map[principal_code] = product_code

        wb.close()
        return self.master_products

    def resolve_product_code(self, raw_code: str) -> Optional[str]:
        """Resolves raw/old code to primary Product_code."""
        code = raw_code.strip()
        if code in self.master_products:
            return code
        if code in self.old_code_map:
            return self.old_code_map[code]
        if code in self.principal_code_map:
            return self.principal_code_map[code]
        return None

    def preload_all_data(self):
        """Preloads MNJ stock and Sales datasets into memory."""
        if self._is_preloaded:
            return

        print("[ENGINE] Preloading MNJ datasets into memory...")
        self.load_master_data()

        # 1. Preload MNJ Stock
        if os.path.exists(self.mnj_file):
            wb = openpyxl.load_workbook(self.mnj_file, read_only=True, data_only=True)
            sheet = wb.active
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not row or len(row) < 10 or not row[3]:
                    continue
                period = parse_year_month(row[9])
                if not period:
                    continue
                target_code = self.resolve_product_code(str(row[3]))
                if not target_code:
                    continue

                qty_baik = float(row[6]) if row[6] is not None else 0.0
                qty_bdp = float(row[8]) if row[8] is not None else 0.0

                if period not in self._mnj_cache:
                    self._mnj_cache[period] = {}
                if target_code not in self._mnj_cache[period]:
                    self._mnj_cache[period][target_code] = {"baik": 0.0, "bdp": 0.0, "total": 0.0}

                self._mnj_cache[period][target_code]["baik"] += qty_baik
                self._mnj_cache[period][target_code]["bdp"] += qty_bdp
                self._mnj_cache[period][target_code]["total"] += (qty_baik + qty_bdp)
            wb.close()

        # 2. Preload Sales Data
        if os.path.exists(self.sales_file):
            wb = openpyxl.load_workbook(self.sales_file, read_only=True, data_only=True)
            sheet = wb.active
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not row or len(row) < 10 or not row[7]:
                    continue
                month = parse_year_month(row[0])
                if not month:
                    continue
                target_code = self.resolve_product_code(str(row[7]))
                if not target_code:
                    continue

                qty = float(row[9]) if row[9] is not None else 0.0
                if month not in self._sales_cache:
                    self._sales_cache[month] = {}
                self._sales_cache[month][target_code] = self._sales_cache[month].get(target_code, 0.0) + qty
            wb.close()

        self.available_periods = sorted(list(self._mnj_cache.keys()), reverse=True)
        self._is_preloaded = True
        print(f"[ENGINE] Preload complete! {len(self.master_products)} products, {len(self.available_periods)} periods.")

    def get_available_periods(self) -> List[str]:
        if not self._is_preloaded:
            self.preload_all_data()
        return self.available_periods

    def get_keterangan_options(self) -> List[str]:
        if not self._is_preloaded:
            self.preload_all_data()
        kets = {p["keterangan"] for p in self.master_products.values() if p.get("keterangan")}
        return sorted(list(kets))

    def get_period_months_window(self, target_period: str, avg_months: int) -> List[str]:
        try:
            year, month = int(target_period[0:4]), int(target_period[5:7])
        except (ValueError, IndexError):
            return [target_period]

        window = []
        cur_y, cur_m = year, month
        for _ in range(avg_months):
            window.append(f"{cur_y:04d}-{cur_m:02d}")
            cur_m -= 1
            if cur_m < 1:
                cur_m = 12
                cur_y -= 1
        return window

    def load_sales(self, target_period: Optional[str] = None, avg_months: int = 1) -> Dict[str, float]:
        if not self._is_preloaded:
            self.preload_all_data()
        if not target_period:
            target_period = self.available_periods[0] if self.available_periods else "2026-07"

        window = self.get_period_months_window(target_period, avg_months)
        sales_sum: Dict[str, float] = {}

        for m in window:
            m_sales = self._sales_cache.get(m, {})
            for code, qty in m_sales.items():
                sales_sum[code] = sales_sum.get(code, 0.0) + qty

        months_count = max(1, avg_months)
        avg_sales: Dict[str, float] = {}
        for code, total_qty in sales_sum.items():
            avg_sales[code] = total_qty / months_count

        return avg_sales

    def get_doi_mnj_report(self, period: Optional[str] = None, avg_months: int = 1) -> List[Dict[str, Any]]:
        if not self._is_preloaded:
            self.preload_all_data()

        periods = self.get_available_periods()
        selected_period = period if period and period in periods else (periods[0] if periods else "2026-07")

        mnj_data = self._mnj_cache.get(selected_period, {})
        avg_sales_dict = self.load_sales(target_period=selected_period, avg_months=avg_months)

        report = []

        for pcode, pinfo in self.master_products.items():
            stok_info = mnj_data.get(pcode, {"baik": 0.0, "bdp": 0.0, "total": 0.0})
            qty_baik = stok_info["baik"]
            qty_bdp = stok_info["bdp"]
            stok_mnj_qty = stok_info["total"]

            harga_dasar = pinfo["harga_dasar"]
            stok_mnj_value = stok_mnj_qty * harga_dasar

            avg_sales_qty = avg_sales_dict.get(pcode, 0.0)
            avg_sales_value = avg_sales_qty * harga_dasar

            if avg_sales_qty > 0:
                doi_mnj = (stok_mnj_qty / avg_sales_qty) * 30.0
            else:
                doi_mnj = 999.0 if stok_mnj_qty > 0 else 0.0

            if doi_mnj < 30.0:
                health_status = "Understock"
            elif doi_mnj <= 90.0:
                health_status = "Normal"
            else:
                health_status = "Overstock"

            report.append({
                "period": selected_period,
                "product_code": pcode,
                "principal_product_code": pinfo["principal_code"],
                "product_name": pinfo["product_name"],
                "gb": pinfo["gb"],
                "category": pinfo["kategori"],
                "keterangan_produk": pinfo["keterangan"],
                "harga_dasar": harga_dasar,

                "qty_baik": qty_baik,
                "qty_bdp": qty_bdp,
                "stok_mnj_qty": stok_mnj_qty,
                "stok_mnj_value": stok_mnj_value,

                "avg_sales_qty": avg_sales_qty,
                "avg_sales_value": avg_sales_value,
                "doi_mnj_days": round(doi_mnj, 1),
                "health_status_mnj": health_status
            })

        return report

    def get_gb_summary_report(self, period: Optional[str] = None, avg_months: int = 1, keterangan: str = "All", unit: str = "qty") -> List[Dict[str, Any]]:
        """Calculates aggregated DOI metrics grouped per GB and Total Consolidated with exact unit precision."""
        report = self.get_doi_mnj_report(period=period, avg_months=avg_months)
        
        gb_map: Dict[str, Dict[str, Any]] = {}

        for r in report:
            if keterangan != "All" and r["keterangan_produk"] != keterangan:
                continue

            gb_name = r["gb"] or "Unassigned"
            if gb_name not in gb_map:
                gb_map[gb_name] = {
                    "gb": gb_name,
                    "total_sku": 0,
                    "stok_mnj_qty": 0.0,
                    "stok_mnj_value": 0.0,
                    "avg_sales_qty": 0.0,
                    "avg_sales_value": 0.0,
                    "understock_count": 0,
                    "normal_count": 0,
                    "overstock_count": 0
                }

            gb_map[gb_name]["total_sku"] += 1
            gb_map[gb_name]["stok_mnj_qty"] += r["stok_mnj_qty"]
            gb_map[gb_name]["stok_mnj_value"] += r["stok_mnj_value"]
            gb_map[gb_name]["avg_sales_qty"] += r["avg_sales_qty"]
            gb_map[gb_name]["avg_sales_value"] += r["avg_sales_value"]

            status = r["health_status_mnj"]
            if status == "Understock":
                gb_map[gb_name]["understock_count"] += 1
            elif status == "Normal":
                gb_map[gb_name]["normal_count"] += 1
            elif status == "Overstock":
                gb_map[gb_name]["overstock_count"] += 1

        summary_list = []
        is_value_mode = (unit.lower() == "value")

        for gb_name, d in sorted(gb_map.items()):
            if is_value_mode:
                stok = d["stok_mnj_value"]
                sales = d["avg_sales_value"]
            else:
                stok = d["stok_mnj_qty"]
                sales = d["avg_sales_qty"]

            doi = (stok / sales * 30.0) if sales > 0 else (999.0 if stok > 0 else 0.0)
            
            if doi < 30.0:
                h_status = "Understock"
            elif doi <= 90.0:
                h_status = "Normal"
            else:
                h_status = "Overstock"

            d["doi_mnj_days"] = round(doi, 1)
            d["health_status_mnj"] = h_status
            d["stok_mnj_value"] = round(d["stok_mnj_value"], 2)
            d["avg_sales_value"] = round(d["avg_sales_value"], 2)
            summary_list.append(d)

        return summary_list

    def get_historical_doi_trend(self, gb: str = "All", keterangan: str = "All", avg_months: int = 1, unit: str = "qty") -> List[Dict[str, Any]]:
        """Calculates DOI trend over all available periods for selected filters and unit mode."""
        periods = sorted(self.get_available_periods())
        month_names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        is_value_mode = (unit.lower() == "value")

        trend = []
        for p in periods:
            report = self.get_doi_mnj_report(period=p, avg_months=avg_months)
            
            tot_stok_qty = 0.0
            tot_stok_val = 0.0
            tot_sales_qty = 0.0
            tot_sales_val = 0.0
            sku_cnt = 0

            for r in report:
                if gb != "All" and r["gb"] != gb:
                    continue
                if keterangan != "All" and r["keterangan_produk"] != keterangan:
                    continue

                sku_cnt += 1
                tot_stok_qty += r["stok_mnj_qty"]
                tot_stok_val += r["stok_mnj_value"]
                tot_sales_qty += r["avg_sales_qty"]
                tot_sales_val += r["avg_sales_value"]

            if is_value_mode:
                stok = tot_stok_val
                sales = tot_sales_val
            else:
                stok = tot_stok_qty
                sales = tot_sales_qty

            doi = (stok / sales * 30.0) if sales > 0 else (999.0 if stok > 0 else 0.0)

            parts = p.split("-")
            month_idx = int(parts[1]) - 1
            m_label = month_names[month_idx] if 0 <= month_idx < 12 else parts[1]
            p_label = f"{m_label} {parts[0]}"

            trend.append({
                "period": p,
                "period_label": p_label,
                "total_sku": sku_cnt,
                "stok_mnj_qty": tot_stok_qty,
                "stok_mnj_value": round(tot_stok_val, 2),
                "avg_sales_qty": tot_sales_qty,
                "avg_sales_value": round(tot_sales_val, 2),
                "doi_mnj_days": round(doi, 1)
            })

        return trend
