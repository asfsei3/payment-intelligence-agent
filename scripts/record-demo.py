#!/usr/bin/env python3
"""Auto-record a ~3:24 demo of Payment Intelligence Agent.

Implements demo-script-v3.md:
  Act I (45s) — 5 intro slides (problem framing for non-payment audience)
  Act II (15s) — solution framing (2 slides)
  Act III (129s) — 9 demo scenes against the production app
  Act IV (15s) — closing slides (what's new + endcard)

Drives the production URL with Playwright. Telops are injected as fixed-position
DOM nodes (no narration). Static slides use a separate HTML page with a
2-stage transition (hide → 400ms gap → show) to avoid overlap residue.

Outputs:
  build/demo-video/pia-demo-3min.mp4  (~3:24, H.264, 1920x1080, CRF 16)
"""
from __future__ import annotations
import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, Page

BASE = os.environ.get("PIA_BASE", "https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io")
ANALYSIS_ID = "PLACEHOLDER_ID"  # overwritten via env or auto-created
OUT_DIR = Path(__file__).resolve().parent.parent / "build" / "demo-video"
OUT_DIR.mkdir(parents=True, exist_ok=True)
VIEWPORT = {"width": 1920, "height": 1080}
DEVICE_SCALE_FACTOR = 2  # Retina-grade rendering, downscaled to video size

