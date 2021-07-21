const electron = require('electron');
const fs = require('fs');
const app = electron.app;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;

app.on('ready', () => {
  // mainWindowを作成（windowの大きさや、Kioskモードにするかどうかなどもここで定義できる）
  mainWindow = new BrowserWindow({
    width: 1280, 
    height: 720,
    webPreferences: {
      // ｖ12 からデフォルト=true になった
      worldSafeExecuteJavaScript: true,
      // XSS対策としてnodeモジュールをレンダラープロセスで使えなくする
      nodeIntegration: false,
      // レンダラープロセスに公開するAPIのファイル
      // v12 からデフォルト=true になった 
      contextIsolation: true,
      preload: __dirname+ "/preload.js"
    }
  });
  mainWindow.loadFile('./index.html');

  

  // mainWindow.webContents.send('main-process-message', data);

  // ChromiumのDevツールを開く
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});

ipcMain.handle('del-confirm', async (event) => {
  const val = dialog.showMessageBoxSync(mainWindow,{
    message:"本当に削除しますか？",
    type:"question",
    buttons:["はい","いいえ"]
  }
  );
  return val;
});

ipcMain.handle('file-open', async (event) => {
  // ファイルを選択
  const paths = dialog.showOpenDialogSync(mainWindow, {
    buttonLabel: '開く',  // 確認ボタンのラベル
    filters: [
      { name: "JSON", extensions: ['json'] },
    ],
    properties:[
      'openFile',         // ファイルの選択を許可
    ]
  });
 
  // キャンセルで閉じた場合
  if( paths === undefined ){
    return({status: undefined});
  }
  const path = paths[0];
  // ファイルの内容を返却
 
  try {
    
    const buff = JSON.parse(fs.readFileSync(path));
    return({
      status: true,
      path: path,
      text: buff
    });
  }
  catch(error) {
    fs.writeFileSync(path,"[]","utf8");
    return({
      status: true,
      path: path,
      text: []
    });
  }
});
