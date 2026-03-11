javascript:(async()=>{

if(window.AryaDevTools){
 console.log("Arya DevTools already running");
 return;
}

const url="https://raw.githubusercontent.com/YOUR_USERNAME/arya-devtools/main/src/main.js";

const code=await (await fetch(url)).text();

eval(code);

})();
