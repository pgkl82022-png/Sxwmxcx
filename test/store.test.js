import test from "node:test";
import assert from "node:assert/strict";
import { totals, normalizeCart, createOrder } from "../js/store.js";
test("空购物车、配送费和免配送费边界", () => {
  assert.deepEqual(totals({}), { subtotal: 0, shipping: 0, total: 0 });
  assert.deepEqual(totals({ carrot: 9 }), {
    subtotal: 5310,
    shipping: 600,
    total: 5910,
  });
  assert.deepEqual(totals({ carrot: 10 }), {
    subtotal: 5900,
    shipping: 0,
    total: 5900,
  });
});
test("非法购物车数据被过滤，数量最多99", () => {
  assert.deepEqual(
    normalizeCart({ tomato: 2, carrot: 1000, egg: -2, milk: 1.5, unknown: 1 }),
    { tomato: 2, carrot: 99 },
  );
  assert.deepEqual(normalizeCart(null), {});
});
test("下单快照、金额及无效输入", () => {
  const cart = { tomato: 2 },
    contact = { name: "测试用户", phone: "13800000000", address: "演示地址" };
  const order = createOrder(cart, contact, "test");
  cart.tomato = 10;
  contact.name = "修改";
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.total, 3180);
  assert.equal(order.contact.name, "测试用户");
  assert.throws(() => createOrder({}, contact, "empty"), /购物车为空/);
  assert.throws(
    () => createOrder({ egg: 1 }, { ...contact, name: " " }, "bad"),
    /完整填写/,
  );
  assert.throws(
    () => createOrder({ egg: 1 }, { ...contact, phone: "abc" }, "bad"),
    /联系电话/,
  );
});

test("分类、多个关键词与价格排序联动", async () => {
  const { filterProducts } = await import("../js/store.js");
  assert.deepEqual(filterProducts("时令水果", "蔬菜"), []);
  assert.equal(filterProducts("全部商品", " 新鲜蔬菜 500g ").length, 2);
  assert.equal(filterProducts("全部商品", "早餐")[0].id, "egg");
  assert.equal(filterProducts("全部商品", "", "price-up")[0].id, "carrot");
  assert.equal(filterProducts("全部商品", "", "price-down")[0].id, "shrimp");
});
test("订单仅允许顺序履约或接单前取消，兼容旧订单", async () => {
  const { transitionOrder, orderStatus } = await import("../js/store.js");
  const order = createOrder(
    { egg: 1 },
    { name: "演示", phone: "13800000000", address: "演示地址" },
    "flow",
  );
  assert.equal(order.status, "待接单");
  assert.throws(() => transitionOrder(order, "已完成"), /不能/);
  const preparing = transitionOrder(order, "备货中");
  assert.equal(order.status, "待接单");
  assert.throws(() => transitionOrder(preparing, "已取消"), /不能/);
  const done = transitionOrder(transitionOrder(preparing, "配送中"), "已完成");
  assert.throws(() => transitionOrder(done, "待接单"), /不能/);
  const cancelled = transitionOrder(order, "已取消");
  assert.throws(() => transitionOrder(cancelled, "备货中"), /不能/);
  assert.equal(orderStatus({ status: "演示订单 · 待配送" }), "待接单");
});

test("损坏存储记录不会破坏订单列表，旧订单可迁移", async () => {
  const { normalizeOrders } = await import("../js/store.js");
  const valid = createOrder(
    { egg: 1 },
    { name: "测试", phone: "13800000000", address: "虚构地址" },
    "valid",
  );
  assert.deepEqual(normalizeOrders(null), []);
  assert.equal(
    normalizeOrders([
      null,
      { ...valid, items: [null] },
      { ...valid, total: "100" },
      { ...valid, status: "演示订单 · 待配送" },
    ]).length,
    1,
  );
  assert.equal(
    normalizeOrders([{ ...valid, status: "演示订单 · 待配送" }])[0].status,
    "待接单",
  );
  assert.throws(
    () =>
      createOrder(
        { egg: 1 },
        { name: 2, phone: "13800000000", address: "地址" },
        "bad",
      ),
    /完整/,
  );
});
