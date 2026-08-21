import sys
import os
import time
import urllib.request
import json
import threading

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import run_server

def test_api_endpoints():
    print("Testing REST API server...", flush=True)

    # Start server in background thread
    server_thread = threading.Thread(target=run_server, kwargs={"port": 8000}, daemon=True)
    server_thread.start()
    
    base_url = "http://localhost:8000"

    # Wait for server to finish preloading and bind port
    connected = False
    for i in range(30):
        try:
            res = urllib.request.urlopen(f"{base_url}/health", timeout=3)
            if res.status == 200:
                connected = True
                break
        except Exception:
            time.sleep(1)

    assert connected, "API Server failed to start within timeout"

    # 1. Health Check
    res = urllib.request.urlopen(f"{base_url}/health").read()
    data = json.loads(res.decode("utf-8"))
    print("[OK] Health Check endpoint:", data, flush=True)
    assert data["status"] == "online"

    # 2. Metadata Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/metadata").read()
    data = json.loads(res.decode("utf-8"))
    print(f"[OK] Metadata endpoint loaded: {data['total_products']} products, {len(data['gb_options'])} GB options", flush=True)
    assert data["total_products"] > 0

    # 3. Summary Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/summary?view=total&gb=All").read()
    data = json.loads(res.decode("utf-8"))
    print("[OK] Summary endpoint loaded:", data, flush=True)
    assert "understock_count" in data

    # 4. DOI Data Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/doi-data?page=1&page_size=10").read()
    data = json.loads(res.decode("utf-8"))
    print(f"[OK] DOI Data endpoint loaded: {len(data['data'])} items on page 1 of {data['total_pages']}", flush=True)
    assert len(data["data"]) == 10

    # 5. Export Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/export?gb=All").read()
    csv_str = res.decode("utf-8")
    lines = csv_str.strip().split("\n")
    print(f"[OK] Export CSV endpoint loaded: {len(lines)} CSV rows", flush=True)
    assert len(lines) > 1

    print("\nALL REST API ENDPOINTS TESTED AND WORKING PERFECTLY!", flush=True)

if __name__ == "__main__":
    test_api_endpoints()
    os._exit(0)
