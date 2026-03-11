javascript:(async()=>{

if(window.AryaDevTools){
 console.log("Arya DevTools already running");
 return;
}

const url="https://raw.githubusercontent.com/G4NGGAAA/DevTOOLS/main/src/main.js";

const code=await (await fetch(url)).text();

eval(code);

})();
