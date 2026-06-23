#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TBF puan durumu (lig tablosu) verisini cekip data/standings.json uretir.

Kaynak: TBF mini-app API'si. Her lig icin:
  GET https://miniappapi.tbf.org.tr/webapi-service/api/League/get-standings-table?leagueId={ID}
yaniti gruplara gore gelir: data = [ { grup, weeksByGroup, standings:[ {takimAdi, sira, o, g, m, ...} ] } ].
Tek leagueId, o ligin TUM gruplarini dondurur.

Hangi ligler cekilecek: scripts/standings_leagues.json (leagueId listesi). Bu dosyayi duzenleyerek
Istanbul kucukler ligi ID'lerini ekleyin. ID = tbf.org.tr/ligler/{leagueId}/puan-durumu adresindeki numara.

Bagimlilik YOK (sadece Python standart kutuphanesi). Calistir:  python scripts/update_standings.py
"""

import hashlib
import io
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

try:
    from PIL import Image  # logo kuculttme/optimize icin (opsiyonel)
    _HAS_PIL = True
except Exception:  # noqa: BLE001
    _HAS_PIL = False

API_URL = (
    "https://miniappapi.tbf.org.tr/webapi-service"
    "/api/League/get-standings-table?leagueId={id}"
)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "scripts" / "standings_leagues.json"
OUT_PATH = ROOT / "data" / "standings.json"
LOGOS_DIR = ROOT / "data" / "logos"
LOGO_MAX = 96  # px — retina icin yeterli (profilde 64px, listede 20px gosterilir)

# URL -> yerel yol onbellegi (ayni calismada tekrar indirmemek icin)
_logo_cache: dict[str, str] = {}


def fetch_json(url: str):
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def localize_logo(url: str) -> str:
    """TBF logo URL'ini indirip data/logos/ altinda optimize PNG olarak saklar; yerel yolu doner.

    Tarayicidan TBF gorsellerine dogrudan (hotlink) erisim Cloudflare tarafindan engellendigi icin
    logolar repoda yerel barindirilir. Dosya adi URL hash'i (kararli); varsa yeniden indirilmez.
    Hata olursa "" doner (uygulama bas-harf rozetine duser).
    """
    url = (url or "").strip()
    if not url:
        return ""
    if url in _logo_cache:
        return _logo_cache[url]

    name = hashlib.md5(url.encode("utf-8")).hexdigest()[:16] + ".png"
    dest = LOGOS_DIR / name
    rel = "data/logos/" + name  # index.html'e gore goreli (web yolu)

    if dest.exists():
        _logo_cache[url] = rel
        return rel

    try:
        # TBF dosya adlarinda bosluk/Turkce karakter olabilir → URL'i guvenli encode et
        sp = urlsplit(url)
        safe_url = urlunsplit((sp.scheme, sp.netloc, quote(sp.path), quote(sp.query, safe="=&"), ""))
        req = urllib.request.Request(safe_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
        LOGOS_DIR.mkdir(parents=True, exist_ok=True)
        if _HAS_PIL:
            im = Image.open(io.BytesIO(raw))
            if getattr(im, "is_animated", False):
                im.seek(0)
            im = im.convert("RGBA")
            im.thumbnail((LOGO_MAX, LOGO_MAX), Image.LANCZOS)
            im.save(dest, "PNG", optimize=True)
        else:
            # Pillow yoksa ham veriyi kaydet (optimize edilemez)
            dest.write_bytes(raw)
    except Exception as e:  # noqa: BLE001
        print(f"  ! logo indirilemedi ({url[:60]}...): {e}", file=sys.stderr)
        _logo_cache[url] = ""
        return ""

    _logo_cache[url] = rel
    return rel


def _num(v, default=0):
    """API bazen sayilari float/str dondurur; guvenli int'e cevirir."""
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def parse_league(league_id: int):
    """Bir lig icin gruplanmis puan durumunu sade sema olarak dondurur."""
    payload = fetch_json(API_URL.format(id=league_id))
    if not payload or not payload.get("isSuccess"):
        return []
    gruplar = []
    for grup in payload.get("data") or []:
        takimlar = []
        for row in grup.get("standings") or []:
            atan, yiyen = _num(row.get("a")), _num(row.get("y"))
            takimlar.append({
                "sira": _num(row.get("sira")),
                "takim": (row.get("takimAdi") or "").strip(),
                "o": _num(row.get("o")),
                "g": _num(row.get("g")),
                "m": _num(row.get("m")),
                "a": atan,
                "y": yiyen,
                "av": atan - yiyen,
                "puan": _num(row.get("puan")),
                "logo": localize_logo(row.get("teamLogo") or ""),
            })
        if not takimlar:
            continue
        takimlar.sort(key=lambda t: (t["sira"] if t["sira"] else 999, -t["puan"]))
        gruplar.append({
            "grup": (grup.get("grup") or "").strip(),
            "hafta": _num((grup.get("standings") or [{}])[0].get("hafta")),
            "takimlar": takimlar,
        })
    return gruplar


def main():
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    ligler = cfg.get("ligler") or []
    if not ligler:
        print("HATA: standings_leagues.json icinde lig yok.", file=sys.stderr)
        sys.exit(1)

    ligler = sorted(ligler, key=lambda l: l.get("sira", 9999))
    out = []
    for lig in ligler:
        lid = lig.get("leagueId")
        etiket = lig.get("etiket", str(lid))
        try:
            gruplar = parse_league(lid)
        except Exception as e:  # noqa: BLE001
            print(f"  ! {etiket} ({lid}): cekilemedi ({e})", file=sys.stderr)
            continue
        if not gruplar:
            print(f"  - {etiket} ({lid}): puan durumu yok/bos, atlaniyor")
            continue
        toplam = sum(len(g["takimlar"]) for g in gruplar)
        print(f"  - {etiket} ({lid}): {len(gruplar)} grup, {toplam} takim")
        out.append({"leagueId": lid, "etiket": etiket, "gruplar": gruplar})

    result = {"guncelleme": date.today().isoformat(), "ligler": out}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\nToplam {len(out)} lig -> {OUT_PATH}")


if __name__ == "__main__":
    main()
