import test from 'node:test';
import assert from 'node:assert/strict';
import {totals,normalizeCart,createOrder} from '../js/store.js';
test('空购物车、配送费和免配送费边界',()=>{
 assert.deepEqual(totals({}),{subtotal:0,shipping:0,total:0});
 assert.deepEqual(totals({carrot:9}),{subtotal:5310,shipping:600,total:5910});
 assert.deepEqual(totals({carrot:10}),{subtotal:5900,shipping:0,total:5900});
});
test('非法购物车数据被过滤，数量最多99',()=>{
 assert.deepEqual(normalizeCart({tomato:2,carrot:1000,egg:-2,milk:1.5,unknown:1}),{tomato:2,carrot:99});
 assert.deepEqual(normalizeCart(null),{});
});
test('下单快照、金额及无效输入',()=>{
 const cart={tomato:2},contact={name:'测试用户',phone:'13800000000',address:'演示地址'};
 const order=createOrder(cart,contact,'test');cart.tomato=10;contact.name='修改';
 assert.equal(order.items[0].quantity,2);assert.equal(order.total,3180);assert.equal(order.contact.name,'测试用户');
 assert.throws(()=>createOrder({},contact,'empty'),/购物车为空/);
 assert.throws(()=>createOrder({egg:1},{...contact,name:' '},'bad'),/完整填写/);
 assert.throws(()=>createOrder({egg:1},{...contact,phone:'abc'},'bad'),/联系电话/);
});
