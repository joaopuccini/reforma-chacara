import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  preview: {
    buckets: {
      "plantas-versoes": { access: "public_read" }
    }
  }
});
