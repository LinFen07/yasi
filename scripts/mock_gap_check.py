"""离线校验：mock 后端数据，检查 feature/gap-groupGap-admin 分支的
填空题「一题多空 / groupGap」录入页是否能正确回显与分组。

不需要真实账号：拦截 /api/** 返回造数即可。
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

QUESTION = {
    "id": 999,
    "questionType": 4,
    "level": 1,
    "subjectId": 1,
    "paperName": "mock 试卷",
    "moduleType": 2,
    "partNo": 1,
    "score": 4,
    "difficult": 3,
    "title": (
        "<p>The company was founded in 1990 and has grown steadily ever since, "
        "so its success is a result of careful planning and hard work "
        "<span class=\"gapfilling-span u-a1\"> (1) </span> and "
        "<span class=\"gapfilling-span u-a2\"> (2) </span> "
        "over the past three decades.</p>"
    ),
    "items": [
        {"itemUuid": "u-a1", "prefix": "1", "groupGap": "1", "contents": ["careful planning"], "score": 2},
        {"itemUuid": "u-a2", "prefix": "2", "groupGap": "1", "contents": ["hard work"], "score": None},
    ],
    "analyze": "mock 解析",
}

SUBJECTS = [
    {"id": 1, "name": "英语", "level": 1, "levelName": "初一"},
    {"id": 2, "name": "英语", "level": 2, "levelName": "初二"},
]


def handler(route):
    url = route.request.url
    if "/api/admin/question/select/" in url:
        body = {"code": 1, "response": QUESTION}
    elif "/api/admin/education/subject/list" in url:
        body = {"code": 1, "response": SUBJECTS}
    else:
        body = {"code": 1, "response": {}}
    route.fulfill(status=200, content_type="application/json;charset=UTF-8",
                  body=json.dumps(body, ensure_ascii=False))


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1680, "height": 1000})
        page.add_init_script("localStorage.setItem('adminToken', 'mock-token')")
        page.route("**/api/**", handler)
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))

        page.goto(BASE + "/#/exam/question/edit/gapFilling?id=999", wait_until="domcontentloaded")
        page.wait_for_timeout(4000)

        print("URL:", page.url)
        text = page.locator("body").inner_text()
        print("---- 页面文本（前 1500 字）----")
        print(text[:1500])
        print("---- 关键标记 ----")
        for kw in ["一题多空", "groupGap", "组", "多空", "答案", "解析"]:
            print(f"  {kw}: {text.count(kw)}")
        print("---- 开关/单选 ----")
        for i in range(page.locator("input[type=checkbox]").count()):
            el = page.locator("input[type=checkbox]").nth(i)
            print("  checkbox[%d] checked=%s" % (i, el.is_checked()))
        print("---- 表格行 ----")
        for i in range(page.locator("table tr").count()):
            row = page.locator("table tr").nth(i).inner_text().replace("\n", " | ")
            if row.strip():
                print("  row:", row[:160])
        print("PAGE ERRORS:", errs[:5])
        page.screenshot(path=os.path.join(OUT, "mock-gap-filling.png"), full_page=True)

        # --- 验证新提交的行为：删掉组内多出来的空，剩一个空时自动关闭「一题多空」---
        remove_btn = page.locator("button.gap-remove-btn")
        print("\n[行为验证] 组内多余空删除按钮数量:", remove_btn.count())
        if remove_btn.count():
            remove_btn.first.click()
            page.wait_for_timeout(1200)
            text2 = page.locator("body").inner_text()
            print("  删除后表格文本:", " | ".join(
                line.strip() for line in text2.splitlines()
                if line.strip() in ("1", "〃1", "共享", "careful planning", "hard work")))
            checked = [page.locator("input[type=checkbox]").nth(i).is_checked()
                       for i in range(page.locator("input[type=checkbox]").count())]
            print("  删除后「开启一题多空」勾选状态:", checked,
                  "(期望 [False]，即只剩一个空时自动关闭)")
            print("  删除后剩余删除按钮数量:", page.locator("button.gap-remove-btn").count())
            page.screenshot(path=os.path.join(OUT, "mock-gap-filling-after-remove.png"), full_page=True)
        browser.close()
    print("[saved]", os.path.join(OUT, "mock-gap-filling.png"))


if __name__ == "__main__":
    main()
