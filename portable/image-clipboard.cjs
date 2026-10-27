const {Blob}=require('node:buffer');
async function writeImagePNG({clipboard,ClipboardItem,nativeImage},data){
 if(typeof data!=='string'||!data.startsWith('data:image/png;base64,')||data.length>140*1024*1024)throw Error('Invalid PNG');
 const image=nativeImage.createFromDataURL(data);if(image.isEmpty())throw Error('图片内容为空');
 const {width,height}=image.getSize();if(width*height>60000000)throw Error('图片过大，请分段复制');
 const png=image.toPNG();
 if(typeof clipboard.write==='function'&&typeof ClipboardItem==='function'){
  await clipboard.write([new ClipboardItem({'image/png':new Blob([new Uint8Array(png)],{type:'image/png'})})]);
 }else if(typeof clipboard.writeImage==='function'){
  await clipboard.writeImage(image);
 }else throw Error('当前运行环境不支持图片剪贴板');
 return {ok:true,width,height};
}
module.exports={writeImagePNG};
