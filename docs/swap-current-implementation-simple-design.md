# Swap（OpenOcean）当前实现技术设计方案

## 1. 文档目标

- 说明当前代码已落地的 Swap 后端技术方案（基于 `server-service-boilerplate`）。
- 给出接口、数据、缓存、同步任务和错误处理的实际行为。
- 标注与题目目标的对齐情况和后续优化方向。

## 2. 设计范围

- 渠道商：当前仅接入 `openocean`。
- 业务流程：支持网络、Token 列表、单渠道询价、多渠道并发询价、构建交易（不广播）。
- 存储与缓存：MongoDB（Network/Token）、Redis（查询缓存与对象缓存）。
- 定时任务：OpenOcean Token 同步任务（Bull）。

## 3. 系统模块与职责

- `SwapController`：对外 API 聚合层，负责参数标准化、缓存刷新分支、结果聚合。
- `GasController`：Gas 能力接口层，提供 gas 估算与 gas price 档位数据。
- `ProviderManager`：渠道路由层，屏蔽具体 adapter 细节，提供统一 `getNetworks/getTokenList/quote/buildTx`。
- `OpenOceanAdapter`：第三方 API 适配层，负责请求封装、超时重试、响应标准化、错误映射。
- `TokenService`：Token 数据访问层，负责 DB 查询、分页、Redis Cache-Aside、缓存失效。
- `NetworkService`：Network 数据访问层，负责 DB 查询与缓存读写。
- `chain/evm + chain/indexer`：链级工具层，负责 RPC 费率获取、gas 估算、unsignedTx 构建与链类型判断。
- `OpenOceanSchedule`：定时全链 Token 同步任务。
- `DefaultErrorFilter + ResponseWrapperMiddleware`：统一响应与统一异常输出。
- `base/reply`：统一响应格式。
- `cache/redis`：Redis 缓存 key 与 payload 定义。

### 3.1 目录结构说明（核心）

- `src/app`
- API 控制器入口（`swap.controller.ts`、`gas.controller.ts`）。
- `src/thirdparty/swap`
- 渠道抽象与路由（`provider-manager.ts`、`provider.interface.ts`、`provider.errors.ts`）。
- `src/thirdparty/swap/providers/openocean`
- OpenOcean 适配实现（network/token/quote/buildTx + 重试/错误映射）。
- `src/entity/networks`
- Network 持久化模型与查询服务。
- `src/entity/token`
- Token 持久化模型与分页查询服务。
- `src/schedule`
- 定时任务（`openocean.schedule.ts`）。
- `src/chain`
- 链级工具（gas/fee/unsignedTx）。
- `src/cache`
- Redis 缓存读写封装与 key 约定。
- `src/filter`、`src/middleware`
- 全局异常处理与统一响应包装。

## 4. 核心数据模型

### 4.1 Network（Mongo: `Network`）

- 主字段：`provider`, `chainCode`, `chainName`, `chainId`, `nativeTokenAddress`, `isActive`, `metadata`, `syncedAt`。
- 关键索引：
- unique(`provider`, `chainCode`)
- index(`provider`, `chainId`)
- index(`provider`, `syncedAt`)
- 说明：`chainId` 已支持空值（兼容 `sol/sui` 等非 EVM 链）。

### 4.2 Token（Mongo: `Token`）

- 主字段：`provider`, `chainCode`, `address`, `symbol`, `name`, `decimals`, `logoURI`, `isActive`, `raw`, `syncedAt`。
- 关键索引：
- unique(`provider`, `chainCode`, `address`)
- index(`provider`, `chainCode`, `symbol`)
- index(`provider`, `syncedAt`)
- 说明：`address` 统一小写，`raw` 保留上游原始字段。

## 5. API 设计与处理流程

### 5.1 `GET /swap/networks`

- `refresh=false`：优先读取 Redis 网络缓存；命中直接返回。
- 未命中或 `refresh=true`：拉取 provider 网络列表并同步到 DB，再回写 Redis。
- provider 为空时会汇总所有已注册 provider 的网络。

### 5.2 `GET /swap/tokens`

- `refresh=true`：直接向 provider 拉 Token 列表，仅返回，不写 DB（实时视图）。
- `refresh=false`：
- 先判断本地 Token 缓存是否过期（按 `count + latestSyncedAt`）。
- 需要时触发按链同步写入 DB。
- 再从 DB 分页查询并组装 `providers` 覆盖关系。

### 5.3 `GET /swap/quote`

- 单渠道询价。
- 校验 `provider/amountDecimals/gasPriceDecimals` 后调用 adapter。

### 5.4 `POST /swap/quotes`

- 多渠道并发询价（`Promise.allSettled`）。
- 返回 `quotes + failedProviders + bestQuote`。

### 5.5 `POST /swap/tx/build`

- 先调用 provider 构建 swap tx。
- 再调用链工具构建 `unsignedTx`（EVM 参数补全，如 gas/nonce）。

### 5.6 `POST /gas/estimate`

- 输入链与交易基础参数（`chainCode/to/from/data/value`）。
- 通过 `chain/evm` 执行 RPC 估算，返回十进制和十六进制 gas limit。

### 5.7 `GET /gas/price`

- 输入 `chainCode`。
- 返回 `legacy` 与 `eip1559` 两组分档 gas 价格（`slow/standard/fast`）。
- 当链不支持 EIP-1559 时，`eip1559` 返回 `null`。

## 6. 第三方接入（OpenOcean）

- `getNetworks`：使用本地维护的支持链清单（静态映射）。
- `getTokenList`：`/v4/:chain/tokenList`。
- `quote`：`/v4/:chain/quote`。
- `buildTx`：`/v4/:chain/swap`。
- 请求能力：
- 默认超时 `10s`。
- 超时类错误可重试（默认重试 1 次）。
- 请求与响应有统一日志埋点（`[swap.thirdparty.*]`）。

## 7. 缓存与一致性策略

- 网络缓存：Redis `swap:networks:*`。
- Token 查询缓存：Redis `swap:token:query:*`。
- Token 对象缓存：Redis `swap:token:*`（按 token id）。
- 采用 Cache-Aside：查缓存 -> 回源 DB -> 回填缓存；写 DB 后删除相关查询缓存。
- 已补充“缓存自愈”：若读到字段不完整的旧 token 缓存，会回源 DB 重建。

## 8. 定时同步机制（openocean.schedule）

- 任务定义：`@Processor('openoceanTokenSync', { repeat.cron })`。
- 默认 cron：`*/30 * * * *`（每 30 分钟一次，可通过 `OPENOCEAN_TOKEN_SYNC_CRON` 覆盖）。
- 启动时机：应用在 `local/production` 启用 Bull 组件后，自动注册该 repeat job。
- 执行时机：由 cron 触发 `execute()`。
- 执行逻辑：按链拉 token，逐条 upsert（存在更新，不存在创建，重复键回退更新）。

## 9. 错误处理与响应约定

- 成功响应：统一包装为 `{ code: 0, message: success, data }`。
- 失败响应：由 `DefaultErrorFilter` 处理，返回 `{ code, message, data }`，HTTP 状态固定 200。
- `ResParamsError` 当前返回 `MidwayHttpError(..., 404)`，用于参数错误提示。

## 10. 与 goal 的对齐情况

- 已覆盖：
- OpenOcean 基础对接（network/token/quote/swap-build）。
- 网络和代币实体设计与持久化。
- 多渠道并发询价能力（结构已支持，当前默认 provider 主要为 openocean）。
- 自动同步方案（Bull cron 定时任务）。
