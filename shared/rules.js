export function check(ok,message){if(!ok)throw new Error(message);}
export function integer(n,min=0,max=100000000){check(Number.isSafeInteger(n)&&n>=min&&n<=max,'数值必须为范围内整数');return n;}
export function quote(items,settings){const subtotal=items.reduce((n,i)=>n+integer(i.price)*integer(i.quantity,1,99),0);check(subtotal>=settings.minimum,'未达到起送金额');const shipping=subtotal>=settings.freeShipping?0:settings.shipping;return {subtotal,shipping,total:subtotal+shipping};}
export function suggestedPrice(cost,margin){integer(cost,1);check(Number.isFinite(margin)&&margin>=0&&margin<0.9,'毛利率应在0至90%之间');return Math.ceil(cost/(1-margin)-1e-9);}
export function convertWeight(value,from,to){const units={斤:500,公斤:1000,g:1};check(units[from]&&units[to]&&Number.isFinite(value)&&value>=0,'不支持的计量单位');return value*units[from]/units[to];}
