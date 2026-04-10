# 规则

## 技术栈

- 框架: Vue 3.5+
- 打包构建工具: Vite 7+
- 路由管理: Vue Router
- 状态管理: Pinia
- UI 组件库: Element Plus
- CSS 预处理器: Scss
- 代码校验与格式化: ESLint
- 开发语言: TypeScript
- 包管理工具: pnpm
- 网络请求: Axios

## 代码

- 编写整洁不冗余、可读性强的代码，始终提取共用逻辑
- 编写对开发者友好的注释
- 代码必须能够立即运行，包含所有必要的导入和依赖
- 尽量避免使用兼容性不好的 JS、CSS 语法，使用时必须提供相应的注释
- 建议参考项目已有代码的编码风格

## 代码风格

- 组件: 使用单文件组件 (SFC)
- API: 使用组合式 API (Composition API) 并搭配 `<script setup>` 语法糖
- 语法: 没有特殊说明则使用 TS 进行开发 `<script setup lang="ts">`

## 命名

- 组件 (Component) 命名: 始终采用单词大写开头 (PascalCase) 的命名方式, 并且避免与 HTML 元素冲突
- 组件 (Component) 命名示例: 以全局的 `SearchMenu` 组件 `@@/components/SearchMenu/index.vue` 和 `@@/components/SearchMenu/Modal.vue` 作为参考，注意 `index` 是不需要遵循大驼峰格式的
- 页面 (Page) 命名: 始终采用短横线连接 (kebab-case) 的命名方式
- 页面 (Page) 命名示例: 以增删改查示例页面作为参考 `@/pages/demo/element-plus/index.vue`
- 组合式函数 (Composable) 命名: 始终采用小驼峰 (camelCase) 的命名方式
- 组合式函数 (Composable) 命名示例: 以水印组合式函数作为参考 `@@/composables/useWatermark.ts`
- Props 命名: 在声明 prop 的时候，其命名应该始终采用小驼峰 (camelCase)，而在模板和 JSX 中应该始终采用短横线连接 (kebab-case)
- Props 命名示例: 声明时 `const { isActive = false } = defineProps<Props>()` 和传递时 `<Demo :is-active="true" />`
- TS 或 JS 文件命名: 始终采用短横线连接 (kebab-case) 的命名方式
- TS 或 JS 文件命名示例: `@@/constants/app-key.ts`

# 业务规则

- 读取根目录下的“考勤与薪资计算需求规格说明书.md”

## 其他

- 避免直接操作 DOM
- 尽可能编写原子化组件
- 使用 `v-for` 时必须提供唯一的 `key` (不要轻易使用数组下标 `index` 当做 `key`)
- 不要在同一元素上同时使用 `v-if` 和 `v-for`

## Commit 规范

提交模板 `type: message`，具体要求如下:

1. 注意英文冒号后有一个空格
2. `type` 的枚举值有:

- `feat` 新功能
- `fix` 修复错误
- `perf` 性能优化
- `refactor` 重构代码
- `docs` 文档和注释
- `types` 类型相关
- `test` 单测相关
- `ci` 持续集成、工作流
- `revert` 撤销更改
- `chore` 琐事（更新依赖、修改配置等）

1. 保持 `message` 简洁明了，描述清楚变更内容

## 分支说明

- `main / master`: 主分支
- `4.x`: 已停止维护的 4.x 版本代码
- `gh-pages`: GitHub Pages 构建分支

## 其他

- 禁止自动提交，除非有明确的指示
- 提交前确保代码通过代码校验和单元测试
- 避免大型提交，尽量将变更分解为小的、相关的提交

