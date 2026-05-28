#!/usr/bin/env python3
"""Capture screenshots of all key pages — desktop (1440x900) and mobile (390x844).

Outputs:
  build/screenshots/desktop/01-landing.png ... 08-prevention.png
  build/screenshots/mobile/01-landing.png ... 08-prevention.png
"""
from __future__ import annotations
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io"
ANALYSIS_ID = "mpogrc1x_pwzgd2"

PAGES = [
    ("01-landing", "/"),
    ("02-upload", "/upload?sample=1"),
    ("03-timeline", f"/analyze/{ANALYSIS_ID}/timeline"),
    ("04-dashboard", f"/analyze/{ANALYSIS_ID}/dashboard"),
    ("05-action-plan", f"/analyze/{ANALYSIS_ID}/action-plan"),
    ("06-briefing", f"/analyze/{ANALYSIS_ID}/briefing"),
    ("07-drafts", f"/analyze/{ANALYSIS_ID}/drafts"),
    ("08-prevention", f"/analyze/{ANALYSIS_ID}/prevention"),
]

OUT = Path(__file__).resolve().parent.parent / "build" / "screenshots"


def capture(name: str, viewport: dict[str, int], full_page: bool) -> None:
    out_dir = OUT / name
    out_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=viewport, locale="ja-JP",
                                  device_scale_factor=2)
        page = ctx.new_page()
        for slug, path in PAGES:
            page.goto(BASE + path, wait_until="networkidle", timeout=30000)
            # Timeline page has an animation — wait for it to finish.
            if "timeline" in path:
                page.wait_for_timeout(8000)
            else:
                page.wait_for_timeout(1500)
            png = out_dir / f"{slug}.png"
            page.screenshot(path=str(png), full_page=full_page)
            print(f"  [{name}] {slug} → {png.name}")
        browser.close()


def main() -> None:
    print("→ desktop 1440x900 (full page)")
    capture("desktop", {"width": 1440, "height": 900}, full_page=True)
    print("→ mobile 390x844 (full page, iPhone 13)")
    capture("mobile", {"width": 390, "height": 844}, full_page=True)
    print(f"\n✅ done: {OUT}")


if __name__ == "__main__":
    main()
