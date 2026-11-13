import {
  products,
  money,
  normalizeCart,
  totals,
  createOrder,
  filterProducts,
  orderStatus,
  transitionOrder,
  normalizeOrders,
} from "./store.js";
const $ = (id) => document.getElementById(id),
  key = "qinghe-market-v1";
let saved;
try {
  saved = JSON.parse(localStorage.getItem(key));
} catch {
  saved = null;
}
let cart = normalizeCart(saved?.cart),
  orders = normalizeOrders(saved?.orders),
  category = "全部商品",
  timer;
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => $("toast").classList.remove("show"), 2500);
}
function save(nextCart, nextOrders) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ cart: nextCart, orders: nextOrders }),
    );
    cart = nextCart;
    orders = nextOrders;
    return true;
  } catch {
    toast("浏览器存储不可用或已满，请释放空间后重试");
    return false;
  }
}
function show(view) {
  for (const v of ["shop", "cart", "orders", "merchant"])
    $(v).hidden = v !== view;
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function catalog() {
  $("categories").innerHTML = [
    "全部商品",
    ...new Set(products.map((p) => p.category)),
  ]
    .map(
      (c) =>
        `<button data-category="${c}" class="${c === category ? "selected" : ""}" aria-pressed="${c === category}">${c}</button>`,
    )
    .join("");
  const list = filterProducts(category, $("search").value, $("sort").value);
  $("results").textContent = `${category} · 找到 ${list.length} 款商品`;
  $("products").innerHTML = list.length
    ? list
        .map(
          (p) =>
            `<article class="product"><div class="art" style="background:${p.color}"><small class="tag">${p.tag}</small><span role="img" aria-label="${p.name}">${p.emoji}</span></div><div class="info"><h3>${p.name}</h3><p>${p.unit}${cart[p.id] ? ` · 已选 ${cart[p.id]} 件` : ""}</p><div class="price"><strong>${money(p.price)}</strong><button ${cart[p.id] >= 99 ? "disabled" : ""} data-add="${p.id}" aria-label="添加${p.name}到购物车">+</button></div></div></article>`,
        )
        .join("")
    : '<p class="empty">没有找到相关商品，换个关键词试试。</p>';
}
function render() {
  $("count").textContent = Object.values(cart).reduce((a, b) => a + b, 0);
  const items = products.filter((p) => cart[p.id]);
  $("cart-items").innerHTML = items.length
    ? items
        .map(
          (p) =>
            `<article class="cart-row"><span class="mini-art">${p.emoji}</span><div class="cart-name"><h3>${p.name}</h3><small>${p.unit} · ${money(p.price)}</small></div><div class="quantity"><button data-change="${p.id}" data-delta="-1" aria-label="减少${p.name}数量">−</button><span>${cart[p.id]}</span><button data-change="${p.id}" data-delta="1" aria-label="增加${p.name}数量" ${cart[p.id] >= 99 ? "disabled" : ""}>+</button></div><strong>${money(p.price * cart[p.id])}</strong><button class="remove" data-remove="${p.id}">移除</button></article>`,
        )
        .join("")
    : '<div class="empty">🛒<h2>购物车还是空的</h2><p>去挑选今天的新鲜好物吧。</p><button class="primary" data-view="shop">去逛逛</button></div>';
  $("checkout").hidden = !items.length;
  const t = totals(cart);
  $("summary").innerHTML =
    `<span>商品金额 <b>${money(t.subtotal)}</b></span><span>配送费 <b>${money(t.shipping)}</b></span><span>合计 <b>${money(t.total)}</b></span>`;
  $("shipping-tip").textContent = !items.length
    ? ""
    : t.subtotal < 5900
      ? `再选 ${money(5900 - t.subtotal)} 免配送费（当前配送费 ¥6.00）`
      : "已享受免配送费";
  $("clear-cart").hidden = !items.length;
  $("order-list").innerHTML = orders.length
    ? orders.map((o) => orderCard(o, false)).join("")
    : '<div class="empty"><h2>还没有订单</h2><button class="primary" data-view="shop">选购商品</button></div>';
  const active = orders.filter(
    (o) => !["已完成", "已取消"].includes(orderStatus(o)),
  );
  $("merchant-stats").innerHTML =
    `<span>全部订单 <b>${orders.length}</b></span><span>待处理 <b>${active.length}</b></span><span>有效模拟金额 <b>${money(orders.filter((o) => orderStatus(o) !== "已取消").reduce((n, o) => n + o.total, 0))}</b></span>`;
  const filtered = orders.filter(
    (o) =>
      $("merchant-filter").value === "全部" ||
      orderStatus(o) === $("merchant-filter").value,
  );
  $("merchant-list").innerHTML = filtered.length
    ? filtered.map((o) => orderCard(o, true)).join("")
    : '<p class="empty">当前状态暂无订单。可先去购物车提交一笔演示订单。</p>';
  catalog();
}
function orderCard(o, merchant) {
  const status = orderStatus(o),
    next = { 待接单: "备货中", 备货中: "配送中", 配送中: "已完成" }[status];
  const action = (target, label) =>
    `<button class="primary" data-order="${esc(o.id)}" data-status="${target}">${label}</button>`;
  return `<article class="order"><div class="order-heading"><strong>订单 ${esc(o.id)}</strong><span>${status}</span></div><p class="muted">${esc(new Date(o.date).toLocaleString("zh-CN"))}</p>${o.items.map((i) => `<div class="order-item"><span>${esc(i.name)} × ${esc(i.quantity)}</span><b>${money(i.price * i.quantity)}</b></div>`).join("")}<p>收货人：${esc(o.contact.name)} · ${esc(o.contact.phone)}<br>配送地址：${esc(o.contact.address)}</p><div class="order-total">含配送费 ${money(o.shipping)} · 模拟合计 <strong>${money(o.total)}</strong></div><div class="order-actions">${merchant && next ? action(next, { 备货中: "接单并备货", 配送中: "模拟发货", 已完成: "标记送达" }[next]) : ""}${status === "待接单" ? action("已取消", "取消演示订单") : ""}</div></article>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.view) show(b.dataset.view);
  if (b.id === "clear-cart" && confirm("确定清空购物车？")) {
    save({}, orders);
    render();
  }
  if (b.id === "reset-search") {
    category = "全部商品";
    $("search").value = "";
    $("sort").value = "default";
    catalog();
  }
  if (b.dataset.order) {
    try {
      const next = orders.map((o) =>
        o.id === b.dataset.order ? transitionOrder(o, b.dataset.status) : o,
      );
      if (save(cart, next)) {
        render();
        toast("演示订单状态已更新");
      }
    } catch (err) {
      toast(err.message);
    }
  }
  if (b.dataset.category) {
    category = b.dataset.category;
    catalog();
  }
  const id = b.dataset.add || b.dataset.change || b.dataset.remove;
  if (id && products.some((p) => p.id === id)) {
    const next = { ...cart };
    next[id] = b.dataset.remove
      ? 0
      : Math.min(
          99,
          Math.max(
            0,
            (cart[id] || 0) + (b.dataset.add ? 1 : Number(b.dataset.delta)),
          ),
        );
    if (!next[id]) delete next[id];
    if (save(next, orders)) {
      render();
      if (b.dataset.add) toast("已加入购物车");
    }
  }
});
$("search").addEventListener("input", catalog);
$("sort").addEventListener("change", catalog);
$("merchant-filter").addEventListener("change", render);
$("order-form").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const order = createOrder(
      cart,
      Object.fromEntries(new FormData(e.target)),
      "QH-" + crypto.randomUUID(),
    );
    if (save({}, [order, ...orders])) {
      e.target.reset();
      show("orders");
      toast("演示订单已提交，未发生真实扣款");
    }
  } catch (err) {
    toast(err.message);
  }
});
catalog();
render();
