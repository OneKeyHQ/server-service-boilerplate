# OneKey Postman Collection 同步版 cURL

以下请求已按 `1key.postman_collection.json` 对齐。

## 1) 健康检查

```bash
curl --location 'http://localhost:7001/api/health'
```

## 2) 网络列表

### 2.1 全部网络

```bash
curl --location 'http://localhost:7001/api/swap/networks'
```

### 2.2 指定 provider

```bash
curl --location 'http://localhost:7001/api/swap/networks?provider=openocean'
```

### 2.3 指定 provider + refresh

```bash
curl --location 'http://localhost:7001/api/swap/networks?provider=openocean&refresh=true'
```

## 3) Token 列表

### 3.1 按链查询

```bash
curl --location 'http://localhost:7001/api/swap/tokens?chainCode=bsc'
```

### 3.2 provider + keyword + 分页

```bash
curl --location 'http://localhost:7001/api/swap/tokens?chainCode=eth&provider=openocean&keyword=usdt&page=1&pageSize=20'
```

### 3.3 provider + refresh + 分页

```bash
curl --location 'http://localhost:7001/api/swap/tokens?chainCode=eth&provider=openocean&refresh=true&page=2&pageSize=20'
```

## 4) 单渠道询价

### 4.1 quote 示例 1

```bash
curl --location 'http://localhost:7001/api/swap/quote?provider=openocean&chainCode=bsc&inTokenAddress=0x55d398326f99059ff775485246999027b3197955&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&amountDecimals=5000000000000000000&gasPriceDecimals=1000000000&slippage=1&account=0x9116780aEf4B376499358fa7dEeC00cCF64fA801'
```

### 4.2 quote 示例 2

```bash
curl --location 'http://localhost:7001/api/swap/quote?provider=openocean&chainCode=bsc&inTokenAddress=0x55d398326f99059ff775485246999027b3197955&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&gasPriceDecimals=1&slippage=1&account=0x9116780aEf4B376499358fa7dEeC00cCF64fA801&amountDecimals=5000000000000000000'
```

## 5) 多渠道并发询价

```bash
curl --request POST \
  --url 'http://localhost:7001/api/swap/quotes' \
  --header 'Content-Type: application/json' \
  --data '{
  "providers": ["openocean"],
  "chainCode": "eth",
  "inTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "outTokenAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "amountDecimals": "1000000000000000000",
  "slippage": 1,
  "gasPriceDecimals": "12"
}'
```

## 6) 构建交易

### 6.1 buildTx 示例 1

```bash
curl --request POST \
  --url 'http://localhost:7001/api/swap/tx/build' \
  --header 'Content-Type: application/json' \
  --data '{
  "provider": "openocean",
  "chainCode": "bsc",
  "inTokenAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "outTokenAddress": "0x55d398326f99059fF775485246999027B3197955",
  "amountDecimals": "5",
  "gasPriceDecimals": "1",
  "account": "0x28816c4C4792467390C90e5B426F198570E29307",
  "referrer": "0xD4eb4cbB1ECbf96a1F0C67D958Ff6fBbB7B037BB",
  "slippage": 1
}'
```

### 6.2 buildTx 示例 2

```bash
curl --request POST \
  --url 'http://localhost:7001/api/swap/tx/build' \
  --header 'Content-Type: application/json' \
  --data '{
  "provider": "openocean",
  "chainCode": "bsc",
  "inTokenAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "outTokenAddress": "0x55d398326f99059fF775485246999027B3197955",
  "amountDecimals": "5",
  "gasPriceDecimals": "1000000000",
  "account": "0x28816c4C4792467390C90e5B426F198570E29307",
  "referrer": "0xD4eb4cbB1ECbf96a1F0C67D958Ff6fBbB7B037BB",
  "slippage": 1
}'
```

## 7) Gas 接口

### 7.1 估算 Gas

```bash
curl --request POST \
  --url 'http://localhost:7001/api/gas/estimate' \
  --header 'Content-Type: application/json' \
  --data '{
  "chainCode": "eth",
  "from": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "to": "0x000000000000000000000000000000000000dEaD",
  "value": "0",
  "data": "0x"
}'
```

### 7.2 获取 Gas Price

```bash
curl --location 'http://localhost:7001/api/gas/price?chainCode=eth'
```
