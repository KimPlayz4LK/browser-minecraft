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
const lookModifier=0.1;

io.on(`connection`,async socket=>{
socket.on(`connectMinecraft`,async data=>{
bots[socket.id]=new MinecraftBot(data.username,data.serverip,data.serverport,socket,data.firstPerson);
});
socket.on(`sendChatMessage`,async data=>{
if(bots[socket.id])if(bots[socket.id].bot)bots[socket.id].bot.chat(data);
});
socket.on(`minecraftAction`,async data=>{
if(bots[socket.id]){
if(bots[socket.id].bot){
if(data=="w"){bots[socket.id].bot.setControlState("forward",true);}
if(data=="a"){bots[socket.id].bot.setControlState("right",true);}
if(data=="s"){bots[socket.id].bot.setControlState("back",true);}
if(data=="d"){bots[socket.id].bot.setControlState("left",true);}
if(data=="jump"){bots[socket.id].bot.setControlState("jump",true);}
if(data=="sneak"){bots[socket.id].bot.setControlState("sneak",true);}
if(data=="sprint"){bots[socket.id].bot.setControlState("sprint",true);}
if(data=="lookup"){bots[socket.id].bot.look(bots[socket.id].bot.entity.yaw,bots[socket.id].bot.entity.pitch+lookModifier);}
if(data=="lookleft"){bots[socket.id].bot.look(bots[socket.id].bot.entity.yaw+lookModifier,bots[socket.id].bot.entity.pitch);}
if(data=="lookdown"){bots[socket.id].bot.look(bots[socket.id].bot.entity.yaw,bots[socket.id].bot.entity.pitch-lookModifier);}
if(data=="lookright"){bots[socket.id].bot.look(bots[socket.id].bot.entity.yaw-lookModifier,bots[socket.id].bot.entity.pitch);}
}}
});
socket.on(`minecraftStopAction`,async data=>{
if(bots[socket.id]){
if(bots[socket.id].bot){
if(data=="w"){bots[socket.id].bot.setControlState("forward",false);}
if(data=="a"){bots[socket.id].bot.setControlState("right",false);}
if(data=="s"){bots[socket.id].bot.setControlState("back",false);}
if(data=="d"){bots[socket.id].bot.setControlState("left",false);}
if(data=="jump"){bots[socket.id].bot.setControlState("jump",false);}
if(data=="sneak"){bots[socket.id].bot.setControlState("sneak",false);}
if(data=="sprint"){bots[socket.id].bot.setControlState("sprint",!bots[socket.id].bot.getControlState("sprint"));}
}}
});
socket.on(`disconnect`,async data=>{
if(bots[socket.id]){if(bots[socket.id].bot){bots[socket.id].bot.viewer.close();bots[socket.id].bot.end();}}
delete bots[socket.id];
});
});

app.get(`/`,(req,res)=>{res.sendFile(__dirname+`/index.html`);});
app.get(`*`,(req,res)=>{
if(req.originalUrl!=`socket.io/socket.io.js`||req.originalUrl!=`log`){
res.sendFile(__dirname+`/${req.originalUrl}`);
}
});
http.listen(port,async ()=>{console.log(`Web server started at port ${port}`);});

function MinecraftBot(username,serverip,serverport,socket,firstPerson){
this.username=checkUsername(username);
this.serverip=serverip;
this.serverport=serverport||25565;
this.socket=socket;
this.viewerPort=random(10000,65535);
this.isFirstPerson=firstPerson==true||false?firstPerson:false;
this.bot=mineflayer.createBot({host:this.serverip,username:this.username,port:this.serverport});
this.bot.on("kicked",(reason)=>{minecraftKicked(this.socket,reason);});
this.bot.on("chat",(username,message)=>{minecraftChatMessage(this.socket,username,message);});
this.bot.on("health",()=>{minecraftSendPlayerStats(this.socket,{health:this.bot.health,xPos:this.bot.entity.position.x,yPos:this.bot.entity.position.y,zPos:this.bot.entity.position.z});});
this.bot.on("move",()=>{minecraftSendPlayerStats(this.socket,{health:this.bot.health,xPos:this.bot.entity.position.x,yPos:this.bot.entity.position.y,zPos:this.bot.entity.position.z});});
this.bot.on("whisper",(username,message)=>{minecraftWhisperMessage(this.socket,username,message);});
this.bot.on("messagestr",(message,type)=>{minecraftPlainMessage(this.socket,message);});
this.bot.on("playerJoined",(player)=>{minecraftPlayerJoined(this.socket,player);});
this.bot.on("playerLeft",(player)=>{minecraftPlayerLeft(this.socket,player);});
this.bot.on("error",(error)=>{minecraftError(this.socket,error);});
this.bot.once("spawn",async()=>{

await mineflayerViewer(this.bot,{port:this.viewerPort,firstPerson:this.isFirstPerson});
sendConnectionInfo(this.socket,{url:`http://localhost:${this.viewerPort}`,username:this.bot.username,server:`${this.serverip}:${this.serverport}`,health:this.bot.health,xPos:this.bot.entity.position.x,yPos:this.bot.entity.position.y,zPos:this.bot.entity.position.z});
});
}

function random(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function minecraftError(socket,error){socket.emit("minecraftConnectionError",`${error}`);}
function minecraftKicked(socket,error){socket.emit("minecraftConnectionKicked",`${error}`);}
function sendConnectionInfo(socket,data){socket.emit("minecraftConnection",data);}
function checkUsername(username){
if(username.length>=3&&username.length<=16)return username;
if(username.length>16)return username.substring(0,16);
if(username.length<3)return `${ug.generateUsername("",12)}${random(0,9999)}`;
}
function minecraftChatMessage(socket,username,message){socket.emit("minecraftChatMessage",{username:username,message:message});}
function minecraftPlainMessage(socket,message){socket.emit("minecraftPlainMessage",{message:message});}
function minecraftWhisperMessage(socket,username,message){socket.emit("minecraftWhisperMessage",{username:username,message:message});}
function minecraftPlayerJoined(socket,player){socket.emit("minecraftPlayerJoined",player);}
function minecraftPlayerLeft(socket,player){socket.emit("minecraftPlayerLeft",player);}
function minecraftSendPlayerStats(socket,data){socket.emit("minecraftPlayerStats",data);}