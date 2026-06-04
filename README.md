# 极饿时代

家庭饭局共享点菜系统，包含：

- invite 单页点菜
- 3 分钟临时占位
- 主厨工具台
- 菜单管理
- 历史饭局
- 图片上传
- SQLite 持久化

## 本地运行

首次初始化默认菜单：

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

当前访问规则：

- `/`：固定显示 `群雄归隐`
- `/invite/[token]`：有效 invite 显示营业中的前台单页
- `/chef/login`：主厨登录入口

## 环境变量

复制 `.env.example` 为 `.env`：

```dotenv
CHEF_PASSWORD_HASH=scrypt:hao-kitchen-local-password:3fe7122b06485432effb40c127f9598b8619d4490fc80facc01c0ef5f5960bbe53c4086cfa14f89ec8ccb3d5326d4ad24364c7c02f3c8fdec05132a542a177cd
DATABASE_PATH=/app/data/hao-kitchen.sqlite
UPLOAD_DIR=/app/data/uploads
```

Default local chef password: `hhhhz`.

生成主厨口令 hash：

```bash
node -e "const { randomBytes, scryptSync } = require('crypto'); const p = process.argv[1]; const s = randomBytes(16).toString('hex'); console.log(`scrypt:${s}:${scryptSync(p, s, 64).toString('hex')}`)" "你的主厨口令"
```

## Docker 部署

```bash
cp .env.example .env
# 编辑 .env，填入 CHEF_PASSWORD_HASH
docker compose up -d --build
```

容器启动时只会执行：

```text
npm run db:migrate
npm run start
```

如果数据库是空的，首次部署后手动执行一次：

```bash
docker compose exec app npm run db:seed
```

说明：

- `db:seed` 只用于空库初始化默认菜单
- 已有菜单数据时不会被 seed 覆盖
- SQLite 和上传图片持久化在宿主机 `./data`

## 图片上传

当前约束：

- 仅支持 PNG / JPG / WEBP
- 文件大小不超过 5MB
- 上传后通过 `/uploads/[filename]` 访问

## 用户使用手册

参考 [极饿时代用户使用手册](docs/05-使用阶段/极饿时代-用户使用手册-2026-06-04.md)。

## Nginx HTTPS

参考 [hao-kitchen.conf.example](deploy/nginx/hao-kitchen.conf.example)。  
将 `example.com` 和证书路径替换为真实域名与证书文件，然后反代到 `127.0.0.1:3000`。

SSE 刷新依赖长连接，示例配置已关闭 `proxy_buffering` 并放宽 `proxy_read_timeout`。

## 手动备份

Linux/macOS：

```bash
bash scripts/backup.sh
```

Windows PowerShell：

```powershell
.\scripts\backup.ps1
```

备份内容：

- `data/hao-kitchen.sqlite`
- `data/uploads/`

## 验证

```bash
npm test
npm run lint
npm run build
docker compose config
```
