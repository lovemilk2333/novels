<template>
  <!-- <div class="analytics"> -->
  <div>
    <Drawer id="analyticsDrawer" v-model:visible="showDialog" style="height: auto" position="bottom"
      :dismissable="false" :showCloseIcon="false" :closable="false" :blockScroll="true" @show="onShow" @hide="stopObserver">
      <template #header>
        <!-- m-auto 居中 -->
        <div class="p-drawer-title" flex select-none m="auto">
          <p>用户行为收集提示</p>
        </div>
      </template>

      <div text="center" select-none>
        <p>该网站使用 Analytics, 这是为了帮助我们提供更好的用户体验, 给用户带来福祉.</p>
        <p>我们使用的 Analytics 服务提供商: <a underline target="_blank" href="https://www.google.com/analytics/terms/">Google Analytics</a>, <a underline target="_blank" href="https://clarity.microsoft.com/terms">Microsoft Clarity</a> 以及 <a underline target="_blank" href="https://www.cloudflare.com/website-terms/">Cloudflare Web Analytics</a>.</p>
        <p c-red m-t-1.7>若您点击了 "接受并同意 Analytics", 这也意味着您已仔细阅读并均已接受和同意上述 Analytics 服务提供商的相关隐私政策和用户协议.</p>
        <div m-t-4 justify-center flex gap-2>
          <Button label="数据管理" title="转到数据管理页面" icon="pi pi-database" severity="secondary"
            @click="router.go('/_/DataManage')" />
          <Button label="返回主页" title="转到主页" icon="pi pi-home" severity="secondary" @click="router.go('/')" />
        </div>
      </div>
      <template #footer>
        <div justify-center flex gap-6>
          <Button label="接受并同意 Analytics" title="请确认您已仔细阅读并均已接受和同意上述 Analytics 服务提供商的相关隐私政策和用户协议并同意 Analytics"
            severity="success" icon="pi pi-check" @click="approveAnalytics" :disabled="disableButtons" />
          <Button label="关闭网站 (白屏警告)" title="关闭当前网站 (可能出现大面积白色页面)" severity="danger" outlined icon="pi pi-times" @click="handleClose"
            :disabled="disableButtons" />
        </div>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useRouter } from 'vitepress';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useAnalyticsStore } from "../../../stores/analytics";

// @ts-ignore
const isDev: boolean = !!import.meta.env.DEV;
const toast = useToast();
const router = useRouter()

let stopObserver: (() => void) | undefined;
const checkDrawer = async () => {
  await nextTick()  // 等待组件渲染完成

  const analyticsDrawer = document.getElementById("analyticsDrawer")
  analyticsDrawer ? analyticsDrawer.removeAttribute('id') : void 0

  const onHide = () => {
    hideApp()
    toast.add(
      { severity: 'warn', summary: '用户行为收集提示弹窗', detail: `用户行为收集提示弹窗未预料地不再视口内, 即将自动刷新网站`, life: 2000, closable: false }
    );
    setTimeout(() => {
      location.reload()
    }, 2000)
  }

  if (!analyticsDrawer) {
    onHide()
    return
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];

    if (showDialog.value && !entry.isIntersecting) {
      onHide()
    }
  }, {
    threshold: 0
  })

  intersectionObserver.observe(analyticsDrawer)

  const analyticsDrawerParent = analyticsDrawer.parentElement
  // slice(0) to copy
  const oldStyles = [  // HTMLElement 不能当作 object key 使用, 所以用数组存储
    [analyticsDrawer, analyticsDrawer?.style?.cssText?.slice(0)],
    [analyticsDrawerParent, analyticsDrawerParent?.style?.cssText?.slice(0)]
  ]

  const oldClasses: Array<Array<any>> = []

  setTimeout(() => {
    oldClasses.push([analyticsDrawer, analyticsDrawer?.className?.slice(0)])
    oldClasses.push([analyticsDrawerParent, analyticsDrawerParent?.className?.slice(0)])
  }, 800)

  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const [_, oldStyle] = oldStyles.filter(([element, _]) => element === mutation.target)[0]
        // @ts-ignore
        const newStyle = mutation.target?.style?.cssText

        if (oldStyle === newStyle) {
          continue
        }

        // @ts-ignore
        // overwrite style
        mutation.target.setAttribute('style', oldStyle ?? '');
        toast.add(
          { severity: 'warn', summary: '用户行为收集提示弹窗', detail: `请勿修改用户行为收集提示弹窗样式, 现已自动重置`, life: 3000, closable: false }
        );
      } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (!oldClasses.length) {
          continue
        }

        const [_, oldClass] = oldClasses.filter(([element, _]) => element === mutation.target)[0]
        // @ts-ignore
        const newClass = mutation.target?.className

        if (oldClass === newClass) {
          continue
        }

        // @ts-ignore
        // overwrite style
        mutation.target.setAttribute('class', oldClass ?? '');
        toast.add(
          { severity: 'warn', summary: '用户行为收集提示弹窗', detail: `请勿修改用户行为收集提示弹窗 class, 现已自动重置`, life: 3000, closable: false }
        );
      }
    }
  })
  mutationObserver.observe(analyticsDrawer, {
    attributes: true,
    attributeFilter: ['style', 'class']
  })

  if (analyticsDrawerParent) {
    mutationObserver.observe(analyticsDrawerParent, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }

  return () => {
    intersectionObserver.disconnect()
    mutationObserver.disconnect()
  }
}

