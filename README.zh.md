# dsh-101 — DSH 文档优先阅读器 profile bundle

[![Release v0.1.7](https://img.shields.io/badge/release-v0.1.7-5B4CF0?style=flat-square)](https://github.com/bill9109/dsh-101/releases/tag/v0.1.7)
[![License: BSD-3-Clause](https://img.shields.io/badge/license-BSD--3--Clause-0B7285?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%5E20%20%7C%20%3E%3D22-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![DSH profiles](https://img.shields.io/badge/DSH-Web-5B4CF0?style=flat-square)](cordis.patch.yml)

**安装：** `bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v0.1.7`

**DSH 101 文档阅读器 profile bundle：构建于 `dsh-base` + `dsh-web-app` 之上的文档优先阅读界面，把 DSH 自带文档整理成一份有顺序、可检索、可翻译的阅读器。**

[English](README.md) | 中文

## 为什么需要它

DSH 自带大量文档，但原始形态就是一坨文件：散落在源码树各处，没有顺序、没有检索、读起来也不舒服。dsh-101 把这些文档变成 DSH 体验的一等公民——一份经过整理、有顺序、可检索、可翻译的阅读器，而不是裸文件；右侧的对话面板就在旁边，边读边问。

## 实现能力

- 整理了 DSH 自带的文档，分门别类，有一定的顺序
- 自带文档翻译能力
- 有一个滑动式隐藏目录
- 对话在右侧

## 使用

启动 profile（默认端口 3081，与 3080 的 web GUI 并存）：

```sh
dsh --profile dsh-101
```

打开 http://127.0.0.1:3081（或你指定的端口）：阅读器展示整理好的语料，带滑动式目录；搜索可以过滤文档，翻译可以切换阅读语言，右侧面板就是你熟悉的 DSH 对话。

## 安装

本仓库同时包含 **bundle**（`@bill9109/dsh-101`，可 `dsh plugin add`）和
**`profile/` 目录**（完整的 `dsh-101` profile 组合：`dsh-base` + `dsh-web-app` +
本 bundle）。DSH 官方模型是"分发 bundle、用户组合 profile"，官方没有分发 profile
的命令，但 profile 本质是 `$DSH_HOME/profiles/<name>/` 下的一个目录 —— 仓库的
`profile/` 就是可直接使用的 profile 内容。

**推荐：一键脚本**（把 `profile/` 放到 `~/.dsh/profiles/dsh-101/` 并安装 bundle）：

```sh
# 从 GitHub 安装（建议 pin 到 tag/commit）：
bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v0.1.7

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
dsh plugin --profile dsh-101 add github:bill9109/dsh-101#v0.1.7
dsh --profile dsh-101
```

验证 bundles 列表应包含三层：

```sh
python3 -c "import json; print(json.load(open('$HOME/.dsh/profiles/dsh-101/package.json'))['dsh']['profile']['bundles'])"
# 期望：['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@bill9109/dsh-101']
```

> **不要装进 `web` profile。** dsh-101 的 bundle 会禁用 `ui-layout`（默认浏览器外壳），
> 装进 web-app 系 profile 会连坐搞挂 web（sidebar / conversation / app-shell 全部等待
> `layout` 服务而 pending，web 起不来）。dsh-101 请始终作为独立 profile 使用
> （`dsh --profile dsh-101`，默认 3081 端口，可与 3080 的 web 并存）。`install.sh`
> 已对 `--profile web` 直接拒绝。

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

### 升级

用新的 pin tag 重跑一键脚本：

```sh
bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v<新版本>
```

本地 checkout 安装则对更新后的 checkout 重跑 `./scripts/install.sh .`（脚本只补缺失的
层，profile 现有状态不会丢）。DSH 发布新快照后，用 `node scripts/upgrade.mjs` 从升级后的
checkout 同步 bundle 源码（见「从更新的 DSH 快照升级」）。

### 卸载

```sh
dsh plugin --profile dsh-101 remove @bill9109/dsh-101
# 如果不再需要这个独立 profile：
rm -rf ~/.dsh/profiles/dsh-101
```

第一条命令在 profile 目录执行 `pnpm remove` 并从 `dsh.profile.bundles` 移除该 bundle；
第二条删除独立 profile 本身。

## 故障排查

| 症状 | 解决 |
| --- | --- |
| 安装 dsh-101 后 web GUI（3080）起不来 / sidebar 一直 pending | dsh-101 被装进了 `web` profile，禁用了 `ui-layout` —— 把 `@bill9109/dsh-101` 从 web profile 移除，再用一键脚本把 dsh-101 装成独立 profile |
| `dsh --profile dsh-101` 启动失败 | 确认 `$DSH_HOME/profiles/dsh-101/` 存在且 bundles 列表包含三层（`dsh-base`、`dsh-web-app`、`@bill9109/dsh-101`）；缺层就重跑 `install.sh` |
| 端口 3081 被占用 | 启动时加 `--port <port>`，或在 profile 的 `cordis.patch.yml` 里持久化别的默认端口 |
| GitHub 安装失败或装到旧代码 | 把安装 pin 到 tag（`github:bill9109/dsh-101#v0.1.7`），或从本地 checkout 安装（`./scripts/install.sh .`） |
| 文档缺失或过期 | 从 DSH 源码 checkout 重新生成语料：`DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs --corpus` |
| DSH 发布新快照后出问题 | 用 `node scripts/upgrade.mjs --checkout /path/to/upgraded-dsh` 同步源码并重建 |

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
profile/          开箱即用的 dsh-101 profile（package.json + pnpm-workspace.yaml + cordis.patch.yml）
scripts/
  install.sh            一键 profile 安装脚本（install.sh --port <port> <src>）
  build.mjs             针对 DSH checkout 构建 host + client bundle
  gen-dsh-101-corpus.ts 从 DSH 源码树重新生成语料
  upgrade.mjs           从升级后的 DSH checkout 同步源码 + 重建
  verify-i18n.mjs       双语 README 一致性检查（node scripts/verify-i18n.mjs）
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

## 从更新的 DSH 快照升级

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

## 开发与验证

```sh
pnpm install
pnpm run build       # tsc + tsdown -> lib/（已提交）
pnpm run gen-corpus  # 从 DSH 源码树重新生成语料（需要 DSH_CHECKOUT）
node scripts/verify-i18n.mjs   # 双语 README 一致性
```

`pnpm run build` 把 host + client bundle 生成到 `lib/`，lib 已提交，消费方安装无需构建。
保持双语 README 同步：改 `README.md` 和 `README.zh.md` 任一侧都要同步另一侧，然后
`node scripts/verify-i18n.mjs --write` 重新记录 blob hash。

## 社区与关于

- 可复现的 bug、聚焦的功能请求和使用问题，走 [GitHub Issues](https://github.com/bill9109/dsh-101/issues)。
- 提变更前先读 [CONTRIBUTING.md](CONTRIBUTING.md)；安全问题通过 [SECURITY.md](SECURITY.md) 私有上报。
- 版本与兼容性说明见 [CHANGELOG.md](CHANGELOG.md)。

## License

BSD-3-Clause
