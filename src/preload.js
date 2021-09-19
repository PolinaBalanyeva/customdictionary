const fs = require("fs");
const electron = require('electron');
const contextBridge=electron.contextBridge;
const ipcRenderer=electron.ipcRenderer;
const JapaneseComparator =require("./japanese-comparator")
const spl= new JapaneseComparator().splitter;
const Encoding=require("encoding-japanese")

contextBridge.exposeInMainWorld(
    "api", {
        ipcR: ipcRenderer,
        fs: fs,
        jc: (list,bool) =>{
            return new JapaneseComparator().get(list,bool)
        },
        setTxt: (list) => {
            const sjisBytes = Encoding.convert(list.join(spl), {
                to: "SJIS",
                type: 'arraybuffer',
              });              
            fs.writeFileSync("./temp.txt",Buffer.from(sjisBytes))
        },
        setJSON: (stringdata,variables,path) => {
            if (path!=""){
            fs.writeFileSync(path,JSON.stringify({"dictionary":stringdata,"variables":variables},null,2), 'utf8')
            } else{
                return false
            }
        }
    }
  );