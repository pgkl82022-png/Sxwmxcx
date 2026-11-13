# 数据模型与生产迁移边界

当前落地数据库为 .data/shop.sqlite (schema_version=1)，使用Node内置SQLite。下表所有本地表均已创建，数据以受JSON有效性约束的载荷保存，订单有顾客/幂等键唯一索引；库存、SKU、支付、订单行等为业务状态的事务内投影。下一阶段需改为规范化列和条件库存SQL，不能将当前单进程实现部署成多实例。生产微信云端集合未配置。

|集合|关键字段与索引|访问约束|
|---|---|---|
|users|id/openid 唯一、createdAt、deletedAt|本人只读，服务端身份写入|
|roles|userId/storeId/role 唯一|仅管理员服务端管理|
|stores|id、name、address、phone、hours|公开摘要，后台更新|
|categories|storeId、name、sort|公开读，管理员写|
|products|id/storeId/name/category/brand/spec/barcode/active/image|顾客仅在售字段，成本仅管理员|
|product_skus|id/productId/unit/price/estimatedWeight|价格服务端复核|
|inventory|skuId 唯一、available/reserved/version|条件更新与事务|
|addresses|id/userId/area/contact|本人访问|
|orders|id/userId/status/total/expiresAt/key|userId+key 唯一，本人或授权角色|
|order_items|orderId/skuId/price/quantity/name|不可变结算快照|
|payments|orderId/providerTransactionId/status/amount|交易号唯一，仅服务端验签写|
|refunds|id/orderId/amount/reason/status/providerRefundId|退款号唯一，需授权|
|deliveries|orderId/riderId/status/exception/history|仅授权骑手与管理员|
|riders|userId/storeId/active|服务端授权|
|store_settings|storeId/minimum/shipping/freeShipping/areas/slots|管理员写|
|ai_jobs|id/status/source/rows/report/createdAt|管理员访问|
|ai_candidates|id/productId/source/license/evidence/score/reasons/status|管理员审核|
|audit_logs|id/actor/action/target/at|只追加，生产需外置不可篡改归档|

当前 products 内嵌库存，orders 内嵌订单行与模拟支付；AI草稿、图片候选、异常、退款、地址、审计已落地本地状态。本地users/roles为演示身份，门店/SKU/分类/库存/订单行/支付为保存时投影，P6需真实身份和云端迁移实现。生产必须增加用户、门店、订单状态、超时订单、审计时间的索引。

上线前验证数据库规则：顾客不能直写库存/订单金额/支付状态；骑手只能读取已分配任务必要联系方式；管理员校验门店权限。存储路径按门店与上传者隔离，限制 MIME/大小，私密凭证不可公开下载；所有正式写入仅从业务服务发起。备份加密与恢复演练后再引入真实个人数据。
