import sys
import os
import time
import urllib.request
import json
import threading

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import run_server

def test_api_endpoints():
    print("Testing REST API server...")

    # Start server in background thread
    server_thread = threading.Thread(target=run_server, kwargs={"port": 8000}, daemon=True)
    server_thread.start()
    
    # Allow server time to bind port
    time.sleep(2)

    base_url = "http://localhost:8000"

    # 1. Health Check
    res = urllib.request.urlopen(f"{base_url}/").read()
    data = json.loads(res.decode("utf-8"))
    print("[OK] Health Check endpoint:", data)
    assert data["status"] == "online"

    # 2. Metadata Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/metadata").read()
    data = json.loads(res.decode("utf-8"))
    print(f"[OK] Metadata endpoint loaded: {data['total_products']} products, {len(data['gb_options'])} GB options")
    assert data["total_products"] > 0

    # 3. Summary Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/summary?view=total&gb=All").read()
    data = json.loads(res.decode("utf-8"))
    print("[OK] Summary endpoint loaded:", data)
    assert "understock_count" in data

    # 4. DOI Data Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/doi-data?page=1&page_size=10").read()
    data = json.loads(res.decode("utf-8"))
    print(f"[OK] DOI Data endpoint loaded: {len(data['data'])} items on page 1 of {data['total_pages']}")
    assert len(data["data"]) == 10

    # 5. Export Endpoint
    res = urllib.request.urlopen(f"{base_url}/api/v1/export?gb=All").read()
    csv_str = res.decode("utf-8")
    lines = csv_str.strip().split("\n")
    print(f"[OK] Export CSV endpoint loaded: {len(lines)} CSV rows")
    assert len(lines) > 1

    print("\n🎉 ALL REST API ENDPOINTS TESTED AND WORKING PERFECTLY!")

if __name__ == "__main__":
    test_api_endpoints()
