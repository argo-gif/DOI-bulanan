import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from etl import DataEngine

def test_data_engine():
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Testing DataEngine in: {workspace_dir}")
    
    engine = DataEngine(base_dir=workspace_dir)
    
    # 1. Master Data
    master = engine.load_master_data()
    print(f"[OK] Master products loaded: {len(master)} items")
    assert len(master) > 0, "Master data should not be empty!"

    # 2. Preload all datasets (uses disk cache if available)
    engine.preload_all_data()
    periods = engine.get_available_periods()
    print(f"[OK] Preload completed: {len(periods)} periods available ({periods})")
    assert len(periods) > 0, "Available periods should not be empty!"

    # 3. Sales Data
    sales = engine.load_sales(target_period=periods[0], avg_months=1)
    print(f"[OK] Sales data loaded: {len(sales)} products mapped")

    # 4. DOI Consolidated Report
    report = engine.get_doi_mnj_report(period=periods[0], avg_months=1)
    print(f"[OK] Full DOI report generated: {len(report)} records")
    
    # Display sample records
    print("\n--- SAMPLE DOI RECORD 1 ---")
    print(report[0])
    
    print("\n--- SAMPLE DOI RECORD 2 ---")
    print(report[1] if len(report) > 1 else "None")

    # Check health matrix counts
    under = sum(1 for r in report if r["health_status_total"] == "Understock")
    normal = sum(1 for r in report if r["health_status_total"] == "Normal")
    over = sum(1 for r in report if r["health_status_total"] == "Overstock")
    
    print("\n--- HEALTH STATUS SUMMARY (TOTAL) ---")
    print(f"[UNDERSTOCK] (<30 Days): {under}")
    print(f"[NORMAL] (30-90 Days): {normal}")
    print(f"[OVERSTOCK] (>90 Days): {over}")

if __name__ == "__main__":
    test_data_engine()
