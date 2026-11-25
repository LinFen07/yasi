"""在管理端「试卷新增」里录一份新试卷，包含：
  - 题库中最新的填空题（Skill Test Sample 整批，2026-09-29 录入）
  - 两条带「一题多空 / groupGap」的填空题（id 327、390）

选行不靠题干文字，而是拦截 /api/admin/question/page 的响应，
按 questionId 精确定位表格行，避免同名/换行导致误选。
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.environ.get("YASI_ADMIN_BASE", "http://localhost:8002")
USER = os.environ.get("YASI_ADMIN_USER", "")
PWD = os.environ.get("YASI_ADMIN_PASS", "")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

PAPER_NAME = os.environ.get("YASI_PAPER_NAME", "一题多空验证卷-" + time.strftime("%Y%m%d"))
SUGGEST_TIME = os.environ.get("YASI_PAPER_TIME", "40")

# 模块 -> Part -> 要收录的题目 id
PLAN = {
    ("listening", 1): [362],
    ("listening", 2): [327, 361],
    ("listening", 3): [368],
    ("listening", 4): [336],
    ("reading", 1): [325, 337],
    ("reading", 2): [340, 341],
    ("reading", 3): [386, 390],
}
# 这些题的来源试卷名（用于在弹窗里缩小范围）
SOURCE_PAPER = {
    362: "3剑雅9", 368: "3剑雅9", 386: "3剑雅9", 390: "3剑雅9",
    327: "2剑雅9", 361: "2剑雅9", 336: "2剑雅9",
    325: "2剑雅9", 337: "2剑雅9", 340: "2剑雅9", 341: "2剑雅9",
}


def log(*a):
    print(*a, flush=True)


def shot(page, name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=True)
    log("   [shot]", path)


def login(page):
    page.goto(BASE + "/login", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    page.fill('input[name="userName"]', USER)
    page.fill('input[name="password"]', PWD)
    page.click("button.login-btn")
    page.wait_for_timeout(2500)
    token = page.evaluate("() => localStorage.getItem('adminToken')")
    if not token:
        raise RuntimeError("登录失败")
    log("[ok] 登录成功")


def pick_select(page, root_locator, option_text):
    """在指定 el-select 下选择 option_text。"""
    root_locator.locator(".el-select").click()
    page.wait_for_timeout(400)
    page.locator(".el-select-dropdown__item:visible", has_text=option_text).first.click()
    page.wait_for_timeout(500)


def select_value(page, label):
    """取 el-select 当前选中项的文本（读内部 input 的 value）。"""
    item = page.locator(".paper-form .el-form-item").filter(has_text=label).first
    return item.locator("input").first.input_value().strip()


def fill_form(page):
    page.locator(".paper-form .el-form-item:has-text('试卷名称') input").first.fill(PAPER_NAME)
    page.locator(".paper-form .el-form-item:has-text('建议时长') input").first.fill(SUGGEST_TIME)
    page.wait_for_timeout(300)

    # 年级 / 学科：页面默认已按默认学科回填；仅在确实为空时补选。
    # 注意顺序：先选年级再选学科（选年级会清空学科，反之会按学科回填年级）。
    level = select_value(page, "年级")
    subject = select_value(page, "学科")
    log("   年级:", level or "(空)", "| 学科:", subject or "(空)",
        "| 类型:", select_value(page, "试卷类型"))
    if not level:
        pick_select(page, page.locator(".paper-form .el-form-item").filter(has_text="年级").first, "大学")
        log("   手动选择年级: 大学")
    if not subject:
        pick_select(page, page.locator(".paper-form .el-form-item").filter(has_text="学科").first, "雅思英语")
        log("   手动选择学科: 雅思英语")
    page.wait_for_timeout(500)


def open_add_dialog(page, module_theme, part_no, source_paper):
    """切到模块/Part，点「添加题目」打开选题弹窗并按来源试卷名过滤。"""
    tab_text = "听力" if module_theme == "listening" else "阅读"
    page.locator(".module-tabs .el-tabs__item", has_text=tab_text).first.click()
    page.wait_for_timeout(800)

    part_cls = ".listening-part-tab" if module_theme == "listening" else ".reading-part-tab"
    label = ("Part %d" % part_no) if module_theme == "listening" else ("Passage %d" % part_no)
    page.locator(part_cls, has_text=label).first.click()
    page.wait_for_timeout(800)

    panel = (".listening-part-panel" if module_theme == "listening" else ".reading-part-panel")
    add_btn = page.locator(panel + " button", has_text="添加题目").first
    add_btn.click()
    page.wait_for_timeout(1200)

    dlg = page.locator(".question-select-dialog")
    dlg.wait_for(state="visible", timeout=10000)
    # 试卷名称过滤
    dlg.locator(".question-search-form .el-form-item:has-text('试卷名称') input").first.fill(source_paper)
    # 题型过滤：填空题
    pick_select(page, dlg.locator(".question-search-form .el-form-item:has-text('题型')"), "填空题")
    dlg.locator("button", has_text="查询").first.click()
    page.wait_for_timeout(1500)
    return dlg


def main():
    if not USER or not PWD:
        sys.exit("需要 YASI_ADMIN_USER / YASI_ADMIN_PASS")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1680, "height": 1000})
        captured = []

        def on_response(resp):
            if "/api/admin/question/page" in resp.url:
                try:
                    captured.append(resp.json())
                except Exception:
                    pass

        page.on("response", on_response)
        page.on("pageerror", lambda e: log("[pageerror]", e))

        try:
            login(page)
            page.goto(BASE + "/#/exam/paper/add", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)
            log("[step] 打开试卷新增页:", page.url)

            fill_form(page)
            shot(page, "paper-01-form.png")

            for (theme, part_no), qids in PLAN.items():
                log(f"[step] {theme} Part{part_no} -> 题目 {qids}")
                # 同一 Part 内可能来自不同来源试卷（el-table 换数据会清空勾选，所以分轮选）
                groups = {}
                for qid in qids:
                    groups.setdefault(SOURCE_PAPER[qid], []).append(qid)
                for source, group_ids in groups.items():
                    captured.clear()
                    dlg = open_add_dialog(page, theme, part_no, source)
                    page.wait_for_timeout(800)
                    if not captured:
                        raise RuntimeError("没有抓到题目分页响应")
                    rows = (captured[-1].get("response") or {}).get("list") or []
                    log("   弹窗可选行:", [(r.get("id"), (r.get("shortTitle") or "")[:16]) for r in rows])
                    table_rows = page.locator(".question-select-table .el-table__body-wrapper tbody tr")
                    for qid in group_ids:
                        idx = next((i for i, r in enumerate(rows) if r.get("id") == qid), None)
                        if idx is None:
                            log(f"   !! 弹窗里找不到 id={qid}，跳过")
                            continue
                        table_rows.nth(idx).locator(".el-checkbox__inner").click()
                        page.wait_for_timeout(250)
                        log(f"   已勾选 id={qid} row#{idx} | {rows[idx].get('shortTitle', '')[:30]}")
                    shot(page, f"paper-02-dialog-{theme}-p{part_no}-{source}.png")
                    page.locator(".question-select-dialog .dialog-footer button", has_text="确 定").click()
                    page.wait_for_timeout(2000)
                    added = page.locator(
                        (".listening-part-panel" if theme == "listening" else ".reading-part-panel")
                        + " .question-item").count()
                    log(f"   当前 Part 已有题目数: {added}")

            shot(page, "paper-03-before-save.png")
            page.locator(".form-actions button", has_text="保存").first.click()
            page.wait_for_timeout(4000)
            shot(page, "paper-04-after-save.png")
            log("[step] 保存后 URL:", page.url)

            msgs = page.locator(".el-message")
            for i in range(msgs.count()):
                log("   提示:", msgs.nth(i).inner_text().strip())
            errs = page.locator(".el-form-item__error")
            for i in range(errs.count()):
                log("   校验错误:", errs.nth(i).inner_text().strip())

            # 读取最新试卷并校验内容
            token = page.evaluate("() => localStorage.getItem('adminToken')")
            res = page.evaluate(
                """async ([token]) => {
                    const r = await fetch('/api/admin/exam/paper/page', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
                        body: JSON.stringify({name: null, paperType: null, pageIndex: 1, pageSize: 5})
                    })
                    return await r.text()
                }""", [token])
            papers = json.loads(res).get("response") or {}
            log("   最新试卷:")
            for x in (papers.get("list") or [])[:5]:
                log("     -", x.get("id"), x.get("name"), "| create", x.get("createTime"))
            newest = (papers.get("list") or [None])[0]
            if newest:
                detail = page.evaluate(
                    """async ([token, id]) => {
                        const r = await fetch('/api/admin/exam/paper/select/' + id, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
                        })
                        return await r.text()
                    }""", [token, newest.get("id")])
                open(os.path.join(OUT, "new-paper-detail.json"), "w", encoding="utf-8").write(detail)
                d = json.loads(detail).get("response") or {}
                log("   试卷详情:", d.get("id"), d.get("name"), "| level", d.get("level"),
                    "| subject", d.get("subjectId"), "| suggest", d.get("suggestTime"))
                for ti in (d.get("titleItems") or []):
                    items = ti.get("questionItems") or []
                    log("     模块", ti.get("moduleType"), "part", ti.get("partNo"), "题数", len(items),
                        [i.get("id") for i in items])
        finally:
            shot(page, "paper-99-final.png")
            browser.close()


if __name__ == "__main__":
    main()
