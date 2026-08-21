"""
Backend REST API Server for DOI MNJ Monitoring Dashboard
Includes Multi-Select GB and Multi-Select Keterangan Produk filters with instant port listening.
"""

import sys
import os
import json
import csv
import io
import mimetypes
import threading
from urllib.parse import parse_qs, urlparse
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from etl import DataEngine, parse_multi_param

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

data_engine = DataEngine(base_dir=BASE_DIR)

class DOIRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def serve_file(self, full_path: str):
        full_path = os.path.normpath(full_path)
        if os.path.isfile(full_path):
            content_type, _ = mimetypes.guess_type(full_path)
            if not content_type:
                if full_path.endswith(".js"):
                    content_type = "application/javascript"
                elif full_path.endswith(".css"):
                    content_type = "text/css"
                elif full_path.endswith(".html"):
                    content_type = "text/html"
                else:
                    content_type = "application/octet-stream"

            if content_type.startswith("text/") or content_type == "application/javascript":
                content_type += "; charset=utf-8"

            self._set_headers(200, content_type=content_type)
            with open(full_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"File not found: {full_path}"}).encode("utf-8"))

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)

        def get_param(name: str, default: str) -> str:
            return query_params.get(name, [default])[0]

        try:
            if path == "/health":
                self._set_headers(200)
                res = {"status": "online", "version": "1.0.0", "app": "DOI MNJ Monitoring API"}
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/v1/metadata":
                self.handle_metadata()

            elif path == "/api/v1/summary":
                self.handle_summary(get_param)

            elif path == "/api/v1/gb-summary":
                self.handle_gb_summary(get_param)

            elif path == "/api/v1/doi-trend":
                self.handle_doi_trend(get_param)

            elif path == "/api/v1/doi-data":
                self.handle_doi_data(get_param)

            elif path == "/api/v1/export":
                self.handle_export(get_param)

            else:
                rel_path = path.lstrip("/")
                if not rel_path or rel_path == "index.html":
                    target_file = os.path.join(FRONTEND_DIR, "index.html")
                else:
                    target_file = os.path.join(FRONTEND_DIR, rel_path)

                if os.path.isfile(target_file):
                    self.serve_file(target_file)
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": f"Endpoint or file not found: {path}"}).encode("utf-8"))

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_metadata(self):
        master = data_engine.load_master_data()
        periods = data_engine.get_available_periods()
        gbs = sorted(list({p["gb"] for p in master.values() if p["gb"]}))
        keterangan_opts = data_engine.get_keterangan_options()

        res = {
            "periods": periods,
            "gb_options": gbs,
            "keterangan_options": keterangan_opts,
            "avg_months_options": [1, 3, 6, 12],
            "total_products": len(master)
        }
        self._set_headers(200)
        self.wfile.write(json.dumps(res).encode("utf-8"))

    def get_filtered_data(self, get_param):
        period = get_param("period", "")
        avg_months = int(get_param("avg_months", "1"))
        
        report = data_engine.get_doi_mnj_report(period=period if period else None, avg_months=avg_months)

        gb_raw = get_param("gb", "All")
        gb_set = parse_multi_param(gb_raw)

        ket_raw = get_param("keterangan", "All")
        ket_set = parse_multi_param(ket_raw)

        health_status = get_param("health_status", "All")
        search = get_param("search", "").strip().lower()

        filtered = []
        for r in report:
            if gb_set and r["gb"] not in gb_set:
                continue

            if ket_set and r["keterangan_produk"] not in ket_set:
                continue

            if health_status != "All" and r["health_status_mnj"] != health_status:
                continue

            if search:
                code_match = search in r["product_code"].lower()
                pcode_match = search in r["principal_product_code"].lower()
                name_match = search in r["product_name"].lower()
                if not (code_match or pcode_match or name_match):
                    continue

            filtered.append(r)

        return filtered

    def handle_summary(self, get_param):
        filtered = self.get_filtered_data(get_param)
        unit = get_param("unit", "qty").lower()

        under = 0
        normal = 0
        over = 0
        total_stok_val = 0.0
        total_avg_sales_val = 0.0

        for r in filtered:
            status = r["health_status_mnj"]
            if status == "Understock":
                under += 1
            elif status == "Normal":
                normal += 1
            elif status == "Overstock":
                over += 1

            total_stok_val += r["stok_mnj_value"]
            total_avg_sales_val += r["avg_sales_value"]

        period_active = filtered[0]["period"] if filtered else get_param("period", "2026-07")

        res = {
            "period": period_active,
            "unit": unit,
            "total_sku": len(filtered),
            "understock_count": under,
            "normal_count": normal,
            "overstock_count": over,
            "total_stok_value": round(total_stok_val, 2),
            "total_avg_sales_value": round(total_avg_sales_val, 2)
        }
        self._set_headers(200)
        self.wfile.write(json.dumps(res).encode("utf-8"))

    def handle_gb_summary(self, get_param):
        period = get_param("period", "")
        avg_months = int(get_param("avg_months", "1"))
        keterangan = get_param("keterangan", "All")
        unit = get_param("unit", "qty")

        gb_summary = data_engine.get_gb_summary_report(
            period=period if period else None,
            avg_months=avg_months,
            keterangan=keterangan,
            unit=unit
        )

        self._set_headers(200)
        self.wfile.write(json.dumps(gb_summary).encode("utf-8"))

    def handle_doi_trend(self, get_param):
        gb = get_param("gb", "All")
        keterangan = get_param("keterangan", "All")
        avg_months = int(get_param("avg_months", "1"))
        unit = get_param("unit", "qty")

        trend_data = data_engine.get_historical_doi_trend(
            gb=gb,
            keterangan=keterangan,
            avg_months=avg_months,
            unit=unit
        )

        self._set_headers(200)
        self.wfile.write(json.dumps(trend_data).encode("utf-8"))

    def handle_doi_data(self, get_param):
        filtered = self.get_filtered_data(get_param)
        page = int(get_param("page", "1"))
        page_size = int(get_param("page_size", "50"))

        total_records = len(filtered)
        total_pages = max(1, (total_records + page_size - 1) // page_size)
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = filtered[start_idx:end_idx]

        res = {
            "total_records": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "data": page_data
        }
        self._set_headers(200)
        self.wfile.write(json.dumps(res).encode("utf-8"))

    def handle_export(self, get_param):
        filtered = self.get_filtered_data(get_param)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow([
            "Periode", "Product Code", "Principal Product Code", "Product Name", "GB", "Keterangan Produk",
            "Harga Dasar (IDR)", "Qty Stok Baik", "Qty BDP", "Total Stok MNJ Qty",
            "Stok MNJ Value (IDR)", "Avg Sales Qty", "Avg Sales Value (IDR)",
            "DOI MNJ (Hari)", "Status Health MNJ"
        ])

        for r in filtered:
            writer.writerow([
                r["period"], r["product_code"], r["principal_product_code"], r["product_name"],
                r["gb"], r["keterangan_produk"], r["harga_dasar"], r["qty_baik"],
                r["qty_bdp"], r["stok_mnj_qty"], r["stok_mnj_value"], r["avg_sales_qty"],
                r["avg_sales_value"], r["doi_mnj_days"], r["health_status_mnj"]
            ])

        csv_content = output.getvalue()
        
        self.send_response(200)
        self.send_header("Content-Type", "text/csv")
        self.send_header("Content-Disposition", "attachment; filename=doi_mnj_report.csv")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(csv_content.encode("utf-8"))

def run_server(port=8000):
    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, DOIRequestHandler)
    print(f"[SERVER] DOI MNJ Monitoring API Server running on http://localhost:{port}")

    preload_thread = threading.Thread(target=data_engine.preload_all_data, daemon=True)
    preload_thread.start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    run_server(port=port)
