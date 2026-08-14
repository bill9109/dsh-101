# dsh-101 — DSH 文档阅读模式

[English](README.en.md) | 中文

**DSH 101** 文档阅读器 profile bundle：构建于 `dsh-base` + `dsh-web-app` 之上的文档优先阅读界面，把 DSH 自带文档整理成一份有顺序、可检索、可翻译的阅读器。

许可证 BSD-3-Clause · [GitHub](https://github.com/bill9109/dsh-101)

## 实现能力

- 整理了 DSH 自带的文档，分门别类，有一定的顺序
- 自带文档翻译能力
- 有一个滑动式隐藏目录
- 对话在右侧

## 安装（profile 分发）

本仓库同时包含 **bundle**（`@bill9109/dsh-101`，可 `dsh plugin add`）和
**`profile/` 目录**（完整的 `dsh-101` profile 组合：`dsh-base` + `dsh-web-app` +
本 bundle）。DSH 官方模型是"分发 bundle、用户组合 profile"，官方没有分发 profile
的命令，但 profile 本质是 `$DSH_HOME/profiles/<name>/` 下的一个目录 —— 仓库的
`profile/` 就是可直接使用的 profile 内容。

**推荐：一键脚本**（把 `profile/` 放到 `~/.dsh/profiles/dsh-101/` 并安装 bundle）：

```sh
# 从 GitHub 安装（建议 pin 到 tag/commit）：
bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v0.1.4

# 或从本地 checkout 安装，并指定端口（默认 3081）：
./scripts/install.sh --port 3081 .

# 启动：
dsh --profile dsh-101
```

脚本做的事：把 `profile/` 的三个文件放进 `$DSH_HOME/profiles/dsh-101/`（已有则只补
缺失的 `dsh-base`/`dsh-web-app` 层），触发 DSH 模块回退（供运行时解析内置 peer），
然后 `dsh plugin --profile dsh-101 add` 安装本 bundle。

**纯手动**：

```sh
mkdir -p ~/.dsh/profiles/dsh-101
cp profile/package.json profile/pnpm-workspace.yaml ~/.dsh/profiles/dsh-101/
# 可选：端口 patch
cp profile/cordis.patch.yml ~/.dsh/profiles/dsh-101/
# 安装 bundle（会追加到 bundles 列表）
dsh plugin --profile dsh-101 add github:bill9109/dsh-101#v0.1.4
dsh --profile dsh-101
```

验证 bundles 列表应包含三层：

```sh
python3 -c "import json; print(json.load(open('$HOME/.dsh/profiles/dsh-101/package.json'))['dsh']['profile']['bundles'])"
# 期望：['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@bill9109/dsh-101']
```

### 备选：装进官方 `web` profile（不建议）

如果你不介意 profile 名叫 `web`（官方模板自带 base + web-app），一条命令即可：

```sh
dsh plugin --profile web add github:bill9109/dsh-101#v0.1.4
dsh --profile web
```

### 端口

默认 3081（与 3080 的 web GUI 并存）。两种改法：

**启动时临时指定**（推荐，不改配置，dsh 0.1.0-rc.6+）：

```sh
dsh --profile dsh-101 --port 8080
```

**改 profile 配置**（持久化默认端口）：

```yaml
# ~/.dsh/profiles/dsh-101/cordis.patch.yml
- id: webserver
  inject: [webStartup]
  config:
    host: !!js ctx.webStartup.host ?? '127.0.0.1'
    port: !!js ctx.webStartup.port ?? 8080
```

（启动参数优先；patch 里的值只是回退默认。）

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
