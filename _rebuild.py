import re

path = r"C:\农场增量\game.js"
with open(path, "r", encoding="utf-8") as f:
    js = f.read()

# ============ 1. Add event delegation system ============
# Insert after renderAll() definition

delegation_code = '''
// === Event Delegation System ===
(function(){
function handleFarmClick(e){
var el=e.target.closest("[data-action]");if(!el)return;
var act=el.getAttribute("data-action");
var sid=el.getAttribute("data-sid");
var cid=el.getAttribute("data-cid");
if(act==="harvest")harvestSlot(parseInt(sid));
else if(act==="unlock")unlockLand(parseInt(sid));
else if(act==="plant")showPlants(parseInt(sid));
else if(act==="buySeeds")buySeeds();
else if(act==="doPlant")doPlant(parseInt(sid),cid);
else if(act==="cancelPlant")renderFarm();
}
function handleAnimalClick(e){
var el=e.target.closest("[data-action]");if(!el)return;
var act=el.getAttribute("data-action");
var aid=el.getAttribute("data-aid");
var aidx=el.getAttribute("data-aidx");
if(act==="buyAnimal")buyAnimal(aid);
else if(act==="collectAnimal")collAnimal(parseInt(aidx));
}
function handleProcClick(e){
var el=e.target.closest("[data-action]");if(!el)return;
var act=el.getAttribute("data-action");
var pid=el.getAttribute("data-pid");
if(act==="buyProc")buyProc(pid);
else if(act==="startProc")startProc(pid);
}
function handleUpgradeClick(e){
var el=e.target.closest("[data-action]");if(!el)return;
var act=el.getAttribute("data-action");
var uid=el.getAttribute("data-uid");
if(act==="buyUpgrade")buyUpgrade(uid);
}
function handleTradeClick(e){
var el=e.target.closest("[data-action]");if(!el)return;
var act=el.getAttribute("data-action");
var oidx=el.getAttribute("data-oidx");
if(act==="acceptOffer")acceptOffer(parseInt(oidx));
}
function handlePrestigeClick(e){
var el=e.target.closest("[data-action]");if(!el)return;
var act=el.getAttribute("data-action");
if(act==="doPrestige")doPrestige();
}
var pf=document.getElementById("pf");if(pf)pf.addEventListener("click",handleFarmClick);
var pa=document.getElementById("pa");if(pa)pa.addEventListener("click",handleAnimalClick);
var pp=document.getElementById("pp");if(pp)pp.addEventListener("click",handleProcClick);
var pu=document.getElementById("pu");if(pu)pu.addEventListener("click",handleUpgradeClick);
var pt=document.getElementById("pt");if(pt)pt.addEventListener("click",handleTradeClick);
var ppr=document.getElementById("ppr");if(ppr)ppr.addEventListener("click",handlePrestigeClick);
})();
'''

# Find renderAll and insert after it

# Check if delegation already exists
if "// === Event Delegation" in js:
    print("Delegation system already present, skipping.")
    exit(0)

insert_pos = js.find("function renderAll(){")
# Go to end of renderAll
brace_count = 1
pos = insert_pos + len("function renderAll(){")
while brace_count > 0 and pos < len(js):
    if js[pos] == "{": brace_count += 1
    elif js[pos] == "}": brace_count -= 1
    pos += 1

js = js[:pos] + delegation_code + js[pos:]
print(f"Added delegation at pos {pos}")

with open(path, "w", encoding="utf-8") as f:
    f.write(js)

print("Delegation system added")