# ---------------------------------------------------------------------------
# Static slides (Act I + II + IV) — single HTML page, switched via JS
# ---------------------------------------------------------------------------
SLIDE_CSS = """
:root {
  --forest:#1a4731; --forest-deep:#0c1f15; --gold:#c9a84c; --cream:#fff8e5;
  --ink:#0a1810;
}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--forest-deep);
  font-family:'Hiragino Sans','Noto Sans JP',sans-serif;color:var(--cream);
  overflow:hidden;}

.slide{position:absolute;inset:0;
  flex-direction:column;justify-content:center;align-items:center;padding:96px;
  display:none;pointer-events:none;}
.slide.active{display:flex;}

.eyebrow{color:var(--gold);font-size:20px;letter-spacing:.32em;
  text-transform:uppercase;margin-bottom:32px;font-weight:600;}
h1{font-size:88px;font-weight:800;letter-spacing:.02em;line-height:1.15;
  text-align:center;margin-bottom:32px;}
h2{font-size:54px;font-weight:700;line-height:1.45;text-align:center;
  margin-bottom:36px;max-width:1480px;
  word-break:keep-all;line-break:strict;overflow-wrap:break-word;}
.sub{font-size:28px;line-height:1.75;color:rgba(255,248,229,.85);
  text-align:center;max-width:1200px;
  word-break:keep-all;line-break:strict;overflow-wrap:break-word;}
.stat{color:var(--gold);font-weight:800;}

.people-grid{display:grid;grid-template-columns:repeat(20,1fr);gap:10px;
  margin:36px 0;max-width:900px;}
.person{width:32px;height:32px;border-radius:50%;background:rgba(255,248,229,.18);}
.person.fail{background:#d8584b;box-shadow:0 0 14px rgba(216,88,75,.5);}

.flow{display:flex;align-items:center;justify-content:center;gap:30px;
  margin:36px 0;flex-wrap:wrap;}
.flow .step{padding:20px 28px;border:1px solid var(--gold);border-radius:8px;
  font-size:24px;font-weight:600;background:rgba(201,168,76,.08);}
.flow .step.bad{border-color:#d8584b;color:#ffb8b0;background:rgba(216,88,75,.08);}
.flow .arrow{font-size:32px;color:var(--gold);}

.pain-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:32px;
  margin-top:44px;max-width:1480px;}
.pain-card{background:rgba(255,248,229,.06);border-left:5px solid var(--gold);
  padding:28px 32px;border-radius:8px;text-align:left;}
.pain-card h3{font-size:26px;color:var(--gold);margin-bottom:10px;}
.pain-card p{font-size:22px;line-height:1.6;color:rgba(255,248,229,.85);
  word-break:keep-all;line-break:strict;overflow-wrap:break-word;}

.vs{display:grid;grid-template-columns:1fr auto 1fr;gap:60px;align-items:center;
  margin-top:44px;max-width:1480px;}
.vs-col{padding:38px;border-radius:10px;text-align:center;}
.vs-col.abroad{background:rgba(201,168,76,.12);border:1px solid var(--gold);}
.vs-col.japan{background:rgba(255,248,229,.04);border:1px dashed rgba(255,248,229,.3);}
.vs-col .label{font-size:18px;letter-spacing:.22em;color:var(--gold);
  text-transform:uppercase;margin-bottom:12px;}
.vs-col .title{font-size:30px;font-weight:700;margin-bottom:18px;}
.vs-col .desc{font-size:22px;line-height:1.6;color:rgba(255,248,229,.85);
  word-break:keep-all;line-break:strict;overflow-wrap:break-word;}
.vs-arrow{font-size:42px;color:var(--gold);}

.agents-row{display:flex;justify-content:center;gap:18px;margin:36px 0;
  flex-wrap:wrap;max-width:1600px;}
.agent-chip{padding:16px 20px;border:1px solid var(--gold);border-radius:8px;
  font-size:19px;background:rgba(201,168,76,.06);min-width:160px;text-align:center;}
.agent-chip .icon{font-size:32px;display:block;margin-bottom:6px;}

.do-grid{display:grid;grid-template-columns:1fr 1fr;gap:42px;margin-top:42px;
  max-width:1340px;}
.do-col{padding:32px 36px;border-radius:10px;}
.do-col.nope{background:rgba(216,88,75,.1);border:1px solid #d8584b;}
.do-col.yep{background:rgba(120,180,120,.1);border:1px solid #7eb47e;}
.do-col h4{font-size:28px;margin-bottom:18px;}
.do-col.nope h4{color:#ffb8b0;}
.do-col.yep h4{color:#a8d4a8;}
.do-col ul{list-style:none;font-size:22px;line-height:1.9;color:rgba(255,248,229,.9);
  word-break:keep-all;line-break:strict;overflow-wrap:break-word;}
.do-col li::before{content:"●  ";color:inherit;}

.closing-list{display:flex;flex-direction:column;gap:20px;margin-top:32px;
  max-width:1380px;text-align:left;}
.closing-item{padding:24px 32px;background:rgba(255,248,229,.06);
  border-left:5px solid var(--gold);border-radius:8px;
  font-size:26px;line-height:1.55;
  word-break:keep-all;line-break:strict;overflow-wrap:break-word;}
.closing-item .num{color:var(--gold);font-weight:800;margin-right:18px;}
.closing-item .em{color:var(--gold);font-weight:700;}

.endcard h1{font-size:96px;}
.endcard .url{margin-top:42px;font-size:24px;color:var(--gold);
  letter-spacing:.05em;padding:14px 26px;border:1px solid var(--gold);
  border-radius:6px;}
.endcard .powered{margin-top:32px;font-size:18px;color:rgba(255,248,229,.55);
  letter-spacing:.04em;}

.corner{position:fixed;top:32px;right:42px;background:rgba(201,168,76,.15);
  color:var(--gold);padding:10px 20px;border-radius:6px;font-size:17px;
  font-weight:600;letter-spacing:.05em;border:1px solid var(--gold);
  z-index:99999;pointer-events:none;}
.footer-note{position:absolute;bottom:64px;font-size:18px;
  color:rgba(255,248,229,.55);letter-spacing:.04em;}
"""


def _people_html(failed_indices: list[int], total: int = 100) -> str:
    cells = []
    for i in range(total):
        cls = "person fail" if i in failed_indices else "person"
        cells.append(f'<div class="{cls}"></div>')
    return f'<div class="people-grid">{"".join(cells)}</div>'


_PEOPLE = _people_html([7, 23, 41, 55, 68, 82, 91])

