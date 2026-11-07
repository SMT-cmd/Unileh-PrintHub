import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const server = await createServer({
  server: { middlewareMode:true, hmr:false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
  logLevel: 'warn'
});
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const html = renderToString(React.createElement(App));
  if (!html.includes('Life gets easier') || !html.includes('Printing &amp; Photocopying')) {
    throw new Error('Server-rendered homepage is missing required service text');
  }
  const filename = resolve('dist/index.html');
  const source = await readFile(filename, 'utf8');
  const marker = '<div id="root"></div>';
  if (!source.includes(marker)) throw new Error('Expected React root missing from Vite output');
  const result = source.replace(marker, '<div id="root">'+html+'</div>');
  await writeFile(filename, result);
  process.stdout.write('Prerendered AfriNet Hub homepage for crawlable HTML.\n');
} finally {
  await server.close();
}
