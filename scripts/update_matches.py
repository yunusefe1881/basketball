#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TBF Istanbul mac programlarini Google Drive'dan cekip data/matches.json uretir.

Kaynak: https://www.tbf.org.tr/istanbul/ -> "Istanbul Mac Programlari" butonu ->
asagidaki Google Drive klasoru. Klasorde haftalik programlar "XX.HAFTA_(...)" adli
Google E-Tablolar olarak yayinlanir. Her tablo CSV olarak disa aktarilir ve
front-end'in (index.html) bekledigi MACLAR semasina donusturulur.

Bagimlilik YOK (sadece Python standart kutuphanesi). Calistir:  python scripts/update_matches.py
"""

import csv
import io
import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

# --- Sabitler (TBF Istanbul resmi Drive klasoru) ---
FOLDER_ID = "0ByPao_qBUjN-YXJZSG5Fancybmc"
RESOURCEKEY = "0-MKTgAd4XnpTp7S5flJBKuA"
FOLDER_LIST_URL = (
    "https://drive.google.com/embeddedfolderview"
    f"?id={FOLDER_ID}&resourcekey={RESOURCEKEY}#list"
)
CSV_EXPORT_URL = "https://docs.google.com/spreadsheets/d/{id}/export?format=csv"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

# Gecmis maclari at (yalnizca bugun ve sonrasi). False yaparsan tum haftalar kalir.
DROP_PAST = True

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "matches.json"

# --- Turkce ay tablosu ---
_TR = str.maketrans("İıŞşĞğÜüÖöÇç", "IiSsGgUuOoCc")


def _fold(s: str) -> str:
    """Turkce karakterleri ASCII'ye indirip kucuk harfe cevirir (karsilastirma icin)."""
    return s.translate(_TR).lower().strip()


MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]
# folded ilk-3-harf -> (ay_no, kanonik_ad)
MONTH_MAP = {_fold(name)[:3]: (i + 1, name) for i, name in enumerate(MONTHS)}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def list_week_sheets():
    """Klasor HTML'ini parse edip (file_id, baslik) listesi dondurur (sadece XX.HAFTA tablolari)."""
    html = fetch(FOLDER_LIST_URL).decode("utf-8", "replace")
    # Her giris: id="entry-{FILE_ID}" ... flip-entry-title">{BASLIK}
    pairs = re.findall(
        r'id="entry-([A-Za-z0-9_-]+)".*?flip-entry-title[^>]*>([^<]+)<',
        html, re.S,
    )
    weeks = []
    for file_id, title in pairs:
        title = title.strip()
        if re.search(r"\d+\.\s*HAFTA", title, re.IGNORECASE):
            weeks.append((file_id, title))
    return weeks


def parse_date(raw: str):
    """'8 Haziran 2026 Pazartesi' -> ('2026-06-08', '8 Haziran 2026', 'Pazartesi') veya None."""
    tokens = raw.split()
    if len(tokens) < 3:
        return None
    try:
        day = int(re.sub(r"\D", "", tokens[0]))
    except ValueError:
        return None
    month = MONTH_MAP.get(_fold(tokens[1])[:3])
    if not month:
        return None
    month_no, month_name = month
    if not re.fullmatch(r"\d{4}", tokens[2]):
        return None
    year = int(tokens[2])
    gun = tokens[3] if len(tokens) > 3 else ""
    iso = f"{year:04d}-{month_no:02d}-{day:02d}"
    td = f"{day} {month_name} {year}"
    return iso, td, gun


def _col_index(headers, target):
    """Basligi (Turkce/bosluk duyarsiz) tam eslesmeyle bulur, indeks dondurur."""
    t = _fold(target)
    for i, h in enumerate(headers):
        if _fold(h) == t:
            return i
    return None


def parse_sheet(file_id: str, title: str):
    raw = fetch(CSV_EXPORT_URL.format(id=file_id)).decode("utf-8", "replace")
    reader = csv.reader(io.StringIO(raw))
    rows = list(reader)
    if not rows:
        return []
    headers = rows[0]
    idx = {
        "tarih": _col_index(headers, "TARİH"),
        "salon": _col_index(headers, "SALON"),
        "saat": _col_index(headers, "SAAT"),
        "a": _col_index(headers, "A TAKIMI"),
        "b": _col_index(headers, "B TAKIMI"),
        "kat": _col_index(headers, "KATEGORİ"),
        "grup": _col_index(headers, "GRUP"),
    }
    # Tarih daima ilk sutundur; ancak bazi haftalarda bu sutunun basligi yanlis
    # girilebiliyor (or. "TARİH" yerine "1"). Basliktan bulunamazsa 0. sutuna dus.
    if idx["tarih"] is None:
        idx["tarih"] = 0
    if idx["a"] is None or idx["b"] is None:
        print(f"  ! Beklenen sutunlar bulunamadi, atlaniyor: {title}", file=sys.stderr)
        return []

    def cell(row, key):
        i = idx[key]
        return row[i].strip() if (i is not None and i < len(row)) else ""

    out = []
    for row in rows[1:]:
        a, b, saat = cell(row, "a"), cell(row, "b"), cell(row, "saat")
        if not (a and b and saat):
            continue  # baslik/ayrac/bos satir
        parsed = parse_date(cell(row, "tarih"))
        if not parsed:
            continue
        iso, td, gun = parsed
        out.append({
            "tarih": iso, "td": td, "gun": gun, "saat": saat,
            "salon": cell(row, "salon"),
            "a": a, "b": b,
            "kat": cell(row, "kat"), "grup": cell(row, "grup"),
        })
    return out


def main():
    weeks = list_week_sheets()
    if not weeks:
        print("HATA: Drive klasorunde HAFTA tablosu bulunamadi.", file=sys.stderr)
        sys.exit(1)

    print(f"{len(weeks)} hafta tablosu bulundu:")
    all_matches = []
    for file_id, title in weeks:
        try:
            matches = parse_sheet(file_id, title)
        except Exception as e:  # noqa: BLE001
            print(f"  ! {title}: indirilemedi/parse edilemedi ({e})", file=sys.stderr)
            continue
        print(f"  - {title}: {len(matches)} mac")
        all_matches.extend(matches)

    # "Bugun" daima Turkiye saatine (UTC+3, sabit) gore hesaplanir.
    # GitHub Actions calisanlari UTC'dir; 00:01 TR'de tetiklendiginde UTC hala
    # bir onceki gun olur, bu yuzden TR tarihini acikca kullaniyoruz.
    today = datetime.now(timezone(timedelta(hours=3))).date().isoformat()
    if DROP_PAST:
        all_matches = [m for m in all_matches if m["tarih"] >= today]

    # Tekille ve sirala
    seen, uniq = set(), []
    for m in all_matches:
        key = (m["tarih"], m["saat"], m["salon"], m["a"], m["b"], m["kat"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(m)
    uniq.sort(key=lambda m: (m["tarih"], m["saat"], m["salon"]))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(uniq, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\nToplam {len(uniq)} mac -> {OUT_PATH}")


if __name__ == "__main__":
    main()
