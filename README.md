# 极饿时代

家庭饭局点菜系统，包含邀请链接点菜、三分钟占菜、主厨后台、历史饭局、图片上传和 SQLite 持久化。

## 本地运行

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

根路径 `/` 和无效邀请链接都会显示 `群雄归隐`。主厨后台入口是 `/chef/login`。

## 环境变量

复制 `.env.example` 为 `.env`：

```dotenv
CHEF_PASSWORD_HASH=
CHEF_SESSION_SECRET=
DATABASE_PATH=/app/data/hao-kitchen.sqlite
UPLOAD_DIR=/app/data/uploads
```

生成主厨口令 hash：

```bash
node -e "const { randomBytes, scryptSync } = require('crypto'); const p = process.argv[1]; const s = randomBytes(16).toString('hex'); console.log(`scrypt:${s}:${scryptSync(p, s, 64).toString('hex')}`)" "你的主厨口令"
```

`CHEF_SESSION_SECRET` 填一段随机长字符串。生产部署时不要提交 `.env`。

## Docker 部署

在服务器上安装 Docker 和 Compose 插件后：

```bash
cp .env.example .env
# 编辑 .env，填入 CHEF_PASSWORD_HASH 和 CHEF_SESSION_SECRET
docker compose up -d --build
```

容器启动时会执行：

```text
npm run db:migrate
npm run db:seed
npm run start
```

SQLite 数据库和上传图片持久化在宿主机 `./data`。

## Nginx HTTPS

参考 `deploy/nginx/hao-kitchen.conf.example`。把 `example.com` 和证书路径替换为你的域名与证书文件，然后让 Nginx 反代到 `127.0.0.1:3000`。

SSE 刷新依赖长连接，示例配置里已关闭 `proxy_buffering` 并设置较长 `proxy_read_timeout`。

## 手动备份

Linux/macOS：

```bash
bash scripts/backup.sh
```

Windows PowerShell：

```powershell
.\scripts\backup.ps1
```

备份会保存 `data/hao-kitchen.sqlite` 和 `data/uploads/` 到 `backups/`，不会删除旧备份。

## 验证

```bash
npm test
npm run lint
npm run build
docker compose config
```
