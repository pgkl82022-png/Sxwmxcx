# 本地运行、操作与恢复

需要 Node.js 24、Python 3。无 npm 依赖安装。OCR另需本机tesseract命令及中文模型，执行 bash scripts/setup-ocr.sh 下载官方Apache-2.0模型；不会调用收费API。

```sh
npm test
node scripts/check-miniprogram.js
python tests/xlsx_test.py
DEMO_MODE=true npm start
```

- 原演示：http://127.0.0.1:3000/
- 商家：http://127.0.0.1:3000/admin/
- 骑手：http://127.0.0.1:3000/rider/

演示选择角色后直接登录；全为测试身份。正式模式必须从环境注入 ADMIN_TOKEN、RIDER_TOKEN、CUSTOMER_TOKEN，禁止提交 .env；示例见 .env.example。不配置则随机生成但不输出令牌。禁止用 DEMO_MODE 暴露公网。环境变量没有自动读取 .env，使用平台环境设置或本地 shell 注入。

微信开发者工具导入仓库目录，读取 project.config.json。touristappid 仅结构占位，需换成主体授权 AppID 进行完整编译/预览。开发者工具本地联调需要临时关闭开发环境合法域名校验；提交前必须打开并配置合法HTTPS服务地址。模拟器可使用127.0.0.1，手机需配置可达的开发服务HTTPS地址。miniprogram/app.js 配置 baseURL。不得把本机HTTP服务当作正式微信服务。

顾客在小程序选择“顾客”，勾选演示隐私提示、连接、选品、填写虚构地址与测试号码、创建模拟订单和模拟付款。商家订单页依次配货和派给演示骑手；骑手选择“骑手”登录后取货、送达；异常可在骑手Web页反馈。商家可查看售后并确认模拟退款。

## 导入与Excel

CSV表头：名称,类别,品牌,规格,单位,采购价,售价,库存,条码。售价与采购价输入元，小数最多两位；接口存分。支持带引号的逗号与换行，最大1000条。后台可上传CSV、Excel(.xlsx)、PNG/JPEG照片（最大1.3MB）或粘贴，自定义表头用字段映射JSON。缺失cost/price/stock为待确认；名称/单位/负数/负毛利校验；重复商品保留审核，默认不自动合并。修正CSV重新预览完成失败重试，预览JSON含逐行错误，确认后报告成功/跳过数，导入保持下架。冲突处理当前采取跳过/改正后重试，尚无交互式合并编辑器。

Excel可以后台上传自动转换，也可以先在本地转换（不上传第三方）：

```sh
python scripts/xlsx_to_csv.py products.xlsx > products.csv
```

支持.xlsx第一个工作表、共享字符串、内联字符串、稀疏单元格；不支持.xls、宏、公式计算。请先将公式转数值。照片在本机Tesseract识别，所有OCR字段均待确认。识别可能错字，实测将“苹果”识别成“葵果”；系统仅返回文本，不自动入库。人工核对并整理为CSV后再生成草稿。语音可粘贴转写文本后整理CSV，尚无录音转写接口。

## 图片审核

在图片审核页选择商品，填候选JSON数组，如：

```json
[{"name":"阳光小番茄","spec":"500g / 盒","url":"https://你的已授权存储地址/photo.jpg","source":"门店自拍","license":"commercial","evidence":"门店原创照片记录2026-001"}]
```

需要匹配已知brand/barcode字段。授权证据由商家负责提供，程序不自动证明著作权。无许可、缺规格或不匹配不得应用。没有许可检索服务时不自动搜图；前台保留明确示意占位。

## 数据维护

先停服务再恢复或清理。数据默认 .data/，可通过 DATA_DIR 指定。

```sh
node scripts/maintenance.js init
node scripts/maintenance.js validate
node scripts/maintenance.js backup
CONFIRM_RESTORE=YES node scripts/maintenance.js restore .data/backup-时间.sqlite
CONFIRM_PURGE=YES node scripts/maintenance.js purge
```

SQLite事务保证单次业务状态写入；不支持多实例、跨进程并发和云端容灾。异常写入会回滚内存并返回失败，可用原幂等键重试。正式使用前必须适配云数据库和真实身份。恢复脚本执行SQLite完整性校验，仍需先用隔离目录演练。从早期JSON开发数据迁移可运行 node scripts/maintenance.js migrate-json 路径/state.json，要求目标数据库为空，原文件保留。清理工具清除90天前终结订单联系方式和地址簿，退款理由等自由文本仍需审核，不能声称自动完成全量个人信息清除。
