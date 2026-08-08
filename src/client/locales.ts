/** `dsh101` namespace dictionaries (the reader shell's own copy). */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The DSH 101 reader shell copy. */
    dsh101: Dsh101Key
  }
}

/** Dictionary key set (zh is the source of truth). */
export type Dsh101Key =
  | 'title'
  | 'tagline'
  | 'search.placeholder'
  | 'modules'
  | 'modules.empty'
  | 'docs.empty'
  | 'article.notFound'
  | 'article.fallbackLocale'
  | 'article.sections'
  | 'article.source'
  | 'tutor.title'
  | 'tutor.open'
  | 'tutor.close'
  | 'tutor.back'
  | 'tutor.sessions'
  | 'article.adjustTranslation'
  | 'update.banner'
  | 'update.button'
  | 'update.running'
  | 'update.done'
  | 'update.error'
  | 'lang'
  | 'home.welcome'
  | 'home.guide'

/** Simplified Chinese dictionary (key-set source of truth). */
export const zh: Record<Dsh101Key, string> = {
  'title': 'DSH 101',
  'tagline': '从入门到精通 DeepSeek Harness',
  'search.placeholder': '搜索文档、关键词…',
  'modules': '模块',
  'modules.empty': '暂无模块',
  'docs.empty': '暂无文档',
  'article.notFound': '文档不存在',
  'article.fallbackLocale': '当前语言没有此文档的版本，显示其他语言。',
  'article.sections': '目录',
  'article.source': '源文件',
  'tutor.title': '学习助手',
  'tutor.open': '打开学习助手',
  'tutor.close': '收起学习助手',
  'tutor.back': '返回会话列表',
  'tutor.sessions': '会话',
  'article.adjustTranslation': '调整翻译',
  'update.banner': '检测到新的 DSH 版本文档，可一键更新学习内容。',
  'update.button': '更新',
  'update.running': '更新中…',
  'update.done': '已更新',
  'update.error': '更新失败',
  'lang': '语言',
  'home.welcome': '欢迎使用 DSH 101',
  'home.guide': '从左侧选择一个模块开始，或直接搜索。',
}

/** English dictionary. */
export const en: Record<Dsh101Key, string> = {
  'title': 'DSH 101',
  'tagline': 'From zero to fluent with DeepSeek Harness',
  'search.placeholder': 'Search docs, keywords...',
  'modules': 'Modules',
  'modules.empty': 'No modules',
  'docs.empty': 'No documents',
  'article.notFound': 'Document not found',
  'article.fallbackLocale': 'This document has no version in the current language; showing another language.',
  'article.sections': 'Sections',
  'article.source': 'Source',
  'tutor.title': 'Tutor',
  'tutor.open': 'Open tutor',
  'tutor.close': 'Collapse tutor',
  'tutor.back': 'Back to sessions',
  'tutor.sessions': 'Sessions',
  'article.adjustTranslation': 'Adjust translation',
  'update.banner': 'New DSH version docs detected; one-click update available.',
  'update.button': 'Update',
  'update.running': 'Updating…',
  'update.done': 'Updated',
  'update.error': 'Update failed',
  'lang': 'Language',
  'home.welcome': 'Welcome to DSH 101',
  'home.guide': 'Pick a module on the left to start, or search directly.',
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'dsh101'
