import sys
import os
import time
import urllib.request
import threading

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from main import run_server

def test_frontend_delivery():
    print("Testing Frontend Web Server delivery...")

    # Start server in background thread
    server_thread = threading.Thread(target=run_server, kwargs={"port": 8080}, daemon=True)
    server_thread.start()
    
    time.sleep(2)

    base_url = "http://localhost:8080"

    # 1. Test index.html
    res = urllib.request.urlopen(f"{base_url}/").read()
    html_content = res.decode("utf-8")
    print(f"[OK] index.html loaded: {len(html_content)} bytes")
    assert "<title>Dashboard Monitoring DOI Bulanan (MNJ & KX)</title>" in html_content

    # 2. Test index.css
    res = urllib.request.urlopen(f"{base_url}/index.css").read()
    css_content = res.decode("utf-8")
    print(f"[OK] index.css loaded: {len(css_content)} bytes")
    assert "--bg-primary" in css_content

    # 3. Test src/app.js
    res = urllib.request.urlopen(f"{base_url}/src/app.js").read()
    js_content = res.decode("utf-8")
    print(f"[OK] src/app.js loaded: {len(js_content)} bytes")
    assert "class DashboardApp" in js_content

    # 4. Test src/api.js
    res = urllib.request.urlopen(f"{base_url}/src/api.js").read()
    api_js_content = res.decode("utf-8")
    print(f"[OK] src/api.js loaded: {len(api_js_content)} bytes")
    assert "fetchMetadata" in api_js_content

    print("\n🎉 ALL FRONTEND ASSETS TESTED AND SERVED PERFECTLY!")

if __name__ == "__main__":
    test_frontend_delivery()
