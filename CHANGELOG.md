# Kaa SAAS

## [1.2.1](https://github.com/CaoMeiYouRen/rsshub-never-die/compare/v1.2.0...v1.2.1) (2025-02-10)

### 🐛 Bug 修复

- 增强错误处理逻辑，针对非首页返回 HTML 内容的情况抛出 HTTP 异常 ([30ac261](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/30ac261))

# [1.2.0](https://github.com/CaoMeiYouRen/rsshub-never-die/compare/v1.1.1...v1.2.0) (2024-12-06)

### ✨ 新功能

- 添加最大实例节点数配置；更新文档以包含最大实例节点数配置；优化节点选择逻辑以支持最大节点数配置 ([a5b2393](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/a5b2393))

## [1.1.1](https://github.com/CaoMeiYouRen/rsshub-never-die/compare/v1.1.0...v1.1.1) (2024-11-16)

### 🐛 Bug 修复

- 修复 outputDirectory 路径错误 ([f2c5a3a](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/f2c5a3a))

# [1.1.0](https://github.com/CaoMeiYouRen/rsshub-never-die/compare/v1.0.2...v1.1.0) (2024-11-02)

### ✨ 新功能

- 新增 运行模式 配置。支持 负载均衡、自动容灾、快速响应等三种模式 ([1604bff](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/1604bff))

## [1.0.2](https://github.com/CaoMeiYouRen/rsshub-never-die/compare/v1.0.1...v1.0.2) (2024-10-25)

### 🐛 Bug 修复

- 增加 authCode 验证逻辑；修复部分情况下摇树优化错误的问题 ([004e4ff](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/004e4ff))

## [1.0.1](https://github.com/CaoMeiYouRen/rsshub-never-die/compare/v1.0.0...v1.0.1) (2024-10-24)

### 🐛 Bug 修复

- 增加 AUTH_KEY 配置；修复 fetch 未抛出异常的问题；更新文档 ([84fdfda](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/84fdfda))

# 1.0.0 (2024-10-24)

### ♻ 代码重构

- 增加 Vercel/Cloudflare 兼容性测试；移除部分未使用依赖；升级最低 Node.js 版本要求 ([c4ec385](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/c4ec385))

### ✨ 新功能

- 初步实现负载均衡功能 ([0ec79a2](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/0ec79a2))
- 新增 缓存配置 ([0e3e244](https://github.com/CaoMeiYouRen/rsshub-never-die/commit/0e3e244))
