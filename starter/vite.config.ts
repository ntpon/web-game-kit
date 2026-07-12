import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';

// Dev-only: the map editor's Save button POSTs the whole map here and we write
// it back to src/config/map.json. Vite's module graph then reloads the page,
// so the demo restarts on the map you just edited.
function mapSaver(): Plugin {
  const target = new URL('./src/config/map.json', import.meta.url);
  return {
    name: 'map-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-map', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            JSON.parse(body); // validate before writing
            writeFileSync(target, body.endsWith('\n') ? body : `${body}\n`);
            res.statusCode = 200;
            res.end('ok');
          } catch (error) {
            res.statusCode = 400;
            res.end(String(error));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), mapSaver()],
  build: {
    target: 'es2022',
  },
});
