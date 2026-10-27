const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('portableApp',{
 copyImage:png=>ipcRenderer.invoke('portable:copy-image',png),
 onCopyImage:handler=>ipcRenderer.on('portable:copy-image-at',(_,point)=>handler(point)),
 load:()=>ipcRenderer.sendSync('portable:load'),
 save:storage=>ipcRenderer.sendSync('portable:save',storage),
 onImport:handler=>ipcRenderer.on('portable:import-history',(_,text)=>handler(text)),
 onNotice:handler=>ipcRenderer.on('portable:notice',(_,text)=>handler(text))
});
