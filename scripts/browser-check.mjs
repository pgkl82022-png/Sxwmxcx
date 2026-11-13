// Run with PLAYWRIGHT_MODULE pointing to an installed playwright ESM module.
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3000");
    const fits = async () =>
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width}`,
      );
    await fits();
    assert.equal(await page.locator(".product").count(), 8);
    await page.locator('[data-category="时令水果"]').click();
    assert.equal(await page.locator(".product").count(), 2);
    await page.locator("#search").fill("蔬菜");
    assert.equal(await page.locator(".product").count(), 0);
    await page.locator("#reset-search").click();
    await page.locator("#sort").selectOption("price-up");
    assert.match(await page.locator(".product").first().innerText(), /胡萝卜/);
    await page.locator('[data-add="tomato"]').click();
    await page.locator('[data-add="tomato"]').click();
    await page.locator('nav [data-view="cart"]').click();
    await fits();
    assert.match(await page.locator("#summary").innerText(), /31.80/);
    await page.locator('[data-change="tomato"][data-delta="-1"]').click();
    await page.reload();
    assert.equal(await page.locator("#count").innerText(), "1");
    await page.locator('nav [data-view="cart"]').click();
    await page.locator('[name="name"]').fill("演示顾客");
    await page.locator('[name="phone"]').fill("13800000000");
    await page.locator('[name="address"]').fill("虚构地址一号");
    await page.locator("#order-form button").click();
    await page.locator("#orders").waitFor({ state: "visible" });
    await fits();
    assert.equal(await page.locator("#count").innerText(), "0");
    assert.match(await page.locator("#order-list").innerText(), /待接单/);
    await page.locator('nav [data-view="merchant"]').click();
    await fits();
    for (const name of ["接单并备货", "模拟发货", "标记送达"])
      await page.getByRole("button", { name, exact: true }).click();
    await page.locator("#merchant-filter").selectOption("待接单");
    assert.equal(await page.locator("#merchant-list .order").count(), 0);
    await page.locator('nav [data-view="orders"]').click();
    assert.match(await page.locator("#order-list").innerText(), /已完成/);
    await page.reload();
    await page.locator('nav [data-view="orders"]').click();
    assert.match(await page.locator("#order-list").innerText(), /已完成/);
    await page.locator('nav [data-view="shop"]').click();
    await page.locator('[data-add="egg"]').click();
    await page.locator('nav [data-view="cart"]').click();
    await page.locator('[name="name"]').fill("取消演示");
    await page.locator('[name="phone"]').fill("13800000000");
    await page.locator('[name="address"]').fill("虚构地址");
    await page.locator("#order-form button").click();
    await page
      .locator("#order-list")
      .getByRole("button", { name: "取消演示订单" })
      .click();
    assert.match(await page.locator("#order-list").innerText(), /已取消/);
    await page.locator('nav [data-view="shop"]').click();
    await page.locator('[data-add="egg"]').click();
    await page.locator('nav [data-view="cart"]').click();
    page.once("dialog", (d) => d.accept());
    await page.locator("#clear-cart").click();
    assert.equal(await page.locator("#count").innerText(), "0");
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${width}px: filters, sorting, cart, persistence, checkout, merchant lifecycle, cancellation, clear, layout, no JS errors`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
