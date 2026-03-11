(function(){

if(window.AryaDevTools)return
window.AryaDevTools=true

const logs=[]
const startTime=performance.now()

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
time:(performance.now()-start).toFixed(0),
response:body,
requestBody:null
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
time:(performance.now()-start).toFixed(0),
response:this.responseText,
requestBody:body
})

updateNetwork()

})

return origSend.apply(this,arguments)

}

/* ---------------------------
STYLE
--------------------------- */

const style=document.createElement("style")
style.innerHTML=`

#arya-devtools{
position:fixed;
top:40px;
right:40px;
width:720px;
height:480px;
background:linear-gradient(180deg,#0b1220,#050913);
border:1px solid #1e90ff;
border-radius:10px;
box-shadow:0 0 25px rgba(30,144,255,.4);
font-family:monospace;
color:#9fd4ff;
z-index:999999;
display:flex;
flex-direction:column;
resize:both;
overflow:hidden;
}

#adt-header{
background:linear-gradient(90deg,#0d1b33,#0a1426);
padding:8px;
display:flex;
justify-content:space-between;
cursor:move;
}

#adt-tabs{
display:flex;
gap:6px;
padding:6px;
background:#0c1629;
border-bottom:1px solid #1e90ff33;
}

#adt-tabs button{
background:#111a2e;
border:1px solid #1e90ff44;
color:#9fd4ff;
padding:4px 8px;
cursor:pointer;
border-radius:4px;
}

#adt-tabs button:hover{
background:#1e90ff22;
}

#adt-content{
flex:1;
overflow:auto;
padding:8px;
font-size:12px;
}

#adt-network-table{
width:100%;
border-collapse:collapse;
}

#adt-network-table td{
border-bottom:1px solid #1e90ff22;
padding:4px;
}

.adt-url{
color:#6fbfff;
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
panel.id="arya-devtools"

panel.innerHTML=`

<div id="adt-header">
<b>Arya DevTools</b>
<div>
<button id="adt-min">_</button>
<button id="adt-close">X</button>
</div>
</div>

<div id="adt-tabs"></div>

<div id="adt-content"></div>

`

document.body.appendChild(panel)

const content=document.getElementById("adt-content")
const tabs=document.getElementById("adt-tabs")

/* ---------------------------
TABS
--------------------------- */

const tabList=[
"Network",
"Request",
"Response",
"Endpoints",
"Storage",
"Cookies",
"Console",
"Performance",
"Tools"
]

tabList.forEach(t=>{
const b=document.createElement("button")
b.textContent=t
b.onclick=()=>showTab(t)
tabs.appendChild(b)
})

function showTab(name){

if(name==="Network")renderNetwork()
if(name==="Request")renderRequest()
if(name==="Response")renderResponse()
if(name==="Endpoints")renderEndpoints()
if(name==="Storage")renderStorage()
if(name==="Cookies")renderCookies()
if(name==="Console")renderConsole()
if(name==="Performance")renderPerf()
if(name==="Tools")renderTools()

}

/* ---------------------------
NETWORK TAB
--------------------------- */

function renderNetwork(){

content.innerHTML=`

<h3>Network</h3>

<input id="adt-search" placeholder="search url">
<select id="adt-filter">
<option value="">ALL</option>
<option>GET</option>
<option>POST</option>
</select>

<table id="adt-network-table">
<thead>
<tr>
<td>#</td>
<td>Method</td>
<td>Status</td>
<td>Time</td>
<td>URL</td>
</tr>
</thead>
<tbody id="adt-network-body"></tbody>
</table>

`

updateNetwork()

document.getElementById("adt-search").oninput=updateNetwork
document.getElementById("adt-filter").onchange=updateNetwork

}

function updateNetwork(){

const body=document.getElementById("adt-network-body")
if(!body)return

const search=document.getElementById("adt-search")?.value||""
const filter=document.getElementById("adt-filter")?.value||""

body.innerHTML=""

logs.forEach((l,i)=>{

if(search&&!l.url.includes(search))return
if(filter&&l.method!==filter)return

const tr=document.createElement("tr")

tr.innerHTML=`
<td>${i}</td>
<td>${l.method}</td>
<td>${l.status}</td>
<td>${l.time}ms</td>
<td class="adt-url">${l.url}</td>
`

body.appendChild(tr)

})

}

/* ---------------------------
REQUEST TAB
--------------------------- */

function renderRequest(){

content.innerHTML=`

<h3>Request</h3>

