"""排查：题目 594 在填空题编辑页回显为空。"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
QID = int(os.environ.get("YASI_QID", "594"))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1680, "height": 1000})
        logs = []
        page.on("console", lambda m: logs.append(f"[{m.type}] {m.text[:200]}"))
        page.on("pageerror", lambda e: logs.append(f"[pageerror] {e}"))
        page.goto(BASE + "/login", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        page.fill('input[name="userName"]', os.environ["YASI_ADMIN_USER"])
        page.fill('input[name="password"]', os.environ["YASI_ADMIN_PASS"])
        page.click("button.login-btn")
        page.wait_for_timeout(2500)
        token = page.evaluate("() => localStorage.getItem('adminToken')")

        q = json.loads(page.evaluate(
            """async ([token, id]) => {
                const r = await fetch('/api/admin/question/select/' + id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                })
                return await r.text()
            }""", [token, QID]))["response"]
        title = q.get("title") or ""
        print("== 接口返回 ==")
        print("  questionType:", q.get("questionType"), "| score:", q.get("score"),
              "| items:", len(q.get("items") or []))
        print("  title 长度:", len(title))
        print("  title 前 700 字:")
        print("   ", title[:700].replace("\n", " "))
        print("  gapfilling-span 数量:", title.count("gapfilling-span"))
        print("  <table> 数量:", title.lower().count("<table"))
        print("  items[0]:", json.dumps((q.get("items") or [{}])[0], ensure_ascii=False)[:200])

        page.goto(f"{BASE}/#/exam/question/edit/gapFilling?id={QID}", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        editor = page.locator(".edui-editor-iframeholder iframe")
        print("\n== 编辑页 ==")
        print("  表格行数:", page.locator(".el-table__body-wrapper tbody tr").count())
        if editor.count():
            frame = page.frame_locator(".edui-editor-iframeholder iframe")
            try:
                html = frame.locator("body").inner_html(timeout=5000)
                print("  编辑器 innerHTML 长度:", len(html))
                print("  编辑器内 span.gapfilling-span:", html.count("gapfilling-span"))
                print("  编辑器内 table:", html.lower().count("<table"))
                print("  编辑器正文前 400 字:", html[:400].replace("\n", " "))
            except Exception as e:
                print("  读取编辑器内容失败:", e)
        print("  console 日志:")
        for line in logs[-15:]:
            print("   ", line)
        page.screenshot(path=os.path.join(OUT, f"debug-gap-{QID}.png"), full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
