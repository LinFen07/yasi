"""扫描题库全部填空题：题干是否含真正的填空位（gapfilling-span），按 模块/Part 分组。"""
import collections
import json
import os
import sys

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")


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
            """async ([token]) => {
                const out = []
                for (let pageIdx = 1; pageIdx <= 3; pageIdx++) {
                    const r = await fetch('/api/admin/question/page', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
                        body: JSON.stringify({
                            content: null, questionType: 4, paperName: null,
                            moduleType: null, partNo: null,
                            pageIndex: pageIdx, pageSize: 100
                        })
                    })
                    const j = await r.json()
                    const list = (j.response && j.response.list) || []
                    if (!list.length) break
                    out.push(...list)
                    if (pageIdx * 100 >= (j.response.total || 0)) break
                }
                return JSON.stringify(out)
            }""", [token]))
        print("题库填空题总数:", len(rows))

        buckets = collections.defaultdict(list)
        for r in rows:
            q = json.loads(page.evaluate(
                """async ([token, id]) => {
                    const r = await fetch('/api/admin/question/select/' + id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                    })
                    return await r.text()
                }""", [token, r.get("id")]))["response"]
            title = q.get("title") or ""
            items = q.get("items") or []
            spans = title.count("gapfilling-span")
            groups = collections.Counter(str(i.get("groupGap")) for i in items)
            multi = sum(1 for v in groups.values() if v > 1)
            healthy = spans >= len(items) and len(items) > 0
            buckets[(r.get("moduleType"), r.get("partNo"))].append(
                (r.get("id"), r.get("paperName"), len(items), spans, multi, q.get("score"), healthy,
                 " ".join(title[:40].split())))

        for key in sorted(buckets, key=lambda k: (k[0] or 0, k[1] or 0)):
            print(f"\n== 模块 {key[0]} / Part {key[1]} ==")
            for row in sorted(buckets[key], key=lambda x: -x[0]):
                mark = "OK  " if row[6] else "BAD "
                print(f"  {mark} id={row[0]:<5} 空数={row[2]:<3} span={row[3]:<3} 多空组={row[4]} "
                      f"分={row[5]:<4} paper={row[1]!r} | {row[7][:38]}")
        browser.close()


if __name__ == "__main__":
    main()
