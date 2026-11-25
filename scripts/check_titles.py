"""检查试卷内每道题的题干里是否真的有填空 span（题干缺 span = 题目录坏了）。"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
QIDS = [int(x) for x in os.environ.get("YASI_QIDS", "578,579,581,368,594,598,599,604,616,327,390").split(",")]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(BASE + "/login", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        page.fill('input[name="userName"]', os.environ["YASI_ADMIN_USER"])
        page.fill('input[name="password"]', os.environ["YASI_ADMIN_PASS"])
        page.click("button.login-btn")
        page.wait_for_timeout(2500)
        token = page.evaluate("() => localStorage.getItem('adminToken')")

        print(f"{'id':<6}{'items':<6}{'span':<6}{'table':<7}{'titleLen':<9}{'判定':<12}题干摘要")
        for qid in QIDS:
            q = json.loads(page.evaluate(
                """async ([token, id]) => {
                    const r = await fetch('/api/admin/question/select/' + id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                    })
                    return await r.text()
                }""", [token, qid]))["response"]
            title = q.get("title") or ""
            spans = title.count("gapfilling-span")
            tables = title.lower().count("<table")
            n = len(q.get("items") or [])
            bad = "题干缺空!" if (n and spans < n) else "OK"
            summary = title[:70].replace("\n", " ")
            print(f"{qid:<6}{n:<6}{spans:<6}{tables:<7}{len(title):<9}{bad:<12}{summary}")
        browser.close()


if __name__ == "__main__":
    main()
