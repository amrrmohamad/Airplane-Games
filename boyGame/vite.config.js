import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5175,
    watch: {
      ignored: ['**/Downloads/**', '**/*.apk']
    }
  }
});
