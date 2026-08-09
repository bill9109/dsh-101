# @dsh-external/dsh-101

**DSH 101** 文档阅读器 profile bundle：在 `dsh-base` + `dsh-web-app` 之上的文档优先阅读界面（模块树、文章阅读、搜索、导师面板）。

## 安装

需要与同源的 DSH 安装（bundle 的 peer 依赖 —— `cordis`、`@deepseek-ai/dsh-*` —— 从 DSH 安装的模块闭包解析）。

本 bundle 运行在 `dsh-base` + `dsh-web-app` 两层之上，而这两个是 DSH 的**内置 bundle**（`dsh plugin add` 只管理外部包，不会自动补内置层）。因此首次安装请按下面**完整步骤**操作——只执行 `dsh plugin add` 会得到一个缺 `dsh-web-app` 的 profile，启动时报
`waiting for service: httpServer`。

```sh
# 1) 初始化 profile 目录（含 dsh-base + dsh-web-app 两层）
mkdir -p ~/.dsh/profiles/dsh-101
cat > ~/.dsh/profiles/dsh-101/package.json <<'EOF'
{
  "name": "dsh-profile-dsh-101",
  "private": true,
  "dependencies": {},
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"] } }
}
EOF

# 2) 把本 bundle 加进 profile（会追加到 bundles 列表）
cd /path/to/this-repo && dsh plugin --profile dsh-101 add .
# 或从 GitHub（建议 pin 到 tag/commit）：
# dsh plugin --profile dsh-101 add github:dsh-external/dsh-101#v0.1.0

# 3) 启动阅读器 profile（默认端口 3080；如需 3081 见下方"端口"）
dsh --profile dsh-101
```

验证 bundles 列表应包含三层：

```sh
python3 -c "import json; print(json.load(open('$HOME/.dsh/profiles/dsh-101/package.json'))['dsh']['profile']['bundles'])"
# 期望：['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@dsh-external/dsh-101']
```

### 端口

默认使用 web profile 的 `:3080`。若想与 3080 并存（例如阅读器在 3081），在 profile 的
`cordis.patch.yml` 里覆盖端口：

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
