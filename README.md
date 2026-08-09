# @dsh-external/dsh-101

**DSH 101** 文档阅读器 profile bundle：在 `dsh-base` + `dsh-web-app` 之上的文档优先阅读界面（模块树、文章阅读、搜索、导师面板）。

## 安装（标准做法）

本 bundle 运行在 `dsh-base` + `dsh-web-app` 两层之上。**标准做法是把本 bundle 装进
官方 `web` profile** —— 官方 `web` 模板自带这两层，一条命令即可（`pnpm-workspace.yaml`
已内置 `autoInstallPeers: false`，git 安装不会去 npm registry 拉内置 `@deepseek-ai/*`
peer）：

```sh
dsh plugin --profile web add github:dsh-external/dsh-101#v0.1.0
dsh --profile web
```

> 默认使用 `web` profile 的端口（3080）。若想与默认 web 并存（阅读器用独立端口，
> 如 3081），见下方"独立 profile"。

## 安装（独立 `dsh-101` profile）

官方没有 `dsh-101` profile 模板（`dsh plugin add` 初始化未知 profile 名时只给
`dsh-base`），所以独立 profile 需要手动补齐 `dsh-web-app` 层。仓库提供一键脚本：

```sh
# 从 GitHub 安装（建议 pin 到 tag/commit），默认端口 3080：
bash <(curl -fsSL https://raw.githubusercontent.com/dsh-external/dsh-101/main/scripts/install.sh) github:dsh-external/dsh-101#v0.1.0

# 或从本地 checkout 安装，并指定阅读器端口 3081（可与 3080 并存）：
./scripts/install.sh --port 3081 .

# 安装完成后启动：
dsh --profile dsh-101
```

脚本做什么：

1. 在 `$DSH_HOME/profiles/dsh-101/` 初始化 profile（bundles 含 `dsh-base` + `dsh-web-app`，
   并写入 `pnpm-workspace.yaml` 的 `autoInstallPeers: false` —— 避免 pnpm 去 registry
   拉内置 `@deepseek-ai/*` peer）；
2. 触发 DSH 模块回退（`$DSH_HOME/profiles/node_modules`）供运行时解析内置 peer；
3. `dsh plugin --profile dsh-101 add` 本 bundle（GitHub 或本地）；
4. 可选 `--port N` 写 `cordis.patch.yml` 绑定端口。

验证 bundles 列表应包含三层：

```sh
python3 -c "import json; print(json.load(open('$HOME/.dsh/profiles/dsh-101/package.json'))['dsh']['profile']['bundles'])"
# 期望：['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@dsh-external/dsh-101']
```

### 端口

默认使用 web profile 的 `:3080`。若想与 3080 并存（例如阅读器在 3081），在 profile 的
`cordis.patch.yml` 里覆盖端口（或安装时传 `--port 3081`）：

```yaml
- id: webserver
  config:
    host: 127.0.0.1
    port: 3081
```

> **Git 安装与构建产物。** `lib/` 已提交到本仓库，所以 git 安装直接拿到构建好的
> host + client bundle —— **无需构建、无需授权**。若在构建前从全新 clone 安装，
> 先运行 `node scripts/build.mjs`（需要 DSH 源码 checkout，见下）。

## 目录结构

```
src/
  app/        主机插件：语料服务 + /api/dsh101 路由（来自 dsh-101-app）
  app/invariant.ts
  core/       语料模型：加载、合并、搜索（来自 dsh-101-core）
  tutor/      主机插件：模型工具、curator 技能（来自 dsh-101-tutor）
  client/     浏览器端：阅读器外壳（来自 dsh-101-app/src/client）
  invariant.ts
assets/dsh-101/   生成的语料（corpus.json + documents/ + images/）
cordis.patch.yml  bundle 补丁：挂载 app（包根）+ tutor（./tutor 子路径）
scripts/
  build.mjs        针对 DSH checkout 构建 host + client bundle
  gen-dsh-101-corpus.ts  从 DSH 源码树重新生成语料
  upgrade.mjs      从升级后的 DSH checkout 同步源码 + 重建
```

## 构建

bundle 的 peer 依赖从 DSH 安装解析 —— 可以是源码 checkout（`DSH_CHECKOUT`），
也可以是运行中 DSH 的模块回退（`$DSH_HOME/profiles/node_modules`）。工具链
（tsc、tsdown）优先取 DSH 源码 checkout。

```sh
DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs
# 重新生成语料后构建：
DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs --corpus
```

`build.mjs` 把 DSH 的 peer 软链进 `node_modules`，依次运行 `tsc`（类型输出到
`types/`）和 `tsdown`（host bundle + client bundle 输出到 `lib/`），结束后移除软链。

> **通常不需要构建。** `lib/` 已提交，`dsh plugin add`（GitHub / tarball / 本地
> checkout）安装的都是构建好的 bundle。只有开发本仓库或执行 `upgrade` 同步后才需要构建。

## 重新生成语料

语料是 DSH 仓库文档的快照。从任意 DSH 源码 checkout 重新生成（使用该 checkout 的 tsx）：

```sh
DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs --corpus
# 或显式指定：
/path/to/dsh/node_modules/.bin/tsx scripts/gen-dsh-101-corpus.ts /path/to/dsh
```

## 升级

DSH 仓库发布新快照后，从升级后的 checkout 同步本 bundle：

```sh
node scripts/upgrade.mjs --checkout /path/to/upgraded-dsh
```

脚本会：把 101 各包的源码复制到 `src/` → 将内部 import 改写为相对路径 → 重新生成
语料 → 重建。之后审查 diff、提交、升版本号并打 tag：

```sh
git add -A && git commit -m "sync with DSH <snapshot>"
git tag v0.2.0 && git push origin main --tags
```

## License

BSD-3-Clause
