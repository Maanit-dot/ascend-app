const { app } = require("electron");
const { fork } = require("child_process");
const path = require("path");
const http = require("http");

app.whenReady().then(() => {
  const serverPath = path.resolve(__dirname, ".next/standalone/server.js");
  console.log("Forking server:", serverPath);
  const child = fork(serverPath, [], {
    cwd: path.dirname(serverPath),
    env: { ...process.env, PORT: "3007" },
  });

  setTimeout(() => {
    http.get("http://localhost:3007", (res) => {
      console.log("TEST_FORK_STATUS:", res.statusCode);
      child.kill();
      app.quit();
      process.exit(0);
    }).on("error", (e) => {
      console.error("TEST_FORK_ERR:", e.message);
      child.kill();
      app.quit();
      process.exit(1);
    });
  }, 4000);
});
