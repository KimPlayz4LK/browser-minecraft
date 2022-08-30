const socket=io(`https://browser-minecraft.kimplayz4lk.repl.co/`,{transports:['websocket'],allowUpgrades:false});
var isConnected=false;
var html={};
html.username=document.querySelector("#username");
html.serverip=document.querySelector("#serverip");
html.serverport=document.querySelector("#serverport");
html.connectbutton=document.querySelector("#connectButton");
html.errortext=document.querySelector("#errorText");
html.screen=document.querySelector("#gameScreen");
html.botUsername=document.querySelector("#botUsername");
html.connectbutton.addEventListener("click",connectMinecraft);
html.gameChat=document.querySelector(`#gameChat ul`);
html.gameChatInput=document.querySelector(`#gameChatInput`);

function connectMinecraft(){
if(socket.connected){
html.errortext.innerText="Sent a Minecraft server connection request, waiting for response...";
var username=html.username.value.replace(/[^0-9a-zA-Z_]/g,"");
var serverip=html.serverip.value.replace(/[^0-9a-zA-Z_\-.]/g,"");
var serverport=html.serverport.value;
socket.emit("connectMinecraft",{username:username,serverip:serverip,serverport:serverport});
}else{
html.errortext.innerText="Not connected to the server.";
}}

socket.on(`connect`,()=>{html.errortext.innerText="Connected to the server.";updateScreen();});
socket.on(`disconnect`,()=>{isConnected=false;html.errortext.innerText="Disconnected from the server.";updateScreen();});

socket.on(`minecraftConnection`,(data)=>{
isConnected=true;
document.title=`${data.username}@${data.server} - BrowserMinecraft`;
html.screen.src=data.url;
html.botUsername=data.username;
html.errortext.innerHTML=`Connected to the Minecraft server.`;
updateScreen();
});

socket.on(`minecraftConnectionError`,(data)=>{
isConnected=false;
html.errortext.innerHTML=`An error occured while connecting to the Minecraft server.<br>Reason: ${data}`;
updateScreen();
});

socket.on(`minecraftConnectionKicked`,(data)=>{
isConnected=false;
html.errortext.innerHTML=`Kicked from the Minecraft server.<br>Reason: ${data}`;
updateScreen();
});

function updateScreen(){
if(isConnected){
document.querySelector("#connectionMenu").style.display="none";
document.querySelector("#game").style.display="block";
}else{
document.title=`Connect - BrowserMinecraft`;
document.querySelector("#connectionMenu").style.display="block";
document.querySelector("#game").style.display="none";
}}
function addChatMessage(type,username,message){
if(type=="join"){html.gameChat.appendChild(newLi(`${username} joined the game`,"joinleave"));}
if(type=="leave"){html.gameChat.appendChild(newLi(`${username} left the game`,"joinleave"));}
if(type=="chat"){html.gameChat.appendChild(newLi(`<${username}> ${message}`,"chat"));}
if(type=="whisper"){html.gameChat.appendChild(newLi(`<${username}> ${message}`,"whisper"));}
}
function newLi(text,className){
var li=document.createElement("li");
li.innerText=text;
li.classList.add(className);
return li;
}
html.gameChatInput.addEventListener(`keyup`,e=>{
if(e.keyCode==13){sendChatMessage();}
});
function sendChatMessage(){
if(isConnected){
var message=html.gameChatInput.value;
socket.emit("sendChatMessage",message);
html.gameChatInput.value="";
}
}