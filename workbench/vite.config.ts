import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Single source of truth: the workbench embeds the kit's tools and the
// starter's assets/map by copying them into public/ at startup — nothing
// here is a fork, so editing a tool in tools/ updates the workbench too.
function syncKitFiles(): Plugin {
  const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
  return {
    name: 'sync-kit-files',
    config() {
      mkdirSync(here('./public/tools'), { recursive: true });
      cpSync(here('../tools/sprite-preview'), here('./public/tools/sprite-preview'), {
        recursive: true,
      });
      cpSync(here('../tools/particle-juice'), here('./public/tools/particle-juice'), {
        recursive: true,
      });
      cpSync(here('../tools/design-doc-template.md'), here('./public/design-doc-template.md'));
      cpSync(here('../starter/public/assets'), here('./public/assets'), { recursive: true });
      cpSync(here('../starter/src/config/map.json'), here('./public/map-default.json'));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [syncKitFiles(), react()],
  build: {
    target: 'es2022',
  },
});