SLIDE_HTML = """
<!doctype html><html lang="ja" style="background:#0c1f15"><head><meta charset="utf-8"><title>Slides</title>
<style>__CSS__</style></head>
<body style="background:#0c1f15">
<div class="corner">Payment Intelligence Agent</div>

<div class="slide" id="s1">
  <div class="eyebrow">Microsoft Agent Hackathon 2026 応募作品</div>
  <h1>Payment Intelligence<br/>Agent</h1>
  <p class="sub">決済エラー対応を、AIエージェントで整理する<br/>Revenue Ops Desk</p>
</div>

<div class="slide" id="s2">
  <div class="eyebrow">背景</div>
  <h2>サブスクでは毎月決済失敗が発生し、<br/>放置すると <span class="stat">"請求できなかった売上"</span> が積み上がる</h2>
  <div class="flow" style="margin:24px 0;">
    <div class="step">決済失敗</div>
    <div class="arrow">→</div>
    <div class="step">4ツールに散在<br/><span style="font-size:16px;opacity:.7;">画面/CSV/CS/報告</span></div>
    <div class="arrow">→</div>
    <div class="step bad">請求できなかった売上</div>
  </div>
  <p class="sub" style="margin-top:18px;">海外には対応支援サービスが広がる一方、<span class="stat">日本ではCSV・管理画面・メール・報告が分断</span>され、手作業が残りやすい領域です。</p>
</div>

<div class="slide" id="s3">
  <div class="eyebrow">本プロトの位置付け</div>
  <h2><span class="stat">7つの AI エージェント</span>が、<br/>決済エラー対応を一気通貫で整理する<br/><span style="white-space:nowrap">Revenue Ops Desk</span></h2>
  <div class="agents-row">
    <div class="agent-chip"><span class="icon">🛡</span>安全確認</div>
    <div class="agent-chip"><span class="icon">🏷</span>分類</div>
    <div class="agent-chip"><span class="icon">💴</span>売上影響</div>
    <div class="agent-chip"><span class="icon">✉</span>顧客対応</div>
    <div class="agent-chip"><span class="icon">📋</span>タスク化</div>
    <div class="agent-chip"><span class="icon">📊</span>経営報告</div>
    <div class="agent-chip"><span class="icon">🔁</span>再発防止</div>
  </div>
  <p class="sub" style="margin-top:18px;font-size:24px;">マスク済みCSVを入れるだけで、<span class="stat">分類・金額集計はルールで確定</span>、<span class="stat">文章生成だけAIが担当</span>。決済処理には一切触らず、整理・提案・下書きに限定。</p>
</div>

<div class="slide" id="s8">
  <div class="eyebrow">本作品の設計判断</div>
  <h2>AIに任せる範囲を絞ることで、<br/>サブスク事業者が <span class="stat">安心して使える</span> 設計</h2>
  <div class="closing-list">
    <div class="closing-item"><span class="num">1.</span><span class="em">AIは決済処理に触らない</span> — 暴走しても <span class="stat">金銭事故ゼロ</span>。本番運用にそのまま乗せられる安全設計</div>
    <div class="closing-item"><span class="num">2.</span><span class="em">数字はルールで確定、文章だけAI</span> — 経営報告の金額を <span class="stat">AIに書かせない</span> から、言い間違いが起こらない</div>
    <div class="closing-item"><span class="num">3.</span><span class="em">7エージェントで一気通貫</span> — 4ツールに散在していた毎月の手作業が <span class="stat">1ワークフロー</span> で完結</div>
  </div>
</div>

<div class="slide endcard" id="s9">
  <div class="eyebrow">Microsoft Agent Hackathon 2026 応募作品</div>
  <h1>Payment Intelligence<br/>Agent</h1>
  <p class="sub">決済エラー対応を、AIエージェントで整理する<br/>Revenue Ops Desk</p>
  <div class="url">pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io</div>
  <div class="powered">Azure Container Apps 上で稼働 / Azure OpenAI (gpt-4.1-mini) を利用</div>
</div>

<script>
  // Two-stage transition: hide current → wait 400ms → show next.
  // Prevents the previous slide remaining visible while the new one fades in.
  let _switching = false;
  window.showSlide = function(n){
    if (_switching) return;
    const next = document.getElementById('s'+n);
    if (!next || next.classList.contains('active')) return;
    _switching = true;
    const active = document.querySelector('.slide.active');
    if (active) active.classList.remove('active');
    setTimeout(() => {
      next.classList.add('active');
      _switching = false;
    }, 400);
  };
  window.showSlide(1);
</script>
</body></html>
"""
SLIDE_HTML = SLIDE_HTML.replace("__CSS__", SLIDE_CSS).replace("__PEOPLE__", _PEOPLE)


