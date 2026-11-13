export const products = [
  [
    "tomato",
    "阳光小番茄",
    "新鲜蔬菜",
    "500g / 盒",
    1290,
    "🍅",
    "#f9e9df",
    "当季推荐",
  ],
  [
    "broccoli",
    "鲜嫩西兰花",
    "新鲜蔬菜",
    "约400g / 颗",
    890,
    "🥦",
    "#e8eedc",
    "田园鲜采",
  ],
  [
    "orange",
    "阳光甜橙",
    "时令水果",
    "1kg / 袋",
    1990,
    "🍊",
    "#fff0d8",
    "清甜多汁",
  ],
  [
    "avocado",
    "绵密牛油果",
    "时令水果",
    "2枚 / 份",
    1690,
    "🥑",
    "#edf0dd",
    "营养之选",
  ],
  [
    "shrimp",
    "鲜冻白虾",
    "海鲜水产",
    "400g / 盒",
    3990,
    "🦐",
    "#f8e9e4",
    "鲜美好味",
  ],
  [
    "egg",
    "农场鲜鸡蛋",
    "肉禽蛋奶",
    "10枚 / 盒",
    1590,
    "🥚",
    "#f4eddf",
    "早餐搭档",
  ],
  [
    "milk",
    "原味纯牛奶",
    "肉禽蛋奶",
    "950ml / 瓶",
    1490,
    "🥛",
    "#e7edf0",
    "醇香日常",
  ],
  [
    "carrot",
    "脆甜胡萝卜",
    "新鲜蔬菜",
    "500g / 份",
    590,
    "🥕",
    "#faeedc",
    "家常好菜",
  ],
].map(([id, name, category, unit, price, emoji, color, tag]) => ({
  id,
  name,
  category,
  unit,
  price,
  emoji,
  color,
  tag,
}));
export const money = (n) => "¥" + (n / 100).toFixed(2);
export function normalizeCart(value) {
  return Object.fromEntries(
    products
      .map((p) => [
        p.id,
        Math.min(
          99,
          Math.max(0, Number.isInteger(value?.[p.id]) ? value[p.id] : 0),
        ),
      ])
      .filter(([, n]) => n > 0),
  );
}
export function totals(cart) {
  const subtotal = products.reduce(
    (sum, p) => sum + p.price * (cart[p.id] || 0),
    0,
  );
  const shipping = subtotal > 0 && subtotal < 5900 ? 600 : 0;
  return { subtotal, shipping, total: subtotal + shipping };
}
export function createOrder(
  cart,
  contact,
  id,
  date = new Date().toISOString(),
) {
  const clean = normalizeCart(cart);
  const items = products
    .filter((p) => clean[p.id])
    .map((p) => ({ name: p.name, price: p.price, quantity: clean[p.id] }));
  if (!items.length) throw new Error("购物车为空");
  for (const key of ["name", "phone", "address"])
    if (typeof contact?.[key] !== "string" || !contact[key].trim())
      throw new Error("请完整填写配送信息");
  if (contact.name.trim().length > 30 || contact.address.trim().length > 150)
    throw new Error("配送信息超出长度限制");
  if (!/^[0-9+() -]{6,20}$/.test(contact.phone))
    throw new Error("请填写有效的联系电话");
  return {
    id,
    date,
    items,
    contact: {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      address: contact.address.trim(),
    },
    ...totals(clean),
    status: "待接单",
  };
}

export const orderStatuses = ["待接单", "备货中", "配送中", "已完成", "已取消"];
export function filterProducts(
  category = "全部商品",
  query = "",
  sort = "default",
) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter(
    (p) =>
      (category === "全部商品" || p.category === category) &&
      words.every((w) =>
        `${p.name} ${p.category} ${p.tag} ${p.unit}`.toLowerCase().includes(w),
      ),
  );
  return sort === "price-up"
    ? list.sort((a, b) => a.price - b.price)
    : sort === "price-down"
      ? list.sort((a, b) => b.price - a.price)
      : list;
}
export function orderStatus(order) {
  return orderStatuses.includes(order.status) ? order.status : "待接单";
}
export function transitionOrder(order, status) {
  const current = orderStatus(order);
  const allowed = {
    待接单: ["备货中", "已取消"],
    备货中: ["配送中"],
    配送中: ["已完成"],
  };
  if (!allowed[current]?.includes(status))
    throw new Error("当前订单不能执行此操作");
  return { ...order, status };
}

export function normalizeOrders(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (o) =>
        o &&
        typeof o.id === "string" &&
        Number.isFinite(Date.parse(o.date)) &&
        o.contact &&
        ["name", "phone", "address"].every(
          (k) => typeof o.contact[k] === "string",
        ) &&
        ["subtotal", "shipping", "total"].every(
          (k) => Number.isSafeInteger(o[k]) && o[k] >= 0,
        ) &&
        Array.isArray(o.items) &&
        o.items.length &&
        o.items.every(
          (i) =>
            i &&
            typeof i.name === "string" &&
            Number.isSafeInteger(i.price) &&
            i.price >= 0 &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0 &&
            i.quantity <= 99,
        ),
    )
    .map((o) => ({ ...o, status: orderStatus(o) }));
}
