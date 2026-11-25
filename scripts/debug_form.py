"""调试：试卷新增页的基本信息表单（年级/学科/类型/名称/时长）状态与校验提示。"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def dump_form(page):
    items = page.locator(".paper-form > .form-card").first.locator(".el-form-item")
    for i in range(items.count()):
        it = items.nth(i)
        label = it.locator(".el-form-item__label").inner_text().strip() if it.locator(".el-form-item__label").count() else "(no label)"
        inputs = it.locator("input")
        vals = [inputs.nth(j).input_value() for j in range(inputs.count())]
        selects = it.locator(".el-select")
        stext = [selects.nth(j).inner_text().strip() for j in range(selects.count())]
        err = it.locator(".el-form-item__error")
        errtext = err.inner_text().strip() if err.count() else ""
        print(f"  [{i}] label={label!r} inputs={vals} selects={stext} err={errtext!r}")


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

        page.goto(BASE + "/#/exam/paper/add", wait_until="domcontentloaded")
        page.wait_for_timeout(3500)
        print("== 初始表单 ==")
        dump_form(page)

        # 学科下拉里到底有哪些选项
        subj = page.locator(".paper-form .el-form-item").filter(has_text="学科").first
        subj.locator(".el-select").click()
        page.wait_for_timeout(700)
        opts = page.locator(".el-select-dropdown__item:visible")
        print("== 学科下拉选项 ==", [opts.nth(i).inner_text().strip() for i in range(opts.count())])
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        lvl = page.locator(".paper-form .el-form-item").filter(has_text="年级").first
        lvl.locator(".el-select").click()
        page.wait_for_timeout(700)
        opts = page.locator(".el-select-dropdown__item:visible")
        print("== 年级下拉选项 ==", [opts.nth(i).inner_text().strip() for i in range(opts.count())])
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        print("== store subjects ==")
        print(page.evaluate("() => document.body.innerText.includes('英语')"))
        page.screenshot(path=os.path.join(OUT, "debug-form.png"), full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