# ---------------------------------------------------------------------------
# Page-context bottom telop (only during demo scenes against the live app)
# ---------------------------------------------------------------------------
TELOP_CSS = """
#pia-telop {
  position: fixed; left: 0; right: 0; bottom: 48px;
  display: flex; justify-content: center; pointer-events: none;
  z-index: 99999; font-family: 'Hiragino Sans','Noto Sans JP',sans-serif;
}
#pia-telop .inner {
  background: rgba(12, 31, 21, 0.94);
  color: #fff8e5;
  padding: 20px 38px;
  border-left: 6px solid #c9a84c;
  border-radius: 8px;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: 0 10px 38px rgba(0,0,0,0.5);
  max-width: 88%;
  text-align: center;
  line-height: 1.45;
  transition: opacity .25s ease;
  opacity: 0;
}
#pia-telop .inner.show { opacity: 1; }
#pia-corner {
  position: fixed; top: 32px; right: 42px;
  background: rgba(26,71,49,0.92);
  color: #fff8e5;
  padding: 10px 20px;
  border-radius: 6px;
  font-family: 'Hiragino Sans','Noto Sans JP',sans-serif;
  font-size: 17px; font-weight: 600;
  z-index: 99999; pointer-events: none;
  letter-spacing: 0.05em;
}
"""

INJECT_JS = """
(() => {
  if (document.getElementById('pia-telop')) return;
  const style = document.createElement('style');
  style.id = 'pia-telop-style';
  style.textContent = %s;
  document.head.appendChild(style);
  const t = document.createElement('div');
  t.id = 'pia-telop';
  t.innerHTML = '<div class="inner"></div>';
  document.body.appendChild(t);
  const c = document.createElement('div');
  c.id = 'pia-corner';
  c.textContent = 'Payment Intelligence Agent';
  document.body.appendChild(c);
})();
""" % repr(TELOP_CSS)


def inject(page: Page) -> None:
    page.evaluate(INJECT_JS)


def telop(page: Page, text: str) -> None:
    inject(page)
    page.evaluate(
        """(t) => {
          const el = document.querySelector('#pia-telop .inner');
          if (!el) return;
          if (el.textContent === t) return;
          el.classList.remove('show');
          setTimeout(() => { el.textContent = t; el.classList.add('show'); }, 150);
        }""",
        text,
    )


def hide_telop(page: Page) -> None:
    page.evaluate(
        "() => { const el=document.querySelector('#pia-telop .inner'); if (el) el.classList.remove('show'); }"
    )


def goto(page: Page, path: str) -> None:
    page.goto(BASE + path, wait_until="domcontentloaded")
    inject(page)


