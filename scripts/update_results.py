#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TBF Istanbul altyapi mac SONUCLARINI (skorlu, oynanmis maclar) cekip data/results.json uretir.

Kaynak: TBF mini-app API'si (puan durumuyla ayni host):
  GET https://miniappapi.tbf.org.tr/webapi-service/api/Altyapilar/matches
      ?cityId=34&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=1&pageSize=-1
Yanit: { data:[ { matchDate, homeTeamName, awayTeamName, homeTeamScore, awayTeamScore,
                  leagueId, leagueName, saloonName, ... } ], isSuccess, count, ... }
cityId=34 = Istanbul; donen leagueId'ler tam olarak U10-U12 (E/K) altyapi ligleridir.

Sadece OYNANMIS maclar (skor toplami > 0; basketbolda 0-0 olmaz) ve scripts/standings_leagues.json'daki
leagueId'ler alinir. Cikti sade sema: {tarih, saat, a, b, as, bs, lid, salon}.

Son LOOKBACK_DAYS gunluk pencere alinir (son sonuclar + form icin yeterli, dosya kucuk kalir).

Bagimlilik YOK (sadece Python standart kutuphanesi). Calistir:  python scripts/update_results.py
"""

import json
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = "https://miniappapi.tbf.org.tr/webapi-service"
ENDPOINT = (
    BASE + "/api/Altyapilar/matches"
    "?cityId=34&startDate={start}&endDate={end}&page=1&pageSize=-1"
)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

# Son kac gunluk sonuc alinsin (form son-5 ve "son sonuclar" icin fazlasiyla yeterli).
LOOKBACK_DAYS = 90

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "scripts" / "standings_leagues.json"
OUT_PATH = ROOT / "data" / "results.json"


def fetch_json(url: str):
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def _int(v, default=0):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def main():
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    izin = {_int(l.get("leagueId")) for l in (cfg.get("ligler") or [])}
    if not izin:
        print("HATA: standings_leagues.json icinde lig yok.", file=sys.stderr)
        sys.exit(1)

    # "Bugun" daima Turkiye saatine (UTC+3) gore (GitHub Actions UTC calisir).
    bugun = datetime.now(timezone(timedelta(hours=3))).date()
    start = (bugun - timedelta(days=LOOKBACK_DAYS)).isoformat()
    end = bugun.isoformat()

    url = ENDPOINT.format(start=start, end=end)
    try:
        payload = fetch_json(url)
    except Exception as e:  # noqa: BLE001
        print(f"HATA: mac sonuclari cekilemedi ({e})", file=sys.stderr)
        sys.exit(1)

    if not payload or not payload.get("isSuccess"):
        print("HATA: API isSuccess=false döndü.", file=sys.stderr)
        sys.exit(1)

    out = []
    for m in payload.get("data") or []:
        lid = _int(m.get("leagueId"))
        if lid not in izin:
            continue
        hs, as_ = _int(m.get("homeTeamScore")), _int(m.get("awayTeamScore"))
        if hs + as_ <= 0:
            continue  # oynanmamis (skor yok)
        md = (m.get("matchDate") or "")
        out.append({
            "tarih": md[:10],
            "saat": md[11:16],
            "a": (m.get("homeTeamName") or "").strip(),
            "b": (m.get("awayTeamName") or "").strip(),
            "as": hs,
            "bs": as_,
            "lid": lid,
            "salon": (m.get("saloonName") or "").strip(),
        })

    out.sort(key=lambda r: (r["tarih"], r["saat"]))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"{len(out)} oynanmis mac ({start} -> {end}) -> {OUT_PATH}")


if __name__ == "__main__":
    main()
