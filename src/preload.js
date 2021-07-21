const fs = require("fs");
const electron = require('electron');
const contextBridge=electron.contextBridge;
const ipcRenderer=electron.ipcRenderer;



contextBridge.exposeInMainWorld(
    "api", {
        ipcR: ipcRenderer,
        fs: fs,
        setJSON: (stringdata,variables,path) => {
            if (path!=""){
            fs.writeFileSync(path,JSON.stringify({"dictionary":stringdata,"variables":variables}), 'utf8')
            } else{
                return false
            }
        }
    }
  );