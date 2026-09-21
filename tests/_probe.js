const fs=require("fs"),path=require("path"),{JSDOM}=require("jsdom");
const ROOT="/Users/sammartinez/Desktop/Current Claude Projects/HD Maintenance";
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const SCRIPTS=["data-jobs.js","data-ref.js","app.js"];
const EXPOSE=`Object.defineProperties(window,{state:{get:()=>state,configurable:true}});
Object.assign(window,{JOBS,PARTS,buyLines,storePlan,togglePick,renderParts,renderShop,renderBuyList,renderLog,partsUsed,renderRef});`;
function boot(seed){
 const html=read("index.html").replace(/<link[^>]*fonts\.(googleapis|gstatic)[^>]*>/g,"");
 const dom=new JSDOM(html,{url:"http://localhost:3000/",runScripts:"outside-only",pretendToBeVisual:true});
 const w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.scrollTo=()=>{};w.confirm=()=>true;w.Element.prototype.scrollIntoView=function(){};
 if(seed)seed(w.localStorage);
 w.eval(SCRIPTS.map(read).join("\n;\n")+"\n;"+EXPOSE);
 w.$=id=>w.document.getElementById(id);
 return w;
}

console.log("\n--- A: switch engine oil from Mobil 1 to Castrol ---");
let w=boot();
w.togglePick("mobil");
console.log("after picking mobil   have:",JSON.stringify(w.state.have),"linked:",JSON.stringify(w.state.linked));
w.togglePick("castrol");
console.log("after picking castrol have:",JSON.stringify(w.state.have),"linked:",JSON.stringify(w.state.linked));
console.log("buy list lines:");
w.buyLines().forEach(l=>console.log("   ",l.key.padEnd(10),l.qty,(l.unit||"each").padEnd(4),l.name,"| cats:",l.cats.join(",")));
w.state.shop="parts";w.renderParts();
const green=[...w.$("parts").querySelectorAll(".card")].filter(c=>/Your pick/.test(c.textContent)).map(c=>c.textContent.replace(/\s+/g," ").trim());
green.forEach(g=>console.log("   pick banner:",g));

console.log("\n--- A2: pick t-mobil and p-mobil WITHOUT the engine oil ---");
w=boot();
w.togglePick("t-mobil");w.togglePick("p-mobil");
w.buyLines().forEach(l=>console.log("   ",l.key.padEnd(10),l.qty,(l.unit||"each").padEnd(4),l.name));

console.log("\n--- B: partsUsed() on a log entry ---");
w=boot();
w.togglePick("mobil");w.togglePick("kn171c");w.togglePick("dot5");
w.$("fOdo").value="30000";
w.renderLog();
const cb=[...w.document.querySelectorAll(".fJob")].find(c=>c.value==="tires");
cb.checked=true;
w.$("fSave").click();
console.log("   logged jobs:",JSON.stringify(w.state.log[0].jobs));
console.log("   parts recorded:",JSON.stringify(w.state.log[0].parts));

console.log("\n--- C: restore a backup with a bogus shop/ref value ---");
w=boot(ls=>ls.setItem("hd-maint-v1",JSON.stringify({shop:"bogus",ref:"bogus",jgroup:"Nope",store:"Nope"})));
console.log("   state.shop =",w.state.shop,"| state.ref =",w.state.ref);
["shopList","shopParts","shopTools"].forEach(id=>console.log("   #"+id+" hidden:",w.$(id).hidden));
["refSpecs","refTorque","refFix","refCodes"].forEach(id=>console.log("   #"+id+" hidden:",w.$(id).hidden));
console.log("   -> Parts and tools screen renders:",w.$("view-shop").textContent.replace(/\s+/g," ").trim().slice(0,90)||"(EMPTY)");