const onShow = async () => {
  stopObserver = await checkDrawer()
  // 切换路由后立即停止监听
  stopObserver ? router.onAfterRouteChanged = stopObserver : void 0
}

const disableButtons = ref(false);
const store = useAnalyticsStore();
const showDialog = computed(() => !store.agreed);

function approveAnalytics() {
  store.agreed = true
}

const tillApprove = new Promise((resolve) => {
  if (store.agreed) {
    resolve(void 0)
  }

  store.$subscribe((_, { agreed }) => {
    if (agreed) {
      resolve(void 0)
    }
  })
})

function hideApp() {
  document.head.style.transition = 'display 2s ease';
  // @ts-ignore
  document.getElementById("app").remove();
}

function handleClose() {
  hideApp()
  // 【官方 MV】Never Gonna Give You Up - Rick Astley
  // B 站视频时间跳转好像有问题, t=0 (或 t=0.0) 不生效, 参见 https://www.bilibili.com/opus/988151539685130245
  // location.assign("https://www.bilibili.com/video/BV1GJ411x7h7/?t=0.1")

  location.assign('about:blank')
  window.close()
}

const loadAll = async () => {
  await tillApprove;
  if (isDev) {
    setTimeout(() => {
      toast.add(
        { severity: 'info', summary: 'Analytics', detail: `停止加载 Analytics 脚本: 位于开发环境`, life: 3000 }
      );
    }, 300)
    return
  }

  let errorCount = 0;

  try {
    await loadClarity();
  } catch (e) {
    errorCount++;
    console.error(e);
    toast.add(
      { severity: 'error', summary: 'Analytics', detail: `加载 Microsoft Clarity 失败`, life: 3000 }
    );
  }
  try {
    await loadGoogleAnalytics();
  } catch (e) {
    errorCount++;
    console.error(e);
    toast.add(
      { severity: 'error', summary: 'Analytics', detail: `加载 Google Analytics 失败`, life: 3000 }
    );
  }

  try {
    await loadCloudflareWebAnalytics();
  } catch (e) {
    errorCount++;
    console.error(e);
    toast.add(
      { severity: 'error', summary: 'Analytics', detail: `加载 Cloudflare Web Analytics 失败`, life: 3000 }
    );
  }

  // if (!errorCount) {
  //   toast.add(
  //     { severity: 'success', summary: 'Analytics', detail: '已加载 Analytics 脚本', life: 1500 }
  //   );
  // }
}

const loadClarity = () => {
  return new Promise((resolve, reject) => {
    (function (c, l, a, r, i, t, y) {
      // @ts-ignore
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
      // @ts-ignore
      t = l.createElement(r);
      // @ts-ignore
      t.async = 1;
      // @ts-ignore
      t.src = "https://www.clarity.ms/tag/" + i;
      // @ts-ignore
      // t.classList.add('analytics-script')
      // @ts-ignore
      y = l.getElementsByTagName(r)[0];
      // @ts-ignore
      y.parentNode.insertBefore(t, y);
      // @ts-ignore
      t.onload = resolve
      // @ts-ignore
      t.onerror = reject
    })(window, document, "clarity", "script", "ode07yeuls");  // @ts-ignore
  });
}

const loadGoogleAnalytics = () => {
  return new Promise((resolve, reject) => {
    const gaScript = document.createElement('script');
    // gaScript.classList.add('analytics-script')
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-KM85VFC4LJ';
    gaScript.async = true;
    const e = document.getElementsByTagName('script')[0];
    // @ts-ignore
    e.parentNode.insertBefore(gaScript, e);
    gaScript.onload = resolve
    gaScript.onerror = reject

    // @ts-ignore
    window.dataLayer = window.dataLayer || [];

    // @ts-ignore
    function gtag() { dataLayer.push(arguments); }

    // @ts-ignore
    gtag('js', new Date());
    // @ts-ignore
    gtag('config', 'G-KM85VFC4LJ');
  });
}

const loadCloudflareWebAnalytics = () => {
  return new Promise((resolve, reject) => {
    const waScript = document.createElement('script');
    // waScript.classList.add('analytics-script')
    waScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    waScript.setAttribute('data-cf-beacon', '{"token": "8e4bf037dcb24075b412a20765ffde63"}')
    waScript.defer = true;
    const e = document.getElementsByTagName('script')[0];
    // @ts-ignore
    e.parentNode.insertBefore(waScript, e);
    waScript.onload = resolve
    waScript.onerror = reject
  });
}

loadAll().then();
</script>
