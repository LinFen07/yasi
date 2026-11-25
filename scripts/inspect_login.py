"""探查管理端登录页：确认 dev server 页面可渲染、无编译错误遮罩。"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8002"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("console", lambda m: errors.append(f"[console.{m.type}] {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))

    page.goto(BASE + "/login", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)

    print("URL:", page.url)
    print("TITLE:", page.title())
    # 编译错误遮罩检测
    overlay = page.locator("iframe#webpack-dev-server-client-overlay, #webpack-dev-server-client-overlay")
    print("OVERLAY COUNT:", overlay.count())
    print("BODY SNIPPET:")
    print(page.locator("body").inner_text()[:800])
    print("INPUTS:", page.locator("input").count())
    for i in range(page.locator("input").count()):
        el = page.locator("input").nth(i)
        print("  input[%d] placeholder=%r name=%r type=%r" % (
            i, el.get_attribute("placeholder"), el.get_attribute("name"), el.get_attribute("type")))
    print("BUTTONS:", [page.locator("button").nth(i).inner_text().strip()
                       for i in range(page.locator("button").count())])
    print("CONSOLE ERRORS:", errors[:10])
    page.screenshot(path="scripts/out/login.png", full_page=True)
    browser.close()
print("done")
