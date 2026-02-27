import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { ChipsSDK } from '@chips/sdk';

import App from './App.vue';
import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';
import { jaJP } from './locales/ja-JP';
import './styles/index.css';

const app = createApp(App);
const pinia = createPinia();

const sdk = new ChipsSDK({
  autoConnect: true,
  debug: import.meta.env.DEV
});

sdk.i18n.addTranslation('zh-CN', zhCN);
sdk.i18n.addTranslation('en-US', enUS);
sdk.i18n.addTranslation('ja-JP', jaJP);

app.use(pinia);
app.provide('sdk', sdk);

sdk
  .initialize()
  .then(() => {
    app.mount('#app');
  })
  .catch((error: unknown) => {
    const root = document.querySelector('#app');
    if (!root) {
      return;
    }

    const reason = error instanceof Error ? error.message : String(error);
    root.innerHTML = [
      '<div class="chips-settings-bootstrap-error">',
      `<h1 class="chips-settings-bootstrap-error__title">${zhCN.i18n.plugin['699010']}</h1>`,
      `<p class="chips-settings-bootstrap-error__desc">${zhCN.i18n.plugin['699011']}</p>`,
      `<pre class="chips-settings-bootstrap-error__reason">${reason}</pre>`,
      '</div>'
    ].join('');
  });
