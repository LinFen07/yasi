"""查题库：某模块/Part 下的填空题及其空数，用来给空 Part 补题。"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
MODULE = int(os.environ.get("YASI_MODULE", "1"))
PART = int(os.environ.get("YASI_PART", "3"))


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

        rows = json.loads(page.evaluate(
            """async ([token, moduleType, partNo]) => {
                const r = await fetch('/api/admin/question/page', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
                    body: JSON.stringify({
                        content: null, questionType: 4, paperName: null,
                        moduleType: moduleType, partNo: partNo,
                        pageIndex: 1, pageSize: 100
                    })
                })
                return await r.text()
            }""", [token, MODULE, PART]))["response"]
        print(f"模块 {MODULE} / Part {PART} 的填空题 共 {rows.get('total')}")
        for r in (rows.get("list") or []):
            q = json.loads(page.evaluate(
                """async ([token, id]) => {
                    const r = await fetch('/api/admin/question/select/' + id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                    })
                    return await r.text()
                }""", [token, r.get("id")]))["response"]
            items = q.get("items") or []
            groups = {}
            for it in items:
                groups.setdefault(str(it.get("groupGap")), []).append(it)
            multi = sum(1 for v in groups.values() if len(v) > 1)
            print(f"  id={r.get('id'):<5} 空数={len(items):<3} 多空组={multi} 分={q.get('score')} "
                  f"paper={r.get('paperName')!r} | {(r.get('shortTitle') or '')[:46]}")
        browser.close()


if __name__ == "__main__":
    main()