def smooth_scroll(page: Page, target_y: int, duration_ms: int) -> None:
    page.evaluate(
        """([y, d]) => {
            const start = window.scrollY;
            const startTime = performance.now();
            return new Promise(resolve => {
              function step(now) {
                const t = Math.min(1, (now - startTime) / d);
                const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
                window.scrollTo(0, start + (y - start) * eased);
                if (t < 1) requestAnimationFrame(step); else resolve();
              }
              requestAnimationFrame(step);
            });
        }""",
        [target_y, duration_ms],
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    analysis_id = os.environ.get("PIA_ANALYSIS_ID", ANALYSIS_ID)
    if analysis_id == "PLACEHOLDER_ID":
        raise SystemExit("set PIA_ANALYSIS_ID env var to a valid analysis id")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport=VIEWPORT,
            record_video_dir=str(OUT_DIR),
            record_video_size=VIEWPORT,
            device_scale_factor=DEVICE_SCALE_FACTOR,
            locale="ja-JP",
        )
        # Block the timeline page's auto-redirect to /dashboard. The recording
        # needs to dwell on the 7-agent timeline; without this, router.push
        # navigates away after ~6s, leaving the hero scene invisible.
        ctx.add_init_script(
            """
            (() => {
              if (typeof window === 'undefined' || !window.history) return;
              const orig = window.history.pushState.bind(window.history);
              window.history.pushState = function(state, title, url) {
                try {
                  const target = typeof url === 'string'
                    ? new URL(url, location.href).pathname
                    : (url && url.pathname) || '';
                  if (location.pathname.endsWith('/timeline')
                      && target.endsWith('/dashboard')) {
                    console.log('[demo] blocked timeline→dashboard auto-redirect');
                    return;
                  }
                } catch (_) {}
                return orig(state, title, url);
              };
            })();
            """
        )
        page = ctx.new_page()

        # ============ Act I (0:00 - 0:30) — condensed intro ============
        # Prime the page with a dark background so the recording doesn't start
        # on the browser's white default before SLIDE_HTML's CSS kicks in.
        page.set_content(
            "<!doctype html><html style='background:#0c1f15'>"
            "<body style='background:#0c1f15;margin:0;height:100vh'></body></html>",
            wait_until="domcontentloaded",
        )
        time.sleep(0.4)
        page.set_content(SLIDE_HTML, wait_until="domcontentloaded")
        time.sleep(0.5)  # let slide 1 settle (already active)
        time.sleep(5.5)  # s1 title (6s total)

        page.evaluate("window.showSlide(2)")
        time.sleep(10)  # Combined background: problem + consequence + market gap

        page.evaluate("window.showSlide(3)")
        time.sleep(8)   # Solution + safety positioning (combined)

        # ============ Act II (0:30 - 2:40) — focused demo (6 scenes) ============

        # Scene Timeline (30s) — core: 7 agents in motion (the hero scene)
        # Disable auto-redirect: wait for the "自動遷移を停止" button to appear
        # once all agents finish, then click it within the 1.4s redirect window.
        # The init_script pushState block above is a belt-and-suspenders backup.
        goto(page, f"/analyze/{analysis_id}/timeline")
        telop(page, "毎月の決済エラー対応を、7つのエージェントが1つの流れに統合する")
        try:
            stop_btn = page.get_by_role("button", name="自動遷移を停止")
            stop_btn.wait_for(state="visible", timeout=15000)
            stop_btn.click(timeout=1000, no_wait_after=True)
        except Exception as e:
            print(f"timeline: stop-button click failed ({e})", file=sys.stderr)
        time.sleep(9)
        telop(page, "数字・分類はルールで確定し、Azure OpenAI は人が読む文章だけを書く")
        time.sleep(11)
        telop(page, "BI は『見せる』だけ。本作は『次に何をするか』までAIが整理して提案する")
        time.sleep(10)

        # Scene Dashboard (5s)
        goto(page, f"/analyze/{analysis_id}/dashboard")
        telop(page, "請求できなかった売上が、原因別に一目で見える")
        smooth_scroll(page, 400, 2500)
        time.sleep(2.5)

        # Scene Briefing (5s)
        goto(page, f"/analyze/{analysis_id}/briefing")
        telop(page, "経営報告の数字はルールで確定 — AIに書かせるのは本文だけ。金額の言い間違いが起きない")
        time.sleep(5)

        # Scene Drafts (6s)
        goto(page, f"/analyze/{analysis_id}/drafts")
        telop(page, "顧客対応文はAIが下書き。自動送信はせず、必ず担当者が確認してから送る")
        time.sleep(6)

        # Scene Scenario (9s)
        goto(page, f"/analyze/{analysis_id}/scenario")
        telop(page, "顧客体験・売上回収・リスク最小化 — 目的を切り替えるとタスクの順序が並び替わる")
        time.sleep(3)
        for label in ["売上回収重視", "リスク最小化", "顧客体験重視"]:
            try:
                page.get_by_role("button", name=label).click(timeout=1500)
            except Exception:
                pass
            time.sleep(2)

        # Scene Prevention (5s)
        goto(page, f"/analyze/{analysis_id}/prevention")
        telop(page, "対症療法で終わらせない。来月の運用改善案までAIが言語化する")
        time.sleep(5)

        # ============ Act III — closing ============
        page.set_content(SLIDE_HTML, wait_until="domcontentloaded")
        time.sleep(0.4)
        page.evaluate("window.showSlide(8)")
        time.sleep(10)  # 3 design principles + benefits (heavier text)
        page.evaluate("window.showSlide(9)")
        time.sleep(6)   # Endcard

        page.close()
        ctx.close()
        browser.close()

    webm_files = sorted(OUT_DIR.glob("*.webm"), key=lambda p: p.stat().st_mtime)
    if not webm_files:
        print("ERROR: no webm captured", file=sys.stderr)
        sys.exit(1)
    webm = webm_files[-1]
    mp4 = OUT_DIR / "pia-demo-3min.mp4"
    print(f"\n→ converting {webm.name} to mp4 ...")
    # Trim the leading white-flash window before set_content paints.
    # Playwright starts recording at context creation, so the first ~2s
    # are about:blank's default white. Use -ss AFTER -i for accurate seek
    # (avoids keyframe-snap fast seek which can leave white frames in).
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(webm), "-ss", "2.5",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-crf", "16", "-preset", "slow",
            "-profile:v", "high", "-level", "4.2",
            "-movflags", "+faststart",
            str(mp4),
        ],
        check=True,
    )
    print(f"\n✅ done: {mp4}")
    print(f"   raw webm: {webm}")


if __name__ == "__main__":
    main()
