import io
import os
from typing import Dict, Any, List
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION

def format_curr_or_qty(num: float, is_value: bool, is_compact: bool = True) -> str:
    if num is None or num != num:
        return "Rp 0" if is_value else "0"
    
    if is_compact:
        abs_num = abs(num)
        if abs_num >= 1e9:
            val = num / 1e9
            return f"Rp {val:.2f} Miliar" if is_value else f"{val:.2f} M Unit"
        if abs_num >= 1e6:
            val = num / 1e6
            return f"Rp {val:.2f} Juta" if is_value else f"{val:.2f} Jt Unit"
        if abs_num >= 1e3:
            val = num / 1e3
            return f"Rp {val:.1f} Ribu" if is_value else f"{val:.1f} Rb Unit"
            
    if is_value:
        return f"Rp {num:,.0f}".replace(",", ".")
    return f"{num:,.0f}".replace(",", ".")

def format_period_label(period_str: str) -> str:
    if not period_str:
        return ""
    months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    parts = period_str.split("-")
    if len(parts) == 2:
        try:
            m_idx = int(parts[1]) - 1
            if 0 <= m_idx < 12:
                return f"{months[m_idx]} {parts[0]}"
        except ValueError:
            pass
    return period_str

def style_cell(cell, text: str, font_size: int = 10, bold: bool = False, color: RGBColor = RGBColor(255, 255, 255), align: PP_ALIGN = PP_ALIGN.LEFT, bg_color: RGBColor = None):
    cell.text = str(text)
    if bg_color:
        cell.fill.solid()
        cell.fill.fore_color.rgb = bg_color
    p = cell.text_frame.paragraphs[0]
    p.alignment = align
    for run in p.runs:
        run.font.name = "Segoe UI"
        run.font.size = Pt(font_size)
        run.font.bold = bold
        run.font.color.rgb = color

def set_slide_title(slide, title_text: str):
    """Sets the title in the template's title placeholder if present, or creates one if missing."""
    title_shape = None
    for shape in slide.shapes:
        if shape.is_placeholder and shape.placeholder_format.type in [1, 3]:  # TITLE or CENTER_TITLE
            title_shape = shape
            break
        elif shape.name and "Title" in shape.name:
            title_shape = shape
            break
            
    if title_shape and title_shape.has_text_frame:
        tf = title_shape.text_frame
        tf.word_wrap = True
        tf.text = ""
        p = tf.paragraphs[0]
        p.text = title_text
        p.alignment = PP_ALIGN.LEFT
        for run in p.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(18)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0, 242, 254)
    else:
        tbox = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.8))
        tf = tbox.text_frame
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Segoe UI"
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = RGBColor(0, 242, 254)

