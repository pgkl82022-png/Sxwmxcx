export const products = [
 ['tomato','阳光小番茄','新鲜蔬菜','500g / 盒',1290,'🍅','#f9e9df','当季推荐'],
 ['broccoli','鲜嫩西兰花','新鲜蔬菜','约400g / 颗',890,'🥦','#e8eedc','田园鲜采'],
 ['orange','阳光甜橙','时令水果','1kg / 袋',1990,'🍊','#fff0d8','清甜多汁'],
 ['avocado','绵密牛油果','时令水果','2枚 / 份',1690,'🥑','#edf0dd','营养之选'],
 ['shrimp','鲜冻白虾','海鲜水产','400g / 盒',3990,'🦐','#f8e9e4','鲜美好味'],
 ['egg','农场鲜鸡蛋','肉禽蛋奶','10枚 / 盒',1590,'🥚','#f4eddf','早餐搭档'],
 ['milk','原味纯牛奶','肉禽蛋奶','950ml / 瓶',1490,'🥛','#e7edf0','醇香日常'],
 ['carrot','脆甜胡萝卜','新鲜蔬菜','500g / 份',590,'🥕','#faeedc','家常好菜']
].map(([id,name,category,unit,price,emoji,color,tag])=>({id,name,category,unit,price,emoji,color,tag}));
export const money = n => '¥'+(n/100).toFixed(2);
export function normalizeCart(value) { return Object.fromEntries(products.map(p=>[p.id,Math.min(99,Math.max(0,Number.isInteger(value?.[p.id])?value[p.id]:0))]).filter(([,n])=>n>0)); }
export function totals(cart) { const subtotal=products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0);const shipping=subtotal>0&&subtotal<5900?600:0;return {subtotal,shipping,total:subtotal+shipping}; }
export function createOrder(cart,contact,id,date=new Date().toISOString()) {
 const clean=normalizeCart(cart);
 const items=products.filter(p=>clean[p.id]).map(p=>({name:p.name,price:p.price,quantity:clean[p.id]}));
 if(!items.length)throw new Error('购物车为空');
 for(const key of ['name','phone','address'])if(!contact[key]?.trim())throw new Error('请完整填写配送信息');
 if(!/^[0-9+() -]{6,20}$/.test(contact.phone))throw new Error('请填写有效的联系电话');
 return {id,date,items,contact:{...contact},...totals(clean),status:'演示订单 · 待配送'};
}
