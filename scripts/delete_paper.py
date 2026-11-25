"""在「试卷列表」页删除指定名称的试卷（走管理端 UI 的删除按钮）。"""
import os
import sys

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
NAME = os.environ.get("YASI_PAPER_NAME", "")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


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

        page.goto(BASE + "/#/exam/paper/list", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        rows = page.locator(".el-table__body-wrapper tbody tr")
        hit = False
        for i in range(rows.count()):
            text = " ".join(rows.nth(i).inner_text().split())
            if NAME in text:
                print("找到行:", text[:120])
                rows.nth(i).locator("button", has_text="删除").click()
                page.wait_for_timeout(2500)
                msgs = page.locator(".el-message")
                for j in range(msgs.count()):
                    print("提示:", msgs.nth(j).inner_text().strip())
                hit = True
                break
        if not hit:
            print("未找到名称包含", NAME, "的试卷")
        page.screenshot(path=os.path.join(OUT, "paper-list-after-delete.png"), full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
