(function(){

if(window.AryaDevTools)return
window.AryaDevTools=true

const logs=[]
const wsLogs=[]
const plugins=[]

/* ---------------------------
FETCH INTERCEPT
--------------------------- */

const origFetch=window.fetch

window.fetch=async(...args)=>{

const start=performance.now()

const res=await origFetch(...args)

const clone=res.clone()

let body=null

try{body=await clone.text()}catch{}

logs.push({
type:"fetch",
method:"GET",
url:args[0],
status:res.status,
start,
end:performance.now(),
time:(performance.now()-start).toFixed(0),
requestBody:null,
response:body
})

updateNetwork()

return res

}

/* ---------------------------
XHR INTERCEPT
--------------------------- */

const origOpen=XMLHttpRequest.prototype.open
const origSend=XMLHttpRequest.prototype.send

XMLHttpRequest.prototype.open=function(method,url){

this._method=method
this._url=url

return origOpen.apply(this,arguments)

}

XMLHttpRequest.prototype.send=function(body){

const start=performance.now()

this.addEventListener("load",()=>{

logs.push({
type:"xhr",
method:this._method,
url:this._url,
status:this.status,
start,
end:performance.now(),
time:(performance.now()-start).toFixed(0),
requestBody:body,
response:this.responseText
})

updateNetwork()

})

return origSend.apply(this,arguments)

}

/* ---------------------------
WEBSOCKET INTERCEPT
--------------------------- */

const OrigWS=window.WebSocket

window.WebSocket=function(url,proto){

const ws=new OrigWS(url,proto)

ws.addEventListener("message",e=>{

wsLogs.push({
url,
data:e.data,
time:new Date().toLocaleTimeString()
})

updateWS()

})

return ws

}

/* ---------------------------
STYLE
--------------------------- */

const style=document.createElement("style")

style.innerHTML=`

#adt{
position:fixed;
bottom:0;
left:0;
width:100%;
height:420px;
background:#1e1e1e;
color:#ddd;
font-family:monospace;
z-index:999999;
display:flex;
flex-direction:column;
border-top:2px solid #3c3c3c;
}

#adt-header{
background:#2d2d2d;
padding:6px;
display:flex;
justify-content:space-between;
}

#adt-tabs{
display:flex;
background:#252526;
border-bottom:1px solid #333;
}

#adt-tabs button{
background:transparent;
border:none;
color:#ccc;
padding:6px 10px;
cursor:pointer;
}

#adt-tabs button:hover{
background:#333;
}

#adt-content{
flex:1;
overflow:auto;
padding:8px;
}

table{
width:100%;
border-collapse:collapse;
font-size:12px;
}

td{
border-bottom:1px solid #333;
padding:4px;
}

.url{
color:#4fc3f7;
word-break:break-all;
}

pre{
white-space:pre-wrap;
}

`

document.head.appendChild(style)

/* ---------------------------
PANEL
--------------------------- */

const panel=document.createElement("div")
panel.id="adt"

panel.innerHTML=`

<div id="adt-header">
<b>DevTools</b>
<button id="adt-close">close</button>
</div>

<div id="adt-tabs"></div>

<div id="adt-content"></div>

`

document.body.appendChild(panel)

const tabs=document.getElementById("adt-tabs")
const content=document.getElementById("adt-content")

/* ---------------------------
TABS
--------------------------- */

const tabNames=[
"Network",
"Waterfall",
"WebSocket",
"Request",
"Response",
"DOM",
"API Timeline",
"Scripts",
"Plugins"
]

tabNames.forEach(t=>{

const b=document.createElement("button")
b.textContent=t
b.onclick=()=>showTab(t)

tabs.appendChild(b)

})

function showTab(name){

if(name==="Network")renderNetwork()
if(name==="Waterfall")renderWaterfall()
if(name==="WebSocket")renderWS()
if(name==="Request")renderRequest()
if(name==="Response")renderResponse()
if(name==="DOM")renderDOM()
if(name==="API Timeline")renderTimeline()
if(name==="Scripts")renderScripts()
if(name==="Plugins")renderPlugins()

}

/* ---------------------------
NETWORK
--------------------------- */

function renderNetwork(){

content.innerHTML=`

<h3>Network</h3>

<input id="search" placeholder="search">

<table>
<thead>
<tr>
<td>#</td>
<td>Method</td>
<td>Status</td>
<td>Time</td>
<td>URL</td>
</tr>
</thead>

<tbody id="net-body"></tbody>
</table>

`

updateNetwork()

document.getElementById("search").oninput=updateNetwork

}

function updateNetwork(){

const body=document.getElementById("net-body")
if(!body)return

const search=document.getElementById("search")?.value||""

body.innerHTML=""

logs.forEach((l,i)=>{

if(search&&!l.url.includes(search))return

const tr=document.createElement("tr")

tr.innerHTML=`

<td>${i}</td>
<td>${l.method}</td>
<td>${l.status}</td>
<td>${l.time}ms</td>
<td class="url">${l.url}</td>

`

body.appendChild(tr)

})

}

/* ---------------------------
WATERFALL
--------------------------- */

function renderWaterfall(){

content.innerHTML="<h3>Waterfall</h3>"

logs.forEach(l=>{

const bar=document.createElement("div")

bar.style.background="#4fc3f7"
bar.style.height="6px"
bar.style.margin="3px 0"
bar.style.width=(l.time*2)+"px"

content.appendChild(document.createTextNode(l.url))
content.appendChild(bar)

})

}

/* ---------------------------
REQUEST
--------------------------- */

function renderRequest(){

content.innerHTML=`

<h3>Request Viewer</h3>

<input id="req-i" placeholder="index">
<button id="req-btn">view</button>

<pre id="req-out"></pre>

`

document.getElementById("req-btn").onclick=()=>{

const i=document.getElementById("req-i").value

const log=logs[i]

if(!log)return

document.getElementById("req-out").textContent=
JSON.stringify({
url:log.url,
method:log.method,
body:log.requestBody
},null,2)

}

}

/* ---------------------------
RESPONSE
--------------------------- */

function renderResponse(){

content.innerHTML=`

<h3>Response Viewer</h3>

<input id="res-i" placeholder="index">
<button id="res-btn">view</button>

<pre id="res-out"></pre>

`

document.getElementById("res-btn").onclick=()=>{

const i=document.getElementById("res-i").value

const log=logs[i]

if(!log)return

let data=log.response

try{
data=JSON.stringify(JSON.parse(data),null,2)
}catch{}

document.getElementById("res-out").textContent=data

}

}

/* ---------------------------
WEBSOCKET
--------------------------- */

function renderWS(){

content.innerHTML="<h3>WebSocket</h3><div id='ws'></div>"

updateWS()

}

function updateWS(){

const ws=document.getElementById("ws")
if(!ws)return

ws.innerHTML=""

wsLogs.forEach(m=>{

const d=document.createElement("div")

d.textContent=m.time+" "+m.url+" "+m.data

ws.appendChild(d)

})

}

/* ---------------------------
DOM INSPECTOR
--------------------------- */

function renderDOM(){

content.innerHTML="<h3>Click element to inspect</h3>"

document.body.onclick=function(e){

e.preventDefault()
e.stopPropagation()

const el=e.target

content.innerHTML=

"<h3>Element</h3>"+
"<pre>"+el.outerHTML+"</pre>"+
"<h3>CSS</h3>"+
"<pre>"+JSON.stringify(getComputedStyle(el),null,2)+"</pre>"

document.body.onclick=null

}

}

/* ---------------------------
API TIMELINE
--------------------------- */

function renderTimeline(){

content.innerHTML="<h3>API Timeline</h3>"

logs.forEach(l=>{

const d=document.createElement("div")

d.textContent=new Date(l.start).toLocaleTimeString()+" → "+l.url

content.appendChild(d)

})

}

/* ---------------------------
SCRIPT GRAPH
--------------------------- */

function renderScripts(){

content.innerHTML="<h3>Scripts</h3>"

const scripts=[...document.querySelectorAll("script[src]")]

scripts.forEach(s=>{

const d=document.createElement("div")
d.textContent=s.src

content.appendChild(d)

})

}

/* ---------------------------
PLUGIN SYSTEM
--------------------------- */

function registerPlugin(name,fn){

plugins.push({name,fn})

}

function renderPlugins(){

content.innerHTML="<h3>Plugins</h3>"

plugins.forEach(p=>{

const btn=document.createElement("button")

btn.textContent=p.name

btn.onclick=()=>p.fn(content)

content.appendChild(btn)

})

}

/* ---------------------------
CLOSE
--------------------------- */

document.getElementById("adt-close").onclick=()=>panel.remove()

/* ---------------------------
START
--------------------------- */

showTab("Network")

})()
