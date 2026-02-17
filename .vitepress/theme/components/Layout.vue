<script setup lang="ts">
// @ts-ignore
const isDev: boolean = !!import.meta.env.DEV;

const closeAll = (afterRemoveBody?: () => void) => {
  document.body.innerHTML = ''
  if (!!afterRemoveBody) {
    afterRemoveBody()
  }
  location.replace('about:blank')
  window.close()
}

let loc: string | undefined
(async () => {
  const domains: string[] = [
    'novels.lovemilk.top',
    'notes.lovemilk.top',
    'www.cloudflare-cn.com',
  ]

  const alertClose = () => {
    alert('Critical Error: invalid region state!!!')
  }

  let res
  for (const domain of domains) {
    try {
      res = await (await fetch(`https://${domain}/cdn-cgi/trace`)).text()
      break
    } catch { }
  }

  if (!res || typeof res !== 'string') {
    closeAll(alertClose)
    return
  }

  const locMatched = res.match(/loc=([0-9A-Z]{2})/)
  const loc = locMatched ? locMatched[1] : null;

  if (!loc || typeof loc !== 'string') {
    closeAll(alertClose)
    return
  }

  if (loc === 'T1') {
    closeAll(alertClose)
    return
  }

  return loc
})().then((data) => {
  loc = data
}).finally(() => {
  checkRegion()
})

import { computed, VNode, h } from 'vue';
import DefaultTheme from 'vitepress/theme'
import { useData, useRoute, useRouter } from 'vitepress'
import { nextTick, provide } from 'vue'
import Toast from 'primevue/toast';
import Analytics from './Analytics.vue';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from "primevue/useconfirm";

import { useRegionCheckStore } from '../../../stores/regionCheck'

const { Layout } = DefaultTheme

const confirm = useConfirm();

const { isDark, page } = useData()
const isNotFound = computed(() => page.value.isNotFound === undefined ? false : page.value.isNotFound)
const route = useRoute()
const router = useRouter()
const isHome = computed(() => route.path === '/')
const isInternal = computed(() => route.path.startsWith('/_'))

// 给 `ConfirmationOptions` 加一个 `content` 字段
declare module 'primevue/confirmationoptions' {
  interface ConfirmationOptions {
    content?: VNode
  }
}

const store = useRegionCheckStore()

const checkRegion = () => {
  if (!!store.ignoreUnsupportedRegion) {
    return
  }

  if (!loc || typeof loc !== 'string') {
    setTimeout(checkRegion, 100)
    return
  }

  if (!isDev && loc !== 'CN') {
    return
  }

  confirm.require({
    defaultFocus: 'accept',
    header: '不受支持的地区',
    content: h('p', [
      '尊敬的用户, 我们注意到您正在从中国大陆访问本网站', h('br'),
      '这可能会违反您所在国家与地区的法律法规, 须由您承担一切后果', h('br'),
      '如有需要, 您可以访问 `', h('a', { href: '/_/DataManage', class: 'underline' }, '数据管理页面'), ' > 区域检查` 以设置本弹窗永不弹出'
    ],),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: {
      icon: 'pi pi-check',
      label: '关闭网站 (白屏警告)',
      title: '关闭当前网站 (可能出现大面积白色页面)',
    },
    rejectProps: {
      icon: 'pi pi-times',
      label: '关闭弹窗',
      title: '这可能带来法律风险',
      severity: 'danger',
      outlined: true,
    },
    position: 'center',
    blockScroll: true,
    accept() {
      closeAll()
    },
    reject() {
      // store.ignoreUnsupportedRegion = true
    }
  })
}

function enableTransitions() {
  return 'startViewTransition' in document
    && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
}

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value
    return
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )}px at ${x}px ${y}px)`,
  ]

  // @ts-ignore
  await document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  }).ready

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 300,
      easing: 'ease-in',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
    },
  )
})

// checkRegion()
</script>

<template>
  <Toast />
  <ConfirmDialog :draggable="false" :closable="false">
    <template #message="slotProps">
      <span v-if="!!slotProps.message.icon" :class="slotProps.message.icon" class="!text-6xl text-primary-500" />
      <p v-if="!!slotProps.message.message">{{ slotProps.message.message }}</p>
      <component v-if="!!slotProps.message.content" :is="slotProps.message.content" />
    </template>
  </ConfirmDialog>
  <Analytics v-if="!isNotFound && !isHome && !isInternal" />
  <ClientOnly>
    <Layout />
  </ClientOnly>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;

  & .check {
    transform: none !important;
  }
}
</style>