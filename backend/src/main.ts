// Step 3 placeholder — replaced by NestJS bootstrap in Step 4.
// A minimal http server so `docker compose up` keeps the app container
// healthy and lets us confirm the build + compose wiring before any
// NestJS modules are wired in.

import { createServer } from 'http';

const port = Number(process.env.PORT ?? 3000);

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'starting',
      message: 'WorkLog starting...',
      path: req.url,
      timestamp: new Date().toISOString(),
    }),
  );
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`WorkLog starting YAY!!!... listening on :${port}`);
});
