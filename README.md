# Chemistry Question Bank — Local

本地化学选题、混编试卷与 PDF 导出工具。界面可选择中文，知识点保留英文。

## Windows / macOS 使用

1. 安装 [Git](https://git-scm.com/) 和 [Node.js LTS](https://nodejs.org/)。macOS 的 Apple Silicon 和 Intel 均使用对应架构的 Node.js，无须 Windows EXE。
2. 克隆公开仓库：
   ```sh
   git clone https://github.com/Yangyige-123/chemistry-question-bank.git
   cd chemistry-question-bank
   ```
3. 安装题库资源（首次约下载 2.82 GB，解压后约 3.97 GB，请预留至少 8 GB）：
   ```sh
   npm run setup
   ```
   Windows 也可双击 `Install-resources.cmd`；macOS 可在终端运行 `bash Install-resources.command`。下载中断后可重新运行，已验证的资源包会跳过，未完成的下载会尝试续传。若网络受限，也可从 Releases 下载全部九个 ZIP 和清单到 `resources/`，再运行安装脚本。
4. 启动：
   ```sh
   npm start
   ```
   打开 http://127.0.0.1:4889/ 。Windows 可双击 `Start.cmd`，macOS 可运行 `bash Start.command`。Git 克隆会保留 `.command` 执行权限；如通过 ZIP 下载丢失权限，使用上述 `bash` 命令即可。

本版本通过本机浏览器使用，无云端账号要求，无需 `npm install`。安装资源后可离线使用。macOS 的双击入口可能受系统安全提示限制，可使用终端启动；不要关闭系统安全保护。

## 更新与个人数据

关闭本地服务后运行 `git pull --ff-only`，然后重新启动。题库资源仅在资源版本变化时重新下载。
已保存试卷、易错题、报错和设置保存在当前浏览器中，不上传 Git。请固定使用同一浏览器及上述地址；更换浏览器、端口或主机名后，浏览器存储也不同。使用应用内备份功能保存个人记录，清除浏览器数据会影响记录。不同用户的数据不会自动共享。

## 目录

- `offline/`：无需构建即可运行的本地网页，包括当前题库索引。
- `static/`：界面开发源文件；修改后需同步对应 `offline/` 文件。
- `portable/`：Electron 便携版源代码参考；EXE 构建未包含在本次启动流程中。
- `tools/`：仅监听本机的静态服务和资源完整性检查。
- `sources/`、`offline/assets/`、`output/unit-papers/`：资源包安装位置，Git 不跟踪。

## 分发范围

本仓库及 Releases 为公开分发。教学资料及第三方组件的权利属于各自权利人；仓库访问权限不代表获得再次公开分发题库的许可。不要提交账号密钥、浏览器用户目录、个人试卷或导出记录。

分类状态：部分题目来自参考分类或 AI 建议，整体教师复核尚未完成。题目卡片中的状态用于区分，使用前请自行核对。

pdf-lib 的 MIT 许可见 licenses/pdf-lib-LICENSE.md。
