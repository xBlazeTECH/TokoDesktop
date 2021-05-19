const { ipcMain } = require('electron');

ipcMain.on("updatePluginData", (evt, data) => {
  let payload = data.payload;
  if (voip[payload.key] == payload.data) return; // Player is the speaking player.
  voip[payload.key] = payload.data;
  setPlayerData(voip.serverId, "voip: " + payload.key, voip[payload.key], true);
  voip: updateConfig();
  voip: updateTokoVoipInfo(true);
  return "ok";
});

ipcMain.on("nuiLoaded", (evt, data) => {});

ipcMain.on("setPlayerTalking", (evt, data) => {});

let playersData = {};
function setPlayerdata(playerServerId, key, data, shared) {
  if (!key || data == null) return;
  if (!playersData[playerServerId]) {
    playersData[playerServerId] = {};
  }
  playersData[playerServerId][key] = { data = data, shared = shared };
  if (shared) {
    // Trigger Server Event Tokovoip:setPlayerData
  }
}


