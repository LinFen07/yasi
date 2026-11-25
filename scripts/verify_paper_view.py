"""校验新建试卷在「试卷编辑」页的渲染：各模块/Part 的题目数与题号。"""
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

        page.goto(f"{BASE}/#/exam/paper/edit?id={PAPER_ID}", wait_until="domcontentloaded")
        page.wait_for_timeout(4000)

        print("== 基本信息 ==")
        for label in ("年级", "学科", "试卷类型", "试卷名称", "建议时长"):
            it = page.locator(".paper-form .el-form-item").filter(has_text=label).first
            val = it.locator("input").first.input_value() if it.locator("input").count() else ""
            print(f"   {label}: {val}")

        for tab in ("听力", "阅读", "写作"):
            page.locator(".module-tabs .el-tabs__item", has_text=tab).first.click()
            page.wait_for_timeout(1200)
            panel = (".listening-part-panel" if tab == "听力" else
                     ".reading-part-panel" if tab == "阅读" else ".writing-section")
            part_tabs = page.locator(".listening-part-tab" if tab == "听力" else
                                     ".reading-part-tab" if tab == "阅读" else ".writing-part-tab")
            print(f"== {tab} 模块（{part_tabs.count()} 个 Part 标签）==")
            for i in range(part_tabs.count()):
                t = part_tabs.nth(i)
                label = " ".join(t.inner_text().split())
                t.click()
                page.wait_for_timeout(900)
                n = page.locator(panel + " .question-item").count()
                titles = page.locator(panel + " .question-item__body .q-title").all()
                print(f"   {label}  -> 已填 {n} 题",
                      [x.inner_text().strip().replace('\n', ' ')[:26] for x in titles])
            page.screenshot(path=os.path.join(OUT, f"paper-view-{tab}.png"), full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