<input id="req-i" placeholder="index">
<button id="req-btn">View</button>

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
RESPONSE TAB
--------------------------- */

function renderResponse(){

content.innerHTML=`

<h3>Response</h3>

<input id="res-i" placeholder="index">
<button id="res-btn">View</button>

<pre id="res-out"></pre>

`

document.getElementById("res-btn").onclick=()=>{

const i=document.getElementById("res-i").value
const log=logs[i]

if(!log)return

let out=log.response

try{out=JSON.stringify(JSON.parse(out),null,2)}catch{}

document.getElementById("res-out").textContent=out

}

}

/* ---------------------------
ENDPOINT SCANNER
--------------------------- */

function renderEndpoints(){

content.innerHTML="<h3>Endpoints</h3>"

const scripts=[...document.querySelectorAll("script")]

const found=new Set()

scripts.forEach(s=>{

const text=s.innerHTML

const urls=text.match(/https?:\/\/[^\s"'`]+/g)

if(urls)urls.forEach(u=>found.add(u))

})

found.forEach(u=>{

const d=document.createElement("div")
d.textContent=u
d.className="adt-url"

content.appendChild(d)

})

}

/* ---------------------------
STORAGE
--------------------------- */

function renderStorage(){

content.innerHTML="<h3>LocalStorage</h3>"

for(let i=0;i<localStorage.length;i++){

const k=localStorage.key(i)
const v=localStorage.getItem(k)

const d=document.createElement("div")
d.textContent=k+" = "+v

content.appendChild(d)

}

content.innerHTML+="<h3>SessionStorage</h3>"

for(let i=0;i<sessionStorage.length;i++){

const k=sessionStorage.key(i)
const v=sessionStorage.getItem(k)

const d=document.createElement("div")
d.textContent=k+" = "+v

content.appendChild(d)

}

}

/* ---------------------------
COOKIES
--------------------------- */

function renderCookies(){

content.innerHTML="<h3>Cookies</h3>"

document.cookie.split(";").forEach(c=>{

const d=document.createElement("div")
d.textContent=c

content.appendChild(d)

})

}

/* ---------------------------
CONSOLE
--------------------------- */

function renderConsole(){

content.innerHTML=`

<h3>Console</h3>

<textarea id="adt-eval" style="width:100%;height:120px"></textarea>

<button id="adt-run">Run</button>

<pre id="adt-console-out"></pre>

`

document.getElementById("adt-run").onclick=()=>{

try{

const code=document.getElementById("adt-eval").value
const result=eval(code)

document.getElementById("adt-console-out").textContent=result

}catch(e){

document.getElementById("adt-console-out").textContent=e

}

}

}

/* ---------------------------
PERFORMANCE
--------------------------- */

function renderPerf(){

const time=(performance.now()-startTime).toFixed(0)

content.innerHTML=`

<h3>Performance</h3>

Page runtime: ${time} ms

Requests captured: ${logs.length}

`

}

/* ---------------------------
TOOLS
--------------------------- */

function renderTools(){

content.innerHTML=`

<h3>Tools</h3>

<button id="export">Export Logs</button>
<button id="replay">Replay Request</button>

<pre id="tools-out"></pre>

`

document.getElementById("export").onclick=()=>{

const blob=new Blob([JSON.stringify(logs,null,2)],{type:"application/json"})

const a=document.createElement("a")

a.href=URL.createObjectURL(blob)
a.download="network_logs.json"
a.click()

}

document.getElementById("replay").onclick=async()=>{

const i=prompt("request index")

const log=logs[i]

if(!log)return

const res=await fetch(log.url,{
method:log.method,
body:log.requestBody
})

const text=await res.text()

document.getElementById("tools-out").textContent=text

}

}

/* ---------------------------
DRAG PANEL
--------------------------- */

let drag=false
let ox=0
let oy=0

const header=document.getElementById("adt-header")

header.onmousedown=e=>{

drag=true
ox=e.clientX-panel.offsetLeft
oy=e.clientY-panel.offsetTop

}

document.onmousemove=e=>{

if(!drag)return

panel.style.left=(e.clientX-ox)+"px"
panel.style.top=(e.clientY-oy)+"px"

}

document.onmouseup=()=>drag=false

/* ---------------------------
MIN CLOSE
--------------------------- */

document.getElementById("adt-close").onclick=()=>panel.remove()

document.getElementById("adt-min").onclick=()=>{

if(content.style.display==="none")
content.style.display="block"
else
content.style.display="none"

}

/* ---------------------------
START
--------------------------- */

showTab("Network")

})()
