import {check} from '../shared/rules.js';
// 外部供应商必须由部署方显式注入。没有网络实现，不会产生费用。
export class ModelGateway {
 constructor({providers=[],budget=0,limit=10,timeout=5000}={}){this.providers=providers;this.budget=budget;this.limit=limit;this.timeout=timeout;this.used=0;this.calls=[];}
 async generate({prompt,containsPersonalData=false,estimatedCost=0}){check(!containsPersonalData,'禁止向模型发送顾客个人信息');check(typeof prompt==='string'&&prompt.length<=10000,'模型输入无效');check(Number.isFinite(estimatedCost)&&estimatedCost>=0,'预算无效');check(this.used+estimatedCost<=this.budget,'模型预算不足');this.calls=this.calls.filter(t=>Date.now()-t<60000);check(this.calls.length<this.limit,'模型调用频率超限');check(this.providers.length>0,'未配置已授权模型，使用本地规则模式');this.calls.push(Date.now());this.used+=estimatedCost;for(const provider of this.providers){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),this.timeout);try{return await Promise.race([provider.generate({prompt,signal:controller.signal}),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('模型超时')),{once:true}))]);}catch(e){if(provider===this.providers.at(-1))throw e;}finally{clearTimeout(timeout);}}}
}
