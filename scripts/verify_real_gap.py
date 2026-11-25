"""用真实后端数据验证 feature/gap-groupGap-admin 分支：
1) 新建的试卷里，两道「一题多空」题目的 groupGap 分组是否完整保留；
2) 用编辑页打开这两道题，组首/共享行/「开启一题多空」勾选是否正确回显。
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
PAPER_ID = os.environ.get("YASI_PAPER_ID", "36")
QIDS = [int(x) for x in os.environ.get("YASI_QIDS", "327,390").split(",")]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1680, "height": 1000})
        page.on("pageerror", lambda e: print("[pageerror]", e))
        page.goto(BASE + "/login", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        page.fill('input[name="userName"]', os.environ["YASI_ADMIN_USER"])
        page.fill('input[name="password"]', os.environ["YASI_ADMIN_PASS"])
        page.click("button.login-btn")
        page.wait_for_timeout(2500)
        token = page.evaluate("() => localStorage.getItem('adminToken')")

        # 1) 试卷内容校验
        detail = json.loads(page.evaluate(
            """async ([token, id]) => {
                const r = await fetch('/api/admin/exam/paper/select/' + id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                })
                return await r.text()
            }""", [token, PAPER_ID]))["response"]
        print(f"== 试卷 {detail.get('id')} {detail.get('name')} ==")
        all_qids = []
        for ti in (detail.get("titleItems") or []):
            ids = [q.get("id") for q in (ti.get("questionItems") or [])]
            all_qids += ids
            print("  模块", ti.get("moduleType"), "part", ti.get("partNo"), "题数", len(ids), ids)
        print("  合计题目:", len(all_qids))

        for qid in QIDS:
            q = json.loads(page.evaluate(
                """async ([token, id]) => {
                    const r = await fetch('/api/admin/question/select/' + id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                    })
                    return await r.text()
                }""", [token, qid]))["response"]
            items = q.get("items") or []
            groups = {}
            for it in items:
                groups.setdefault(str(it.get("groupGap")), []).append(it)
            print(f"\n== 题目 {qid} ({q.get('paperName')}) ==")
            print("   blanks:", len(items), "| 分组:", {k: len(v) for k, v in groups.items()})
            for g, lst in groups.items():
                if len(lst) > 1:
                    print(f"   组 {g} 有 {len(lst)} 个空 -> {[i.get('prefix') for i in lst]}"
                          f" | 组首分值 {lst[0].get('score')} | 答案 {[i.get('contents') for i in lst]}")

            # 3) 编辑页回显
            page.goto(f"{BASE}/#/exam/question/edit/gapFilling?id={qid}", wait_until="domcontentloaded")
            page.wait_for_timeout(3500)
            rows = page.locator(".el-table__body-wrapper tbody tr")
            print("   编辑页表格行:")
            for i in range(rows.count()):
                tds = rows.nth(i).locator("td").all()
                cells = [td.inner_text().strip().replace("\n", " ") for td in tds]
                print("     ", " | ".join(c for c in cells if c))
            checks = page.locator(".el-table__body-wrapper tbody input[type=checkbox]")
            print("   「开启一题多空」勾选:", [checks.nth(i).is_checked() for i in range(checks.count())])
            total = page.locator(".gap-total-score")
            if total.count():
                print("   总分:", total.first.inner_text().strip())
            page.screenshot(path=os.path.join(OUT, f"real-gap-{qid}.png"), full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
