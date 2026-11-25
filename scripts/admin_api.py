"""管理端自动化工具：登录 + 题目/试卷接口探查。

用法：
    python scripts/admin_api.py --user <用户名> --pass <密码> [--recon]

环境变量优先：YASI_ADMIN_USER / YASI_ADMIN_PASS
"""
import argparse
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


def dump(name, data):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    print(f"[saved] {path}")


def login(page, user, pwd):
    page.goto(BASE + "/login", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    page.fill('input[name="userName"]', user)
    page.fill('input[name="password"]', pwd)
    page.click("button.login-btn")
    page.wait_for_timeout(2500)
    token = page.evaluate("() => localStorage.getItem('adminToken')")
    if not token:
        raise RuntimeError("登录失败：未拿到 adminToken，可能账号密码不对")
    print("[ok] 登录成功，token 长度", len(token))
    return token


def api(page, path, payload=None, method="POST"):
    """在页面上下文里带 Authorization 头调用后端接口，返回解析后的 JSON。"""
    token = page.evaluate("() => localStorage.getItem('adminToken')")
    return page.evaluate(
        """async ([path, payload, method, token]) => {
            const res = await fetch(path, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'request-ajax': 'true'
                },
                body: payload === null ? undefined : JSON.stringify(payload)
            })
            return await res.text()
        }""",
        [path, payload, method, token],
    )


def recon(page):
    # 1) 填空题（题型 4）全量列表
    raw = api(page, "/api/admin/question/page", {
        "content": None, "questionType": 4, "paperName": None,
        "moduleType": None, "partNo": None, "pageIndex": 1, "pageSize": 100,
    })
    data = json.loads(raw)
    dump("question-gapfilling-page.json", data)
    resp = data.get("response") or {}
    rows = resp.get("list") or []
    print(f"[recon] 填空题总数 {resp.get('total')}，本页 {len(rows)}")
    for row in rows:
        print("  -", row.get("id"), row.get("paperName"), "part", row.get("partNo"),
              "module", row.get("moduleType"), "|", (row.get("shortTitle") or "")[:40])

    # 2) 逐题详情，看 groupGap（分组）/ contents（多答案）
    details = []
    for row in rows:
        raw = api(page, "/api/admin/question/select/" + str(row.get("id")))
        try:
            body = json.loads(raw)
        except Exception:
            body = {"raw": raw}
        q = body.get("response") or {}
        details.append({"row": row, "question": q})
    dump("question-gapfilling-details.json", details)
    for d in details:
        q = d["question"]
        print("  *", d["row"].get("id"),
              "groupGap=", q.get("groupGap"),
              "contents=", (str(q.get("contents"))[:60] if q.get("contents") else None),
              "|", (d["row"].get("shortTitle") or "")[:30])

    # 3) 已有试卷列表（看看命名习惯、模块/Part 分布）
    raw = api(page, "/api/admin/exam/paper/page", {
        "name": None, "paperType": None, "pageIndex": 1, "pageSize": 50,
    })
    papers = json.loads(raw)
    dump("paper-page.json", papers)
    plist = (papers.get("response") or {}).get("list") or []
    print(f"[recon] 试卷总数 {(papers.get('response') or {}).get('total')}")
    for p in plist[:20]:
        print("  -", p.get("id"), p.get("name"), "| type", p.get("paperType"),
              "| level", p.get("level"), "| subject", p.get("subjectId"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--user", default=os.environ.get("YASI_ADMIN_USER", ""))
    ap.add_argument("--pass", dest="pwd", default=os.environ.get("YASI_ADMIN_PASS", ""))
    ap.add_argument("--recon", action="store_true")
    args = ap.parse_args()
    if not args.user or not args.pwd:
        sys.exit("需要 --user/--pass（或环境变量 YASI_ADMIN_USER / YASI_ADMIN_PASS）")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1600, "height": 950})
        page.on("pageerror", lambda e: print("[pageerror]", e))
        try:
            login(page, args.user, args.pwd)
            if args.recon:
                recon(page)
        finally:
            os.makedirs(OUT, exist_ok=True)
            page.screenshot(path=os.path.join(OUT, "final.png"), full_page=True)
            browser.close()


if __name__ == "__main__":
    main()
