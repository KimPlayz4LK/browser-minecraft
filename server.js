var app=require('express')();
var ug=require('username-generator');
var http=require('http').createServer(app);
const io=require(`socket.io`)(http,{allowUpgrades:false});
const mineflayer=require("mineflayer");
const{mineflayer:mineflayerViewer}=require("prismarine-viewer");
require(`dotenv`);
const port=8080;
const fs=require(`fs`);
var bots={};

io.on(`connection`,async socket=>{
socket.on(`connectMinecraft`,async data=>{
bots[socket.id]=new MinecraftBot(data.username,data.serverip,data.serverport,socket);
});
socket.on(`sendChatMessage`,async data=>{
if(bots[socket.id].bot){bots[socket.id].bot.chat(message);}
});
socket.on(`disconnect`,async data=>{
delete bots[socket.id]
});
});

app.get(`/`,(req,res)=>{res.sendFile(__dirname+`/index.html`);});
app.get(`*`,(req,res)=>{
if(req.originalUrl!=`socket.io/socket.io.js`||req.originalUrl!=`log`){
res.sendFile(__dirname+`/${req.originalUrl}`);
}
});
http.listen(port,async ()=>{console.log(`Web server started at port ${port}`);});

function MinecraftBot(username,serverip,serverport,socket){
this.username=checkUsername(username);
this.serverip=serverip;
this.serverport=serverport||25565;
this.socket=socket;
this.viewerPort=random(10000,65535);
this.bot=mineflayer.createBot({host:this.serverip,username:this.username,port:this.serverport});
this.bot.on("kicked",(reason)=>{minecraftKicked(this.socket,reason);});
this.bot.on("chat",(username,message)=>{minecraftChatMessage(this.socket,username,message);});
this.bot.on("whisper",(username,message)=>{minecraftWhisperMessage(this.socket,username,message);});
this.bot.on("playerJoined",(username,message)=>{minecraftPlayerJoined(this.socket,username);});
this.bot.on("playerLeft",(username,message)=>{minecraftPlayerLeft(this.socket,username);});
this.bot.on("error",(error)=>{minecraftError(this.socket,error);});
this.bot.once("spawn",async()=>{
await mineflayerViewer(this.bot,{port:this.viewerPort,firstPerson:false});
sendConnectionInfo(this.socket,{url:`https://browser-minecraft.kimplayz4lk.repl.co:${this.viewerPort}`,username:this.bot.username,server:`${this.serverip}:${this.serverport}`});
});
}

function random(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function minecraftError(socket,error){socket.emit("minecraftConnectionError",`${error}`);}
function minecraftKick(socket,error){socket.emit("minecraftConnectionKick",`${error}`);}
function sendConnectionInfo(socket,data){
socket.emit("minecraftConnection",data);
}
function checkUsername(username){
if(username.length>=3&&username.length<=16)return username;
if(username.length>16)return username.substring(0,16);
if(username.length<3)return `${ug.generateUsername("",12)}${random(0,9999)}`;
}
function minecraftChatMessage(socket,username,message){socket.emit("minecraftChatMessage",{username:username,message:message});}
function minecraftWhisperMessage(socket,username,message){socket.emit("minecraftWhisperMessage",{username:username,message:message});}
function minecraftPlayerJoined(socket,username){socket.emit("minecraftPlayerJoined",{username:username});}
function minecraftPlayerLeft(socket,username){socket.emit("minecraftPlayerLeft",{username:username});}