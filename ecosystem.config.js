module.exports = {
  apps: [{
    name: "lobi-bot",
    script: "./index.js",
    watch: false,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 50,
    env: {
      NODE_ENV: "production"
    }
  }]
};
