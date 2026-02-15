import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { ChipsSDK } from '@chips/sdk';
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();
const sdk = new ChipsSDK({
  autoConnect: true,
  debug: import.meta.env.DEV,
});

app.use(pinia);
app.use(router);

app.provide('sdk', sdk);

sdk
  .initialize()
  .then(() => {
    console.log('SDK initialized successfully');
    app.mount('#app');
  })
  .catch((error) => {
    console.error('Failed to initialize SDK:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>初始化失败</h1>
        <p>SDK 初始化失败，请检查薯片主机是否正常运行。</p>
        <pre>${error.message}</pre>
      </div>
    `;
  });
