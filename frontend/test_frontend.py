import sys
import os
import time
import urllib.request
import threading

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from main import run_server

def test_frontend_delivery():
    print("Testing Frontend Web Server delivery...", flush=True)

    # Start server in background thread
    server_thread = threading.Thread(target=run_server, kwargs={"port": 8080}, daemon=True)
    server_thread.start()
    
    base_url = "http://localhost:8080"

    # Wait for server to finish preloading and bind port
    connected = False
    for i in range(30):
        try:
            res = urllib.request.urlopen(f"{base_url}/", timeout=3)
            if res.status == 200:
                connected = True
                break
        except Exception:
            time.sleep(1)

    assert connected, "Server failed to start within timeout"

    # 1. Test index.html
    res = urllib.request.urlopen(f"{base_url}/").read()
    html_content = res.decode("utf-8")
    print(f"[OK] index.html loaded: {len(html_content)} bytes", flush=True)
    assert "<title>Dashboard Monitoring DOI Bulanan" in html_content

    # 2. Test index.css
    res = urllib.request.urlopen(f"{base_url}/index.css").read()
    css_content = res.decode("utf-8")
    print(f"[OK] index.css loaded: {len(css_content)} bytes", flush=True)
    assert "--bg-primary" in css_content

    # 3. Test src/app.js
    res = urllib.request.urlopen(f"{base_url}/src/app.js").read()
    js_content = res.decode("utf-8")
    print(f"[OK] src/app.js loaded: {len(js_content)} bytes", flush=True)
    assert "class DashboardApp" in js_content

    # 4. Test src/api.js
    res = urllib.request.urlopen(f"{base_url}/src/api.js").read()
    api_js_content = res.decode("utf-8")
    print(f"[OK] src/api.js loaded: {len(api_js_content)} bytes", flush=True)
    assert "fetchMetadata" in api_js_content

    # 5. Test Logo files delivery
    res = urllib.request.urlopen(f"{base_url}/assets/Konimex.jpeg").read()
    print(f"[OK] assets/Konimex.jpeg loaded: {len(res)} bytes", flush=True)
    assert len(res) > 0

    res = urllib.request.urlopen(f"{base_url}/assets/MNJ.jpeg").read()
    print(f"[OK] assets/MNJ.jpeg loaded: {len(res)} bytes", flush=True)
    assert len(res) > 0

    print("\nALL FRONTEND ASSETS & LOGOS TESTED AND SERVED PERFECTLY!", flush=True)

if __name__ == "__main__":
    test_frontend_delivery()
    os._exit(0)
