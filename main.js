const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 842,
    height: 500,
    // width: 600,
    // height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  //win.webContents.openDevTools();

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const toko = require('./toko.js');
