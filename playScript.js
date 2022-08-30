const socket=io(`http://browser-minecraft.herokuapp.com`,{transports:['websocket'],allowUpgrades:false});
var isConnected=false;
var html={};
var controlsDisabled=true;
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
html.botStats=document.querySelector("#botStats");
html.firstPerson=document.querySelector("#firstPersonCheck");
function connectMinecraft(){
if(socket.connected){
html.errortext.innerText="Sent a Minecraft server connection request, waiting for response...";
var username=html.username.value.replace(/[^0-9a-zA-Z_]/g,"");
var serverip=html.serverip.value.replace(/[^0-9a-zA-Z_\-.]/g,"");
var serverport=html.serverport.value;
var firstPerson=html.firstPerson.checked;
socket.emit("connectMinecraft",{username:username,serverip:serverip,serverport:serverport,firstPerson:firstPerson});
}else{
html.errortext.innerText="Not connected to the server.";
}}
socket.on(`connect`,()=>{html.errortext.innerText="Connected to the server.";updateScreen();});
socket.on(`disconnect`,()=>{isConnected=false;html.errortext.innerText="Disconnected from the server.";updateScreen();});
socket.on(`minecraftConnection`,(data)=>{
isConnected=true;
document.title=`${data.username}@${data.server} - BrowserMinecraft`;
html.screen.src=data.url;
html.botUsername.innerText=data.username;
html.botStats.innerHTML=`${data.health.toFixed(2)} HP<br>X: ${data.xPos.toFixed(2)} Y: ${data.yPos.toFixed(2)} Z: ${data.zPos.toFixed(2)}`;
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
controlsDisabled=false;
}else{
controlsDisabled=true;
document.title=`Connect - BrowserMinecraft`;
html.gameChat.innerHTML="";
html.screen.src="";
html.botUsername.innerText="-";
html.botStats.innerText="-";
html.gameChatInput.value="";
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
html.gameChatInput.blur();
}
}
socket.on(`minecraftChatMessage`,(data)=>{addChatMessage("chat",data.username,data.message);});
socket.on(`minecraftWhisperMessage`,(data)=>{addChatMessage("whisper",data.username,data.message);});
socket.on(`minecraftPlayerJoined`,(data)=>{addChatMessage("join",data.username);});
socket.on(`minecraftPlayerLeft`,(data)=>{addChatMessage("leave",data.username);});
socket.on(`minecraftPlayerStats`,(data)=>{
html.botStats.innerHTML=`${data.health.toFixed(2)} HP<br>X: ${data.xPos.toFixed(2)} Y: ${data.yPos.toFixed(2)} Z: ${data.zPos.toFixed(2)}`;
});
var pressedKeys=[];
document.addEventListener("keydown",(e)=>{
if(e.keyCode==17||e.ctrlKey)e.preventDefault();
var key=e.key.toLowerCase();
if(!pressedKeys.includes(key)){
if(!key.startsWith("arrow"))pressedKeys.push(key);
if(!controlsDisabled){
if(key=="/"){html.gameChatInput.focus();}
if(key=="t"){html.gameChatInput.focus();html.gameChatInput.value="";}
if(key=="w"){socket.emit("minecraftAction","w");}
if(key=="a"){socket.emit("minecraftAction","a");}
if(key=="s"){socket.emit("minecraftAction","s");}
if(key=="d"){socket.emit("minecraftAction","d");}
if(key==" "){socket.emit("minecraftAction","jump");}
if(key=="shift"){e.preventDefault();socket.emit("minecraftAction","sneak");}
if(key=="control"){socket.emit("minecraftAction","sprint");}
if(key=="arrowup"){socket.emit("minecraftAction","lookup");}
if(key=="arrowleft"){socket.emit("minecraftAction","lookleft");}
if(key=="arrowdown"){socket.emit("minecraftAction","lookdown");}
if(key=="arrowright"){socket.emit("minecraftAction","lookright");}
}}
});
document.addEventListener("keyup",(e)=>{
var key=e.key.toLowerCase();
var index=pressedKeys.indexOf(key);
if(index!==-1){pressedKeys.splice(index,1);}
if(key=="w"){socket.emit("minecraftStopAction","w");}
if(key=="a"){socket.emit("minecraftStopAction","a");}
if(key=="s"){socket.emit("minecraftStopAction","s");}
if(key=="d"){socket.emit("minecraftStopAction","d");}
if(key==" "){socket.emit("minecraftStopAction","jump");}
if(key=="shift"){socket.emit("minecraftStopAction","sneak");}
//if(key=="control"){socket.emit("minecraftStopAction","sprint");}
});
html.gameChatInput.onfocus=function(){controlsDisabled=true;};
html.gameChatInput.onblur=function(){controlsDisabled=false;};