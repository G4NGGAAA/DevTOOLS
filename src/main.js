(function(){

if(window.AryaDevTools){
 console.log("Arya DevTools already running");
 return;
}

window.AryaDevTools=true;

const logs=[];
let selectedIndex=null;

function safeJSON(text){
 try{
  return JSON.stringify(JSON.parse(text),null,2);
 }catch{
  return text;
 }
}

function addLog(data){
 logs.push(data);
 updateNetwork();
}

/* ================= FETCH ================= */

const origFetch=window.fetch;

window.fetch=async(...args)=>{

 const start=performance.now();

 let url=args[0];
 let options=args[1]||{};
 let body=options.body||"";

 const res=await origFetch(...args);
 const clone=res.clone();

 let text="";

 try{
  text=await clone.text();
 }catch{}

 const time=(performance.now()-start).toFixed(0)+"ms";

 addLog({
  method:options.method||"GET",
  url:url,
  status:res.status,
  body:body,
  response:text,
  time:time
 });

 return res;

};

/* ================= XHR ================= */

const origOpen=XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open=function(method,url){

 this._arya={
  method:method,
  url:url,
  start:Date.now()
 };

 return origOpen.apply(this,arguments);

};

const origSend=XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.send=function(body){

 this._arya.body=body||"";

 this.addEventListener("load",()=>{

  addLog({
   method:this._arya.method,
   url:this._arya.url,
   status:this.status,
   body:this._arya.body,
   response:this.responseText,
   time:(Date.now()-this._arya.start)+"ms"
  });

 });

 return origSend.apply(this,arguments);

};

/* ================= SEARCH ENDPOINT ================= */

function scanEndpoints(){

 const endpoints=new Set();

 document.querySelectorAll("script").forEach(s=>{

  const txt=s.innerText;

  const matches=txt.match(/https?:\/\/[^\s"'`]+/g);

  if(matches){
   matches.forEach(e=>endpoints.add(e));
  }

 });

 return [...endpoints];

}

/* ================= FILTER ================= */

function filterLogs(method){

 return logs.filter(l=>l.method===method);

}

/* ================= SEARCH ================= */

function searchLogs(q){

 return logs.filter(l=>l.url.includes(q));

}

/* ================= REPLAY ================= */

async function replayRequest(index){

 const log=logs[index];

 if(!log) return "Invalid index";

 const res=await fetch(log.url,{
  method:log.method,
  body:log.body
 });

 return res.status;

}

/* ================= EXPORT ================= */

function exportLogs(){

 const data=JSON.stringify(logs,null,2);

 const blob=new Blob([data],{type:"application/json"});

 const url=URL.createObjectURL(blob);

 const a=document.createElement("a");

 a.href=url;
 a.download="arya_network_logs.json";

 a.click();

}

/* ================= UI ================= */

const panel=document.createElement("div");

panel.style=`
position:fixed;
top:80px;
right:80px;
width:520px;
height:420px;
background:#070d18;
border:2px solid #2d8cff;
color:#9fd4ff;
font-family:monospace;
z-index:999999;
display:flex;
flex-direction:column;
resize:both;
overflow:hidden;
border-radius:10px;
`;

panel.innerHTML=`

<div id="hdr" style="
background:#08101f;
padding:6px;
cursor:move;
display:flex;
justify-content:space-between;
align-items:center;
">

<span>Arya DevTools</span>

<div>
<button id="min">_</button>
<button id="close">x</button>
</div>

</div>

<div style="display:flex;background:#08101f;flex-wrap:wrap">

<button id="tabNet">Network</button>
<button id="tabReq">Request</button>
<button id="tabRes">Response</button>
<button id="tabSearch">Endpoints</button>
<button id="tabFilter">Filter</button>
<button id="tabFind">Search</button>
<button id="tabReplay">Replay</button>
<button id="tabExport">Export</button>

</div>

<textarea id="out" style="
flex:1;
background:#020611;
color:#9fd4ff;
border:none;
padding:6px;
resize:none;
font-family:monospace;
"></textarea>

`;

document.body.appendChild(panel);

const out=document.getElementById("out");

/* ================= NETWORK TAB ================= */

function updateNetwork(){

 out.value=logs.map((l,i)=>{

 return `[${i}] ${l.method} ${l.status} ${l.time}
${l.url}

`;

 }).join("");

}

document.getElementById("tabNet").onclick=()=>{

 updateNetwork();

};

/* ================= REQUEST ================= */

document.getElementById("tabReq").onclick=()=>{

 const i=prompt("Log index?");

 if(!logs[i])return;

 selectedIndex=i;

 out.value=
"URL\n"+logs[i].url+
"\n\nMETHOD\n"+logs[i].method+
"\n\nBODY\n"+logs[i].body;

};

/* ================= RESPONSE ================= */

document.getElementById("tabRes").onclick=()=>{

 const i=selectedIndex ?? prompt("Log index?");

 if(!logs[i])return;

 out.value=safeJSON(logs[i].response);

};

/* ================= ENDPOINT ================= */

document.getElementById("tabSearch").onclick=()=>{

 const list=scanEndpoints();

 out.value=list.join("\n");

};

/* ================= FILTER ================= */

document.getElementById("tabFilter").onclick=()=>{

 const m=prompt("Method? GET / POST");

 const r=filterLogs(m.toUpperCase());

 out.value=r.map(x=>x.url).join("\n");

};

/* ================= SEARCH ================= */

document.getElementById("tabFind").onclick=()=>{

 const q=prompt("Search URL");

 const r=searchLogs(q);

 out.value=r.map(x=>x.url).join("\n");

};

/* ================= REPLAY ================= */

document.getElementById("tabReplay").onclick=async()=>{

 const i=prompt("Log index?");

 const status=await replayRequest(i);

 out.value="Replay status: "+status;

};

/* ================= EXPORT ================= */

document.getElementById("tabExport").onclick=()=>{

 exportLogs();

};

/* ================= CLOSE ================= */

document.getElementById("close").onclick=()=>{

 panel.remove();
 window.AryaDevTools=false;

};

/* ================= MINIMIZE ================= */

let minimized=false;

document.getElementById("min").onclick=()=>{

 minimized=!minimized;

 if(minimized){
  out.style.display="none";
 }else{
  out.style.display="block";
 }

};

/* ================= DRAG ================= */

let drag=false;
let ox,oy;

const hdr=document.getElementById("hdr");

hdr.onmousedown=e=>{
 drag=true;
 ox=e.clientX-panel.offsetLeft;
 oy=e.clientY-panel.offsetTop;
};

document.onmousemove=e=>{
 if(!drag)return;

 panel.style.left=e.clientX-ox+"px";
 panel.style.top=e.clientY-oy+"px";
};

document.onmouseup=()=>drag=false;

})();
