// PM2 process definitions for the Ubuntu server.
// .cjs because the root package.json sets "type": "module".
//
//   pm2 start ecosystem.config.cjs
//   pm2 save
//
// Adjust `cwd` if the repo lives somewhere other than /var/www/audio-guest-book.

const APP_DIR = "/var/www/html/nader";

module.exports = {
  apps: [
    {
      // Express + Socket.IO API behind https://api.mouadhattia.xyz
      // Reads backend/.env.production because NODE_ENV=production.
      name: "agb-api",
      cwd: APP_DIR,
      script: "backend/server.js",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      // Socket.IO holds long-lived connections; never kill on idle.
      kill_timeout: 5000,
    },
    {
      // Static frontend behind https://mouadhattia.xyz
      // Bound to 127.0.0.1 so port 3331 is not reachable from the internet —
      // nginx is the only thing that talks to it.
      // Delete this app if you switch the nginx vhost to Option B (serve dist/).
      name: "agb-web",
      cwd: APP_DIR,
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 127.0.0.1 --port 3331",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