def generate_doi_ppt(data_engine, filters: Dict[str, Any], template_path: str = "Template PPT.pptx") -> io.BytesIO:
    """Generates a PowerPoint presentation using Template PPT.pptx based on active dashboard filters and data."""
    if not os.path.exists(template_path):
        prs = Presentation()
    else:
        prs = Presentation(template_path)

    period = filters.get("period", "2026-07")
    unit = filters.get("unit", "value").lower()
    is_value = (unit == "value")
    avg_months = int(filters.get("avg_months", "6"))
    health_status = filters.get("health_status", "All")
    gb = filters.get("gb", "All")
    keterangan = filters.get("keterangan", "All")
    products = filters.get("products", "All")

    period_label = format_period_label(period)

    # Fetch Data from ETL engine
    summary = data_engine.get_doi_mnj_report(period=period, avg_months=avg_months)
    gb_summary = data_engine.get_gb_summary_report(period=period, avg_months=avg_months, keterangan=keterangan, unit=unit, products=products, health_status=health_status)
    doi_trend = data_engine.get_historical_doi_trend(gb=gb, keterangan=keterangan, avg_months=avg_months, unit=unit, products=products, health_status=health_status, until_period=period)

    # Filtered full report
    full_filtered = [r for r in summary if (gb == "All" or r["gb"] == gb) and (keterangan == "All" or r["keterangan_produk"] == keterangan)]

    # Calculate status scorecard counts
    total_sku = len(full_filtered)
    under_cnt = sum(1 for r in full_filtered if r["health_status_total"] == "Understock")
    norm_cnt = sum(1 for r in full_filtered if r["health_status_total"] == "Normal")
    over_cnt = sum(1 for r in full_filtered if r["health_status_total"] == "Overstock")

    # --- SLIDE 1: COVER (Populate Template Title & Subtitle Placeholders inside Red Box) ---
    slide_1 = prs.slides[0]

    title_ph = None
    sub_ph = None
    for shape in slide_1.shapes:
        if shape.is_placeholder:
            if shape.placeholder_format.type == 3:  # CENTER_TITLE
                title_ph = shape
            elif shape.placeholder_format.type == 4:  # SUBTITLE
                sub_ph = shape

    if title_ph and title_ph.has_text_frame:
        tf1 = title_ph.text_frame
        tf1.word_wrap = True
        tf1.text = ""
        p0 = tf1.paragraphs[0]
        p0.text = "LAPORAN MONITORING & EVALUASI DOI PERSEDIAAN"
        p0.alignment = PP_ALIGN.CENTER
        for run in p0.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(18)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

    if sub_ph and sub_ph.has_text_frame:
        sub_ph.left = Inches(5.2)
        sub_ph.top = Inches(3.3)
        sub_ph.width = Inches(4.3)
        sub_ph.height = Inches(1.2)

        tf_sub = sub_ph.text_frame
        tf_sub.word_wrap = True
        tf_sub.text = ""

        p1 = tf_sub.paragraphs[0]
        p1.text = f"Distributor MNJ & Principal Konimex (KX)\nPeriode: {period_label}"
        p1.alignment = PP_ALIGN.CENTER
        for run in p1.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(12)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

        p2 = tf_sub.add_paragraph()
        p2.text = f"Mode: {'Valuasi (IDR)' if is_value else 'Kuantitas (Unit)'} | GB: {gb} | Status: {health_status}"
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(4)
        for run in p2.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(254, 243, 199)

    # --- SLIDE 2: DASHBOARD MAIN SUMMARY (4 STATUS CARDS + 3-LINE TREND CHART) ---
    slide_2 = prs.slides[1] if len(prs.slides) > 1 else prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_title(slide_2, f"🎯 Evaluasi Stok & Trend Pergerakan DOI (Januari 2026 – {period_label})")

    # 4 Status Cards Grid
    cards_data = [
        {"title": "Semua Status", "count": f"{total_sku} SKU", "sub": "Total SKU Terdaftar", "color": RGBColor(0, 242, 254), "left": Inches(0.6)},
        {"title": "🔴 Understock", "count": f"{under_cnt} SKU", "sub": "< 45 Hari DOI", "color": RGBColor(248, 113, 113), "left": Inches(3.6)},
        {"title": "🟢 Normal", "count": f"{norm_cnt} SKU", "sub": "45 Hari – DOI Max", "color": RGBColor(52, 211, 153), "left": Inches(6.6)},
        {"title": "🟡 Overstock", "count": f"{over_cnt} SKU", "sub": "> DOI Max Stok", "color": RGBColor(251, 191, 36), "left": Inches(9.6)},
    ]

    for card in cards_data:
        shape = slide_2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card["left"], Inches(1.15), Inches(2.7), Inches(1.25))
        shape.fill.solid()
        shape.fill.fore_color.rgb = RGBColor(15, 23, 42)
        shape.line.color.rgb = card["color"]
        shape.line.width = Pt(2)

        tf = shape.text_frame
        tf.word_wrap = True
        
        p0 = tf.paragraphs[0]
        p0.text = card["title"]
        p0.font.name = "Segoe UI"
        p0.font.size = Pt(11)
        p0.font.bold = True
        p0.font.color.rgb = card["color"]

        p1 = tf.add_paragraph()
        p1.text = card["count"]
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(18)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(255, 255, 255)
        p1.space_before = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = card["sub"]
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9)
        p2.font.color.rgb = RGBColor(148, 163, 184)

    # 3-Line Trend Chart Section (DOI Combined Total, DOI MNJ, DOI KX)
    chart_data = CategoryChartData()
    chart_data.categories = [tr["period_label"] for tr in doi_trend]

    # Add all 3 series simultaneously!
    chart_data.add_series('DOI Combined Total', [tr["doi_total_days"] for tr in doi_trend])
    chart_data.add_series('DOI MNJ (Distributor)', [tr["doi_mnj_days"] for tr in doi_trend])
    chart_data.add_series('DOI KX (Principal)', [tr["doi_kx_days"] for tr in doi_trend])

    chart_shape = slide_2.shapes.add_chart(
        XL_CHART_TYPE.LINE_MARKERS,
        Inches(0.6), Inches(2.6), Inches(11.7), Inches(4.5),
        chart_data
    )
    chart = chart_shape.chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.TOP
    chart.legend.include_in_layout = False
    chart.value_axis.has_major_gridlines = True

    # Color formatting for lines
    series_colors = [RGBColor(0, 242, 254), RGBColor(192, 132, 252), RGBColor(244, 114, 182)]
    for idx, series in enumerate(chart.series):
        series.format.line.color.rgb = series_colors[idx % len(series_colors)]
        series.format.line.width = Pt(3)
        series.has_data_labels = True

    # --- SLIDE 3: METRIK FINANSIAL & FISIK PERSEDIAAN ---
    slide_3 = prs.slides[2] if len(prs.slides) > 2 else prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_title(slide_3, f"📊 Detail Valuasi & Kuantitas Persediaan ({period_label})")

    tot_mnj_val = sum(r["stok_mnj_value"] for r in full_filtered)
    tot_kx_val = sum(r["stok_kx_value"] for r in full_filtered)
    tot_comb_val = sum(r["stok_total_value"] for r in full_filtered)
    tot_sales_val = sum(r["avg_sales_value"] for r in full_filtered)

    tot_mnj_qty = sum(r["stok_mnj_qty"] for r in full_filtered)
    tot_kx_qty = sum(r["stok_kx_qty"] for r in full_filtered)
    tot_comb_qty = sum(r["stok_total_qty"] for r in full_filtered)
    tot_sales_qty = sum(r["avg_sales_qty"] for r in full_filtered)

    doi_mnj_cons = (tot_mnj_val / tot_sales_val * 30.0) if tot_sales_val > 0 else 0
    doi_kx_cons = (tot_kx_val / tot_sales_val * 30.0) if tot_sales_val > 0 else 0
    doi_comb_cons = (tot_comb_val / tot_sales_val * 30.0) if tot_sales_val > 0 else 0

    table_shape3 = slide_3.shapes.add_table(5, 4, Inches(0.8), Inches(1.5), Inches(11.5), Inches(4.5))
    table3 = table_shape3.table

    headers_s3 = ["Metrik Indikator Persediaan", "Distributor MNJ", "Principal KX", "Total Combined Konsolidasi"]
    for col_idx, h_text in enumerate(headers_s3):
        style_cell(table3.cell(0, col_idx), h_text, font_size=11, bold=True, color=RGBColor(255, 255, 255), align=PP_ALIGN.CENTER, bg_color=RGBColor(15, 23, 42))

    row1 = ["Valuasi Stok Persediaan", format_curr_or_qty(tot_mnj_val, True), format_curr_or_qty(tot_kx_val, True), format_curr_or_qty(tot_comb_val, True)]
    row2 = ["Kuantitas Stok Persediaan", format_curr_or_qty(tot_mnj_qty, False), format_curr_or_qty(tot_kx_qty, False), format_curr_or_qty(tot_comb_qty, False)]
    row3 = ["Realisasi DOI (Hari)", f"{doi_mnj_cons:.1f} Hari", f"{doi_kx_cons:.1f} Hari", f"{doi_comb_cons:.1f} Hari"]
    row4 = ["Avg Sales Bulanan", format_curr_or_qty(tot_sales_val, True), format_curr_or_qty(tot_sales_qty, False) + " Unit", format_curr_or_qty(tot_sales_val, True)]

    for r_idx, r_data in enumerate([row1, row2, row3, row4], start=1):
        bg = RGBColor(30, 41, 59) if r_idx % 2 == 1 else RGBColor(15, 23, 42)
        for c_idx, val_text in enumerate(r_data):
            align = PP_ALIGN.LEFT if c_idx == 0 else PP_ALIGN.RIGHT
            color = RGBColor(0, 242, 254) if c_idx == 3 else RGBColor(255, 255, 255)
            style_cell(table3.cell(r_idx, c_idx), val_text, font_size=10, bold=(c_idx == 0 or c_idx == 3), color=color, align=align, bg_color=bg)

    # --- SLIDE 4: RINGKASAN DOI PER GB & KONSOLIDASI ---
    slide_4 = prs.slides[3] if len(prs.slides) > 3 else prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_title(slide_4, f"🏢 Ringkasan DOI Per Group Business & Total Konsolidasi ({period_label})")

    num_rows = len(gb_summary) + 1
    table_shape4 = slide_4.shapes.add_table(num_rows + 1, 10, Inches(0.5), Inches(1.3), Inches(12.3), Inches(5.8))
    table4 = table_shape4.table

    gb_headers = ["GB", "SKU", "Stok Combined", "Avg Sales/Bln", "DOI Total", "DOI Max", "Selisih DOI", "Selisih Stok", "DOI Net", "Status"]
    for col_idx, h_text in enumerate(gb_headers):
        style_cell(table4.cell(0, col_idx), h_text, font_size=9, bold=True, color=RGBColor(255, 255, 255), align=PP_ALIGN.CENTER, bg_color=RGBColor(15, 23, 42))

    tot_sku_gbs = sum(g["total_sku"] for g in gb_summary)
    tot_stok_gbs = sum(g["stok_total_value" if is_value else "stok_total_qty"] for g in gb_summary)
    tot_sales_gbs = sum(g["avg_sales_value" if is_value else "avg_sales_qty"] for g in gb_summary)
    tot_max_gbs = sum(g["max_value_total" if is_value else "max_qty_total"] for g in gb_summary)
    tot_selisih_stok_gbs = sum(g["selisih_value" if is_value else "selisih_qty"] for g in gb_summary)

    for r_idx, g in enumerate(gb_summary, start=1):
        stok_val = g["stok_total_value" if is_value else "stok_total_qty"]
        sales_val = g["avg_sales_value" if is_value else "avg_sales_qty"]
        sel_stok = g["selisih_value" if is_value else "selisih_qty"]
        doi_tot = g["doi_total_days"]
        doi_max = g["doi_max_days"]
        sel_doi = g["selisih_doi_days"]
        doi_net = g["doi_after_selisih"]
        status = g["health_status_total"]

        row_vals = [
            g["gb"],
            str(g["total_sku"]),
            format_curr_or_qty(stok_val, is_value),
            format_curr_or_qty(sales_val, is_value),
            f"{doi_tot:.1f} d",
            f"{doi_max:.1f} d",
            f"+{sel_doi:.1f} d" if sel_doi > 0 else (f"{sel_doi:.1f} d" if sel_doi < 0 else "0.0 d"),
            f"+{format_curr_or_qty(sel_stok, is_value)}" if sel_stok > 0 else (format_curr_or_qty(sel_stok, is_value) if sel_stok < 0 else "0"),
            f"{doi_net:.1f} d",
            status
        ]

        bg = RGBColor(30, 41, 59) if r_idx % 2 == 1 else RGBColor(15, 23, 42)
        for c_idx, val_text in enumerate(row_vals):
            align = PP_ALIGN.LEFT if c_idx in [0, 9] else PP_ALIGN.RIGHT
            color = RGBColor(255, 255, 255)
            if c_idx == 4: color = RGBColor(0, 242, 254)
            elif c_idx == 5: color = RGBColor(167, 243, 208)
            elif c_idx in [6, 7]: color = RGBColor(251, 191, 36) if sel_stok > 0 else (RGBColor(248, 113, 113) if sel_stok < 0 else RGBColor(148, 163, 184))
            elif c_idx == 8: color = RGBColor(167, 243, 208)
            style_cell(table4.cell(r_idx, c_idx), val_text, font_size=8, bold=(c_idx == 0), color=color, align=align, bg_color=bg)

    # Consolidated Total Row
    doi_tot_cons = (tot_stok_gbs / tot_sales_gbs * 30.0) if tot_sales_gbs > 0 else 0
    doi_max_cons = (tot_max_gbs / tot_sales_gbs * 30.0) if tot_sales_gbs > 0 else 0
    sel_doi_cons = (tot_selisih_stok_gbs / tot_sales_gbs * 30.0) if tot_sales_gbs > 0 else 0
    doi_net_cons = doi_tot_cons - sel_doi_cons

    cons_row = [
        "TOTAL KONSOLIDASI",
        str(tot_sku_gbs),
        format_curr_or_qty(tot_stok_gbs, is_value),
        format_curr_or_qty(tot_sales_gbs, is_value),
        f"{doi_tot_cons:.1f} d",
        f"{doi_max_cons:.1f} d",
        f"+{sel_doi_cons:.1f} d" if sel_doi_cons > 0 else (f"{sel_doi_cons:.1f} d" if sel_doi_cons < 0 else "0.0 d"),
        f"+{format_curr_or_qty(tot_selisih_stok_gbs, is_value)}" if tot_selisih_stok_gbs > 0 else format_curr_or_qty(tot_selisih_stok_gbs, is_value),
        f"{doi_net_cons:.1f} d",
        "Overstock" if tot_stok_gbs > tot_max_gbs else "Normal"
    ]

    c_idx_last = num_rows
    for c_idx, val_text in enumerate(cons_row):
        align = PP_ALIGN.LEFT if c_idx in [0, 9] else PP_ALIGN.RIGHT
        style_cell(table4.cell(c_idx_last, c_idx), val_text, font_size=9, bold=True, color=RGBColor(0, 242, 254), align=align, bg_color=RGBColor(2, 132, 199))

    # Save to memory buffer
    buffer = io.BytesIO()
    prs.save(buffer)
    buffer.seek(0)
    return buffer
