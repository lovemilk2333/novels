import { defineConfig } from 'vitepress'
import AutoSidebar from 'vite-plugin-vitepress-auto-sidebar';
import FootnotePlugin  from "markdown-it-footnote";
import UnoCSS from 'unocss/vite'

export default defineConfig({
  title: "牛奶の小说 | 本网站部署于中国大陆外",
  description: "牛奶の小说将在本网站可供查看 / Novels which are public and written by lovemilk are available on this website",
  srcDir: 'novels/',
  lang: 'zh-CN',
  themeConfig: {
    nav: [
      { text: '主页', link: '/' },
      { text: '数据管理', link: '/_/DataManage' },
    ],

    editLink: {
      pattern: 'https://github.com/zhuhansan666/novels/edit/main/novels/:path',
      text: '和我一起写小说 (记得 Fork 后提交 PR)'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhuhansan666/novels' }
    ],

    externalLinkIcon: false,

    footer: {
      message: '<p select-none>本网站部署于中国大陆外, 由 GitHub Pages 和 Cloudflare Pages 提供托管支持</p>',
      copyright: '<a target="_blank" select-none href="https://aka.lovemilk.top/68">Copyright &copy; Lovemilk, All Rights Reserved.</a>'
    },

    docFooter: {
      prev: '返回',
      next: '前进'
    },

    darkModeSwitchLabel: '颜色模式',
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    lightModeSwitchTitle: '单击以切换至明亮模式',
    darkModeSwitchTitle: '单击以切换至黑暗模式',
    outline: {
      label: '本页概览',
    }
  },
  markdown: {
    config: (md) => {
      md.use(FootnotePlugin)
    }
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 5123
    },
    plugins: [  // @ts-ignore
      AutoSidebar({
        path: 'novels/',
        ignoreList: ['.outline.md', '_'],
        ignoreIndexItem: true,
        titleFromFile: true,
      }),  // @ts-ignore
      UnoCSS(),
    ],
    build: {
      rollupOptions: {
        external: ['unocss']
      }
    }
  },
  ignoreDeadLinks: true
})
