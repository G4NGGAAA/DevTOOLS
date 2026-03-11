// Arya DevTools - main.js

(function () {

if (window.AryaDevTools) return
window.AryaDevTools = true

const logs = []

/* -----------------------
NETWORK INTERCEPT
----------------------- */

const originalFetch = window.fetch

window.fetch = async (...args) => {

 const start = performance.now()

 const res = await originalFetch(...args)

 const clone = res.clone()

 let body = null

 try{
  body = await clone.text()
 }catch{}

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

const origOpen = XMLHttpRequest.prototype.open
const origSend = XMLHttpRequest.prototype.send

XMLHttpRequest.prototype.open = function(method,url){

 this._method = method
 this._url = url

 return origOpen.apply(this,arguments)

}

XMLHttpRequest.prototype.send = function(body){

 const start = performance.now()

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

/* -----------------------
UI
----------------------- */

const panel = document.createElement("div")

panel.style = `
position:fixed;
top:40px;
right:40px;
width:600px;
height:420px;
background:#0a0f1c;
border:1px solid #1e90ff;
color:#9bd1ff;
font-family:monospace;
z-index:999999;
resize:both;
overflow:hidden;
display:flex;
flex-direction:column;
`

/* header */

const header = document.createElement("div")

header.style = `
background:#111a2e;
padding:6px;
cursor:move;
display:flex;
justify-content:space-between;
`

header.innerHTML = `
<b>Arya DevTools</b>
<div>
<button id="adt_min">_</button>
<button id="adt_close">X</button>
</div>
`

panel.appendChild(header)

/* tabs */

const tabs = document.createElement("div")

tabs.style = `
display:flex;
gap:6px;
padding:6px;
background:#0e1629;
`

const tabNames = [
"Network",
"Request",
"Response",
"Endpoints",
"Storage",
"Cookies",
"Tools"
]

tabNames.forEach(name=>{

 const btn = document.createElement("button")
 btn.textContent = name

 btn.onclick = ()=>showTab(name)

 tabs.appendChild(btn)

})

panel.appendChild(tabs)

/* content */

const content = document.createElement("div")

content.style = `
flex:1;
overflow:auto;
padding:8px;
`

panel.appendChild(content)

document.body.appendChild(panel)

/* -----------------------
TAB SYSTEM
----------------------- */

function showTab(name){

 if(name==="Network") renderNetwork()
 if(name==="Request") renderRequest()
 if(name==="Response") renderResponse()
 if(name==="Endpoints") renderEndpoints()
 if(name==="Storage") renderStorage()
 if(name==="Cookies") renderCookies()
 if(name==="Tools") renderTools()

}

/* -----------------------
NETWORK TAB
----------------------- */

function renderNetwork(){

 content.innerHTML = "<h3>Network</h3>"

 logs.forEach((log,i)=>{

  const div = document.createElement("div")

  div.textContent = `[${i}] ${log.method} ${log.status} ${log.time}ms`

  const url = document.createElement("div")

  url.textContent = log.url

  url.style.color="#6fbfff"

  content.appendChild(div)
  content.appendChild(url)
  content.appendChild(document.createElement("hr"))

 })

}

function updateNetwork(){
}

/* -----------------------
REQUEST TAB
----------------------- */

function renderRequest(){

 content.innerHTML = `
<h3>Request Viewer</h3>
<input id="req_index" placeholder="index">
<button id="req_btn">view</button>
<pre id="req_out"></pre>
`

 document.getElementById("req_btn").onclick = ()=>{

  const i = document.getElementById("req_index").value

  const log = logs[i]

  if(!log) return

  document.getElementById("req_out").textContent =
  JSON.stringify({
   url:log.url,
   method:log.method,
   body:log.requestBody
  },null,2)

 }

}

/* -----------------------
RESPONSE TAB
----------------------- */

function renderResponse(){

 content.innerHTML = `
<h3>Response Viewer</h3>
<input id="res_index" placeholder="index">
<button id="res_btn">view</button>
<pre id="res_out"></pre>
`

 document.getElementById("res_btn").onclick = ()=>{

  const i = document.getElementById("res_index").value

  const log = logs[i]

  if(!log) return

  let out = log.response

  try{
   out = JSON.stringify(JSON.parse(out),null,2)
  }catch{}

  document.getElementById("res_out").textContent = out

 }

}

/* -----------------------
ENDPOINT SCANNER
----------------------- */

function renderEndpoints(){

 content.innerHTML = "<h3>Endpoint Scanner</h3>"

 const scripts = [...document.querySelectorAll("script")]

 const found = new Set()

 scripts.forEach(s=>{

  const text = s.innerHTML

  const urls = text.match(/https?:\/\/[^\s"'`]+/g)

  if(urls) urls.forEach(u=>found.add(u))

 })

 found.forEach(url=>{

  const div = document.createElement("div")

  div.textContent = url

  div.style.color="#6fbfff"

  content.appendChild(div)

 })

}

/* -----------------------
STORAGE VIEWER
----------------------- */

function renderStorage(){

 content.innerHTML = "<h3>LocalStorage</h3>"

 for(let i=0;i<localStorage.length;i++){

  const key = localStorage.key(i)

  const val = localStorage.getItem(key)

  const div = document.createElement("div")

  div.textContent = key+" = "+val

  content.appendChild(div)

 }

 content.innerHTML += "<h3>SessionStorage</h3>"

 for(let i=0;i<sessionStorage.length;i++){

  const key = sessionStorage.key(i)

  const val = sessionStorage.getItem(key)

  const div = document.createElement("div")

  div.textContent = key+" = "+val

  content.appendChild(div)

 }

}

/* -----------------------
COOKIES
----------------------- */

function renderCookies(){

 content.innerHTML = "<h3>Cookies</h3>"

 document.cookie.split(";").forEach(c=>{

  const div = document.createElement("div")

  div.textContent = c

  content.appendChild(div)

 })

}

/* -----------------------
TOOLS
----------------------- */

function renderTools(){

 content.innerHTML = `
<h3>Tools</h3>

<button id="export_logs">Export Logs</button>
<button id="replay_req">Replay Request</button>

<input id="search_q" placeholder="search url">
<button id="search_btn">Search</button>

<pre id="tool_out"></pre>
`

 document.getElementById("export_logs").onclick = ()=>{

  const blob = new Blob([JSON.stringify(logs,null,2)],{
   type:"application/json"
  })

  const a = document.createElement("a")

  a.href = URL.createObjectURL(blob)
  a.download = "network_logs.json"

  a.click()

 }

 document.getElementById("replay_req").onclick = async ()=>{

  const i = prompt("request index")

  const log = logs[i]

  if(!log) return

  const res = await fetch(log.url,{
   method:log.method,
   body:log.requestBody
  })

  const text = await res.text()

  document.getElementById("tool_out").textContent = text

 }

 document.getElementById("search_btn").onclick = ()=>{

  const q = document.getElementById("search_q").value

  const result = logs.filter(l=>l.url.includes(q))

  document.getElementById("tool_out").textContent =
  JSON.stringify(result,null,2)

 }

}

/* -----------------------
DRAG PANEL
----------------------- */

let isDrag = false
let offsetX = 0
let offsetY = 0

header.onmousedown = e=>{

 isDrag = true

 offsetX = e.clientX - panel.offsetLeft
 offsetY = e.clientY - panel.offsetTop

}

document.onmousemove = e=>{

 if(!isDrag) return

 panel.style.left = (e.clientX-offsetX)+"px"
 panel.style.top = (e.clientY-offsetY)+"px"

}

document.onmouseup = ()=>{

 isDrag = false

}

/* -----------------------
MIN / CLOSE
----------------------- */

document.getElementById("adt_close").onclick = ()=>{

 panel.remove()

}

document.getElementById("adt_min").onclick = ()=>{

 if(content.style.display==="none"){

  content.style.display="block"

 }else{

  content.style.display="none"

 }

}

/* start */

showTab("Network")

})()
