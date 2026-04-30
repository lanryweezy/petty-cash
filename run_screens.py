import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Screenshot Login
        await page.goto("http://localhost:5000/login")
        await page.screenshot(path="login_ui.png", full_page=True)

        # Login
        await page.fill("#username", "admin")
        await page.fill("#password", "admin123")
        await page.click("button[type=submit]")

        # Screenshot Dashboard
        await page.wait_for_timeout(1000)
        await page.screenshot(path="dashboard_ui.png", full_page=True)

        # Screenshot Create Request
        await page.goto("http://localhost:5000/create_request")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="create_request_ui.png", full_page=True)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
