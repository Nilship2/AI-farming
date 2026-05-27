// engine-v2.js — Region, Research, and Harvest Count enhancements
// Overrides key functions from engine.js

// ============================================================
// Bridge: add REGION_DEFS and RESEARCH_DEFS
// ============================================================
var REGION_DEFS, RESEARCH_DEFS;
(function(){
    var _rb = rebuildBridge;
    rebuildBridge = function(){
        _rb();
        REGION_DEFS = DataRegistry.dump("region");
        RESEARCH_DEFS = DataRegistry.dump("research");
    };
})();
rebuildBridge();

// ============================================================
// Helper functions
// ============================================================
function formatTime(sec){
    if(sec<60)return Math.floor(sec)+"s";
    var s=Math.floor(sec);
    var y=Math.floor(s/31536000);s%=31536000;
    var d=Math.floor(s/86400);s%=86400;
    var h=Math.floor(s/3600);s%=3600;
    var m=Math.floor(s/60);s%=60;
    var parts=[];
    if(y>0)parts.push(y+"年");
    if(d>0)parts.push(d+"天");
    if(h>0)parts.push(h+"时");
    if(m>0)parts.push(m+"分");
    if(s>0||parts.length===0)parts.push(s+"秒");
    return parts.join("");
}
function getCropSoilMult(cd, soilId){
    if(!cd.specialSoils||cd.specialSoils.length===0)return 1.0;
    for(var i=0;i<cd.specialSoils.length;i++){if(cd.specialSoils[i].soil===soilId)return cd.specialSoils[i].mult;}
    return 1.0;
}
function getCropSeasonMult(cd, seasonName){
    if(!cd.specialSeasons||cd.specialSeasons.length===0)return 1.0;
    for(var i=0;i<cd.specialSeasons.length;i++){if(cd.specialSeasons[i].season===seasonName)return cd.specialSeasons[i].mult;}
    return 1.0;
}
function getHarvestCount(cd){return cd.harvestCount||2;}

// ============================================================
// Override saveGame
// ============================================================
(function(){
    var _saveGame = saveGame;
    saveGame = function(){
        if(window.__enabledMods){GS._enabledMods=window.__enabledMods;}
        GS.lastSave=Date.now();
        try{localStorage.setItem("farm_save",JSON.stringify(GS));}catch(e){}
    };
})();

// ============================================================
// Override loadGame — migrate old saves
// ============================================================
(function(){
    var _loadGame = loadGame;
    loadGame = function(){
        var raw;try{raw=localStorage.getItem("farm_save");}catch(e){raw=null;}
        if(!raw){initGame();return false;}
        try{var d=JSON.parse(raw);if(!d||typeof d!=="object"){initGame();return false;}
        if(!d.regions&&d.land){
            var rids=DataRegistry.ids("region");
            d.regions={};
            for(var ri=0;ri<rids.length;ri++){
                var rd=DataRegistry.get("region",rids[ri]);
                d.regions[rids[ri]]={unlocked:rd.startUnlocked!==false,lands:[]};
            }
            var firstRid=rids[0];
            for(var li=0;li<d.land.length;li++){
                d.regions[firstRid].lands.push(d.land[li]);
            }
            delete d.land;
        }
        if(!d.research)d.research={completed:[]};
        if(d.research&&!d.research.completed)d.research.completed=[];
        if(!d.regions)d.regions={};
        var allRids=DataRegistry.ids("region");
        for(var ri2=0;ri2<allRids.length;ri2++){
            var rdid=allRids[ri2];
            if(!d.regions[rdid]){
                var rd2=DataRegistry.get("region",rdid);
                var lands=[];
                for(var lj=0;lj<(rd2.startLands||1);lj++){lands.push({id:lj,unlocked:true,crop:null,soil:rd2.soil});}
                lands.push({id:lands.length,unlocked:false,crop:null,soil:rd2.soil});
                d.regions[rdid]={unlocked:rd2.startUnlocked!==false,lands:lands};
            }
        }
        for(var rid3 in d.regions){
            var reg=d.regions[rid3];
            var hasLocked=false;
            for(var lk=0;lk<reg.lands.length;lk++){if(!reg.lands[lk].unlocked){hasLocked=true;break;}}
            if(!hasLocked){
                var rd3=DataRegistry.get("region",rid3);
                if(rd3)reg.lands.push({id:reg.lands.length,unlocked:false,crop:null,soil:rd3.soil});
            }
        }
        Object.assign(GS,d);
        if(!GS._seenEvents)GS._seenEvents=[];
        if(!GS._seenWeather)GS._seenWeather=["sunny"];
        if(!GS._seenSeasons)GS._seenSeasons=["spring"];
        if(!GS.discoveredAnimals)GS.discoveredAnimals=[];
        if(!GS.relics)GS.relics=[];
        if(!GS.gemUpgrades)GS.gemUpgrades={};
        rebuildBridge();
        for(var _hk in HYBRID_DEFS){
            if(GS.discoveredHybrids.indexOf(_hk)!==-1&&!CROP_DEFS[_hk]){
                var _hd=HYBRID_DEFS[_hk];
                CROP_DEFS[_hk]={n:_hd.n,i:_hd.i,g:_hd.g,v:_hd.v,specialSoils:_hd.specialSoils,specialSeasons:_hd.specialSeasons,harvestCount:_hd.harvestCount||2,unlock:_hd.unlock,isHybrid:true};
                if(GS.discoveredCrops.indexOf(_hk)===-1)GS.discoveredCrops.push(_hk);
            }
        }
        return true;}catch(e){initGame();return false;}
    };
})();

// ============================================================
// Override initGame — region-based
// ============================================================
initGame = function(){
    GS.coins=0;GS.totalCoinsEarned=0;GS.totalCropsHarvested=0;GS.totalAnimalsRaised=0;
    GS.year=1;GS.season=0;GS.seasonTimer=0;GS.weather="sunny";GS.weatherTimer=0;
    GS.regions={};
    var rids=DataRegistry.ids("region");
    for(var ri=0;ri<rids.length;ri++){
        var rd=DataRegistry.get("region",rids[ri]);
        if(!rd)continue;
        var lands=[];
        for(var li=0;li<(rd.startLands||1);li++){lands.push({id:li,unlocked:true,crop:null,soil:rd.soil});}
        lands.push({id:lands.length,unlocked:false,crop:null,soil:rd.soil});
        GS.regions[rids[ri]]={unlocked:rd.startUnlocked!==false,lands:lands};
    }
    GS.research={completed:[]};
    GS.animals=[];GS.upgrades={};GS.processors={};GS.inventory={seeds:10};
    if(window.__enabledMods){GS._enabledMods=window.__enabledMods;}
    GS._planting=-1;
    if(!GS.relics)GS.relics=[];
    GS.merchantOffers=[];GS.merchantTimer=120;GS.eventCooldown=180;
    for(var k in PROC_DEFS)GS.processors[k]={owned:false,level:1,busy:false,timer:0};
    for(var k2 in UPG_DEFS)GS.upgrades[k2]=false;
    if(!GS.storyFragments)GS.storyFragments=[];
    if(!GS.achievements)GS.achievements={};
    if(!GS.discoveredHybrids)GS.discoveredHybrids=[];
    if(!GS.gemUpgrades)GS.gemUpgrades={};
    if(!GS.totalGemsEarned)GS.totalGemsEarned=0;
    if(!GS.extraLand)GS.extraLand=0;GS.scarecrowOn=true;GS.greenhouseOn=true;
    if(GS.upgrades.drone&&GS.droneOn===undefined)GS.droneOn=true;
    for(var _hk in HYBRID_DEFS){
        if(GS.discoveredHybrids.indexOf(_hk)!==-1&&!CROP_DEFS[_hk]){
            var _hd=HYBRID_DEFS[_hk];
            CROP_DEFS[_hk]={n:_hd.n,i:_hd.i,g:_hd.g,v:_hd.v,specialSoils:_hd.specialSoils,specialSeasons:_hd.specialSeasons,harvestCount:_hd.harvestCount||2,unlock:_hd.unlock,isHybrid:true};
            if(GS.discoveredCrops.indexOf(_hk)===-1)GS.discoveredCrops.push(_hk);
        }
    }
    if(!GS.discoveredAnimals)GS.discoveredAnimals=[];
    if(!GS.prestigePoints&&GS.prestigePoints!==0)GS.prestigePoints=0;
    if(!GS.discoveredCrops||GS.discoveredCrops.length===0)GS.discoveredCrops=["wheat"];
    GS._seenEvents=[];GS._seenWeather=["sunny"];GS._seenSeasons=["spring"];
    plantCrop("plain",0,"wheat");
    plantCrop("sandland",0,"wheat");
    plantCrop("darkland",0,"carrot");
    GS.inventory.seeds=Math.max(0,GS.inventory.seeds-Math.ceil(CROP_DEFS.wheat.v*0.25)-Math.ceil(CROP_DEFS.wheat.v*0.25)-Math.ceil(CROP_DEFS.carrot.v*0.25));
};

// ============================================================
// Override plantCrop(regionId, slotId, cropId)
// ============================================================
plantCrop = function(regionId, slotId, cropId){
    var region=GS.regions[regionId];
    if(!region||!region.unlocked)return false;
    var s=region.lands[slotId];
    if(!s||!s.unlocked||s.crop)return false;
    s.crop={id:cropId,timer:0,gt:CROP_DEFS[cropId].g,watered:true};
    if(GS.discoveredCrops.indexOf(cropId)===-1){GS.discoveredCrops.push(cropId);notify("🔁 解锁新作物："+CROP_DEFS[cropId].n+"！");}
    return true;
};

// ============================================================
// Override doHarvest(s, regionId) — use new data format
// ============================================================
(function(){
    var _doHarvest = doHarvest;
    doHarvest = function(s, regionId){
        if(!s.crop)return;
        var cd=CROP_DEFS[s.crop.id];
        if(!cd||s.crop.timer<cd.g)return;
        var region=regionId?GS.regions[regionId]:null;
        var idx=region?region.lands.indexOf(s):-1;
        for(var hk in HYBRID_DEFS){
            var hd=HYBRID_DEFS[hk];
            if(GS.coins>=hd.unlock&&GS.discoveredHybrids.indexOf(hk)===-1){
                if(region&&idx>=0){
                    var adjList=[idx-1,idx+1];
                    for(var ai=0;ai<adjList.length;ai++){
                        var adj=adjList[ai];
                        if(adj>=0&&adj<region.lands.length&&region.lands[adj].crop){
                            var ac=region.lands[adj].crop.id;
                            if(hd.p.indexOf(s.crop.id)!==-1&&hd.p.indexOf(ac)!==-1&&s.crop.id!==ac){
                                var hcf=1;
                                if(GS.gemUpgrades&&GS.gemUpgrades.luckyCharm)hcf*=1.3;
                                if(GS.relics)for(var ri6=0;ri6<GS.relics.length;ri6++){var rd6=RELIC_DEFS[GS.relics[ri6]];if(rd6&&rd6.ef==="hybridChance")hcf*=rd6.v;}
                                if(Math.random()*hcf<hd.ch){
                                    GS.discoveredHybrids.push(hk);
                                    if(!CROP_DEFS[hk])CROP_DEFS[hk]={n:hd.n,i:hd.i,g:hd.g,v:hd.v,specialSoils:hd.specialSoils,specialSeasons:hd.specialSeasons,harvestCount:hd.harvestCount||2,unlock:hd.unlock,isHybrid:true};
                                    if(GS.discoveredCrops.indexOf(hk)===-1)GS.discoveredCrops.push(hk);
                                    var b=hd.v*3;GS.coins+=b;GS.totalCoinsEarned+=b;notify("杂交成功！"+hd.n+"！+"+b+"💰");checkStory("hybrid_"+hk);
                                }
                            }
                        }
                    }
                }
            }
        }
        var v=cd.v*(1+GS.prestigePoints*0.1);
        if(GS.relics)for(var ri3=0;ri3<GS.relics.length;ri3++){var rd3=RELIC_DEFS[GS.relics[ri3]];if(rd3&&rd3.ef==="cropValue")v*=(1+rd3.v);}
        if(GS.gemUpgrades&&GS.gemUpgrades.goldenLegend)v*=1.2;
        if(window._doubleValue&&window._doubleValueEnd>Date.now())v*=2;
        GS.coins+=Math.floor(v);GS.totalCoinsEarned+=Math.floor(v);
        GS.totalCropsHarvested++;
        var hc=getHarvestCount(cd);
        if(GS.gemUpgrades){
            if(GS.gemUpgrades.harvestBless)hc+=1;
            if(GS.gemUpgrades.harvestBless2)hc+=1;
            if(GS.gemUpgrades.rareBreed&&HYBRID_DEFS[s.crop.id])hc+=1;
            if(GS.relics)for(var ri7=0;ri7<GS.relics.length;ri7++){var rd7=RELIC_DEFS[GS.relics[ri7]];if(rd7&&rd7.ef==="harvestPlus")hc+=rd7.v;}
        }
        if(GS.research&&GS.research.completed&&GS.research.completed.indexOf("harvestTech")!==-1)hc+=1;
        if(!GS.inventory[s.crop.id])GS.inventory[s.crop.id]=0;
        GS.inventory[s.crop.id]+=hc;
        if(Math.random()<0.3)GS.inventory.seeds=(GS.inventory.seeds||0)+1;
        var _lcid=s.crop.id;
        s.crop=null;
        s.lastCrop=_lcid;
        var _rch=0.005*(1+GS.prestigePoints*0.1);
        if(GS.gemUpgrades&&GS.gemUpgrades.relicSense)_rch*=1.5;
        if(Math.random()<_rch){
            var rk=Object.keys(RELIC_DEFS);
            var rid=rk[Math.floor(Math.random()*rk.length)];
            if(GS.relics.indexOf(rid)===-1){GS.relics.push(rid);notify("🏺 发现遗物："+RELIC_DEFS[rid].n+"！"+RELIC_DEFS[rid].d);checkStory("relic_"+rid);}
        }
    };
})();

// ============================================================
// Override harvestSlot(regionId, slotId)
// ============================================================
harvestSlot = function(regionId, slotId){
    if(slotId===undefined)return;
    var region=GS.regions[regionId];
    if(!region)return;
    doHarvest(region.lands[slotId], regionId);
    renderFarm();R();
};

// ============================================================
// Override unlockLand(regionId, slotId)
// ============================================================
unlockLand = function(regionId, slotId){
    if(slotId===undefined)return;
    var region=GS.regions[regionId];
    if(!region||!region.unlocked)return;
    var s=region.lands[slotId];
    if(!s||s.unlocked)return;
    var rd=DataRegistry.get("region",regionId);
    if(!rd)return;
    var x=0;
    for(var ci=0;ci<region.lands.length;ci++){if(region.lands[ci].unlocked)x++;}
    var cost=Math.floor(rd.priceA*x+rd.priceB);
    if(GS.coins<cost){notify("需要"+cost+"💰解锁");return;}
    GS.coins-=cost;s.unlocked=true;
    region.lands.push({id:region.lands.length,unlocked:false,crop:null,soil:rd.soil});
    notify("解锁新土地！土壤："+soilName(s.soil));
    checkStory("land_"+regionId+"_"+slotId);
};

// ============================================================
// Override showPlants(regionId, slotId)
// ============================================================
showPlants = function(regionId, slotId){
    if(slotId===undefined)return;
    GS._planting={regionId:regionId,slotId:slotId};
    var av=[];
    for(var k in CROP_DEFS){
        if(GS.discoveredCrops.indexOf(k)!==-1||CROP_DEFS[k].unlock<=GS.totalCoinsEarned)av.push(k);
    }
    var h='<div class="cd"><h3>选择种植</h3><div class="cg" style="grid-template-columns:repeat(5,1fr)">';
    var s=GS.regions[regionId]?GS.regions[regionId].lands[slotId]:null;
    var soil=s?s.soil:"normal";
    for(var i=0;i<av.length;i++){
        var cid=av[i];var cd=CROP_DEFS[cid];
        var sf=0;
        if(GS.relics)for(var ri4=0;ri4<GS.relics.length;ri4++){var rd4=RELIC_DEFS[GS.relics[ri4]];if(rd4&&rd4.ef==="seedDiscount")sf+=rd4.v;}
        var sc=Math.ceil(cd.v*0.25*(1-Math.min(0.9,sf)));
        var soilMult=getCropSoilMult(cd,soil);
        var seasonMult=getCropSeasonMult(cd,SNAMES[GS.season]);
        var hc=getHarvestCount(cd);
        var notes='';
        if(soilMult>1)notes+=' 🔺土壤x'+soilMult.toFixed(1);
        if(seasonMult>1)notes+=' 🔺季节x'+seasonMult.toFixed(1);
        if(seasonMult<1)notes+=' 🔻季节x'+seasonMult.toFixed(1);
        h+='<div class="sl" data-action="doPlant" data-rid="'+regionId+'" data-sid="'+slotId+'" data-cid="'+cid+'"><div style="font-size:2em">'+(cd.i||'🌡')+'</div><div>'+cd.n+'</div><div class="tt">生长:'+formatTime(cd.g)+' | 产出:'+hc+'个</div><div class="tt">种子:'+sc+notes+'</div></div>';
    }
    h+='<button class="bt sm rd" data-action="cancelPlant" style="margin-top:8px">✖ 取消</button></div></div>';
    var pf2=document.getElementById("pf");if(pf2)pf2.innerHTML=h;
};

// ============================================================
// Override doPlant(regionId, slotId, cropId)
// ============================================================
doPlant = function(regionId, slotId, cropId){
    var cd=CROP_DEFS[cropId];
    var sf=0;
    if(GS.relics)for(var ri4=0;ri4<GS.relics.length;ri4++){var rd4=RELIC_DEFS[GS.relics[ri4]];if(rd4&&rd4.ef==="seedDiscount")sf+=rd4.v;}
    var sc=Math.ceil(cd.v*0.25*(1-Math.min(0.9,sf)));
    if((GS.inventory.seeds||0)<sc){notify("种子不足！");return;}
    if(!plantCrop(regionId,slotId,cropId)){notify("无法在此种植！");return;}
    GS.inventory.seeds-=sc;GS._planting=-1;
    notify("种植了"+cd.n);renderFarm();R();
};

// ============================================================
// Override doPrestige — preserve research
// ============================================================
(function(){
    var _doPrestige = doPrestige;
    doPrestige = function(){
        var pts=Math.floor(Math.sqrt(Math.max(0,GS.totalCoinsEarned)/10000));
        if(pts<1){notify("需要累计至少获得 10000 金币才能转生！");return;}
        if(!confirm("转生将重置所有进度，获得 "+pts+" 个农场之星。\n每个农场之星永久 +10% 金币收入。\n图鉴、杂交品种、成就、故事碎片和研究会保留。\n\n确定转生吗？"))return;
        var savedResearch=GS.research?JSON.parse(JSON.stringify(GS.research)):{completed:[]};
        _doPrestige();
        GS.research=savedResearch;
        saveGame();
    };
})();

// ============================================================
// waterCrop and shovelCrop
// ============================================================
function waterCrop(regionId, slotId){
    var region=GS.regions[regionId];
    if(!region||!region.unlocked)return;
    var s=region.lands[slotId];
    if(!s||!s.unlocked||!s.crop)return;
    var maxG=CROP_DEFS[s.crop.id]?CROP_DEFS[s.crop.id].g:999;
    s.crop.timer=Math.min(s.crop.timer+15,maxG);
    notify("💧 浇水加速15秒！");
}
function shovelCrop(regionId, slotId){
    var region=GS.regions[regionId];
    if(!region||!region.unlocked)return;
    var s=region.lands[slotId];
    if(!s||!s.unlocked||!s.crop)return;
    var cd=CROP_DEFS[s.crop.id];
    var sf=0;
    if(GS.relics)for(var ri4=0;ri4<GS.relics.length;ri4++){var rd4=RELIC_DEFS[GS.relics[ri4]];if(rd4&&rd4.ef==="seedDiscount")sf+=rd4.v;}
    var sc=cd?Math.ceil(cd.v*0.25*(1-Math.min(0.9,sf))):1;
    GS.inventory.seeds=(GS.inventory.seeds||0)+sc;
    s.crop=null;
    notify("🔧 已铲除，返还"+sc+"颗种子");
}

// ============================================================
// Animal release
// ============================================================
function releaseAnimal(idx){
    if(idx<0||idx>=GS.animals.length)return;
    var a=GS.animals[idx];
    var ad=ANIMAL_DEFS[a.id];
    GS.animals.splice(idx,1);
    notify("🐾 已放生 "+ad.i+" "+ad.n);
    renderAnimals();R();
}

// ============================================================
// Override renderAnimals — add release button
// ============================================================
renderAnimals = function(){
    var h='<div class="cd"><h3>🐇 畜棚</h3><div class="tt">容量：'+GS.animals.length+'/'+GS.maxAnimals+'</div><div class="cg">';
    for(var k in ANIMAL_DEFS){
        var d=ANIMAL_DEFS[k];var ow=0;
        for(var i=0;i<GS.animals.length;i++){if(GS.animals[i].id===k)ow++;}
        var ul=GS.totalCoinsEarned>=d.unlock||GS.discoveredAnimals.indexOf(k)!==-1;
        h+='<div class="sl'+(ul?'':' lk')+'"><div style="font-size:2em">'+d.i+'</div><div>'+d.n+'</div><div class="tt">产物:'+d.p.i+d.p.n+'</div><div class="tt">拥有:'+ow+' | 价格:'+d.c+'💰</div>'+(ul?'<button class="bt sm bl" data-action="buyAnimal" data-aid="'+k+'">购买</button>':'')+'</div>';
    }
    h+='</div></div>';
    if(GS.animals.length>0){
        h+='<div class="cd"><h3>我的动物</h3><div class="cg">';
        for(var j=0;j<GS.animals.length;j++){
            var a=GS.animals[j];var ad=ANIMAL_DEFS[a.id];var ap=Math.floor(a.af/a.am*100);
            h+='<div class="sl'+(a.pr?' rd':'')+'" data-action="collectAnimal" data-aidx="'+j+'"><div style="font-size:2em">'+ad.i+'</div><div>'+ad.n+'</div><div class="pb"><div class="pf" style="width:'+(a.pr?100:Math.floor(a.pt/a.pi*100))+'%"></div></div><div class="tt">好感:'+(new Array(Math.ceil(ap/25)+1).join('❤️')||'🤍')+' '+ap+'%</div>'+(a.pr?'<div class="tt">✅ 可收取！</div>':'<div class="tt">'+Math.floor(a.pi-a.pt)+'s</div>')+'<button class="bt sm rd rmBtn" data-action="releaseAnimal" data-aidx="'+j+'">🐾 放生</button></div>';
        }
        h+='</div></div>';
    }
    var pa=document.getElementById("pa");if(pa)pa.innerHTML=h;
};

// ============================================================
// renderSeedStore — rendered once, not re-rendered by game loop
// ============================================================
function renderSeedStore(){
    var ss=document.getElementById("seedstore");
    if(!ss||ss.innerHTML)return;
    var h='<div class="cd"><h3>🌵 种子商店</h3>';
    h+='<input type="number" id="seedBuyQty" value="1" min="1" max="9999" style="width:70px;padding:4px 6px;border-radius:5px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.3);color:#ffd700;font-size:.8em;text-align:center;font-family:inherit;margin-right:6px">';
    h+='<button class="bt sm gn" id="btnSeedBuy" style="font-size:.75em">🌡 购买 (4💰/颗)</button></div>';
    ss.innerHTML=h;
    var btn=document.getElementById("btnSeedBuy");
    var inp=document.getElementById("seedBuyQty");
    if(btn)btn.onclick=function(){
        var qty=inp?parseInt(inp.value)||1:1;
        if(qty<1)qty=1;if(qty>9999)qty=9999;
        buySeedsN(qty);renderFarm();R();
    };
    if(inp)inp.onkeydown=function(e){
        if(e.key==="Enter"){e.preventDefault();
            var qty=parseInt(this.value)||1;
            if(qty<1)qty=1;if(qty>9999)qty=9999;
            buySeedsN(qty);renderFarm();R();
        }
    };
}

// ============================================================
// Override renderFarm — region-based
// ============================================================
renderFarm = function(){
    if(GS._planting&&typeof GS._planting==="object")return;
    if(typeof GS._planting==="number"&&GS._planting>=0)return;
    var h='';
    var rids=DataRegistry.ids("region");
    for(var ri=0;ri<rids.length;ri++){
        var regionId=rids[ri];
        var region=GS.regions[regionId];
        var rd=DataRegistry.get("region",regionId);
        if(!rd||!region)continue;
        if(!region.unlocked){h+='<div class="cd"><h3>🔒 '+rd.i+' '+rd.n+'（未解锁）</h3><div class="tt">需通过研究解锁</div></div>';continue;}
        h+='<div class="cd"><h3>'+rd.i+' '+rd.n+'</h3><div class="cg" style="grid-template-columns:repeat(5,1fr)">';
        for(var li=0;li<region.lands.length;li++){
            var s=region.lands[li];
            if(!s.unlocked){
                var x=0;
                for(var ci=0;ci<region.lands.length;ci++){if(region.lands[ci].unlocked)x++;}
                var cost=Math.floor(rd.priceA*x+rd.priceB);
                h+='<div class="sl lk" data-action="unlock" data-rid="'+regionId+'" data-sid="'+li+'"><div>🔒</div><div>锁定</div><div class="tt">价格:'+cost+'💰</div><div class="tt">土壤:'+soilName(s.soil)+'</div></div>';
            }else if(s.crop){
                var cd=CROP_DEFS[s.crop.id];
                if(!cd){h+='<div class="sl"><div>🌫</div><div>空地</div></div>';continue;}
                var p=Math.min(1,s.crop.timer/cd.g);
                var rd2=p>=1;
                var soilM=getCropSoilMult(cd,s.soil);
                var seasonM=getCropSeasonMult(cd,SNAMES[GS.season]);
                var hc=getHarvestCount(cd);
                h+='<div class="sl'+(rd2?' rd':'')+'" data-action="'+(rd2?'harvest':'growing')+'" data-rid="'+regionId+'" data-sid="'+li+'"';
                h+=' data-gr-base="1"';
                var upgSum=0;for(var k2 in UPG_DEFS){if(GS.upgrades[k2]&&UPG_DEFS[k2].ef==="grow")upgSum+=UPG_DEFS[k2].v;}
                h+=' data-gr-upg="'+upgSum.toFixed(2)+'"';
                h+=' data-gr-weather="'+(GS.weather==="rainy"?0.3:GS.weather==="sunny"?0.1:GS.weather==="storm"?-0.4:0)+'"';
                var relicSum=0;if(GS.relics)for(var rj=0;rj<GS.relics.length;rj++){var rd5=RELIC_DEFS[GS.relics[rj]];if(rd5&&rd5.ef==="grow")relicSum+=rd5.v;}
                h+=' data-gr-relic="'+relicSum.toFixed(2)+'"';
                var gemSum=0;if(GS.gemUpgrades)for(var gk in GEM_UPG_DEFS){var gd2=GEM_UPG_DEFS[gk];if(gd2.ef==="grow"){if(gd2.repeatable)gemSum+=(GS._refineCount||0)*gd2.v;else if(GS.gemUpgrades[gk])gemSum+=gd2.v;}}
                h+=' data-gr-gem="'+gemSum.toFixed(2)+'"';
                var grWeather=GS.weather==="rainy"?0.3:GS.weather==="sunny"?0.1:GS.weather==="storm"?-0.4:0;var grGH=(GS.upgrades.greenhouse&&GS.greenhouseOn!==false)?1:0;var grResearch=0;if(GS.research&&GS.research.completed){if(GS.research.completed.indexOf("compost")!==-1)grResearch+=0.2;if(GS.research.completed.indexOf("cropRotate")!==-1)grResearch+=0.15;if(GS.research.completed.indexOf("deepPlow")!==-1)grResearch+=0.15;if(GS.research.completed.indexOf("ghOptimize")!==-1&&grGH)grResearch+=0.1;}var grGM=1+upgSum+grWeather+relicSum+gemSum+grResearch;var grTotal=grGM*(grGH?1:seasonM)*soilM;var grWN=GS.weather==="rainy"?"🌧️ 雨天":GS.weather==="sunny"?"☀️ 晴天":GS.weather==="storm"?"⛈️ 暴风雨":"☁️ 多云";var grInfo="1.0|"+upgSum.toFixed(1)+"|"+grWeather.toFixed(1)+grWN+"|"+relicSum.toFixed(2)+"|"+gemSum.toFixed(2)+"|"+seasonM.toFixed(1)+(SICONS?SICONS[GS.season]:SNAMES[GS.season])+"|"+soilM.toFixed(1)+soilName(s.soil)+"|"+(grGH?"1":"0")+"|"+grTotal.toFixed(2);h+=' data-gr-season="'+seasonM+'" data-gr-soil="'+soilM+'" data-gr-hasGH="'+(grGH?"1":"0")+'"';
                h+='>';
                h+='<div style="font-size:2em">'+(cd.i||'🌡')+'</div><div>'+cd.n+'</div>';
                h+='<div class="pb"><div class="pf" style="width:'+(p*100)+'%"></div></div>';
                h+='<div class="tt">'+(rd2?'✔ 可收获！':formatTime(cd.g-s.crop.timer))+'</div>';
                h+='<div class="tt">土壤:'+soilName(s.soil)+' | 产出:'+hc+'个</div>';
                if(!rd2){h+='<button class="bt sm bl" data-action="water" data-rid="'+regionId+'" data-sid="'+li+'" style="margin-top:3px;font-size:.65em">💧 浇水(+15s)</button>';}
                h+='<button class="bt sm rd" data-action="shovel" data-rid="'+regionId+'" data-sid="'+li+'" style="margin-top:2px;font-size:.65em">🔧 铲除</button>';var grUpgNames=[];for(var guk in UPG_DEFS){if(GS.upgrades[guk]&&UPG_DEFS[guk].ef==="grow")grUpgNames.push(UPG_DEFS[guk].n+"+"+UPG_DEFS[guk].v.toFixed(1));}var grRelicNames=[];if(GS.relics)for(var grri=0;grri<GS.relics.length;grri++){var grrd=RELIC_DEFS[GS.relics[grri]];if(grrd&&grrd.ef==="grow")grRelicNames.push(grrd.n+"+"+grrd.v.toFixed(2));}var grGemNames=[];if(GS.gemUpgrades)for(var grgi in GEM_UPG_DEFS){var grgd=GEM_UPG_DEFS[grgi];if(grgd.ef==="grow"){if(grgd.repeatable){var grtv=(GS._refineCount||0)*grgd.v;if(grtv>0)grGemNames.push(grgd.n+" x"+(GS._refineCount||0)+" +"+grtv.toFixed(2));}else if(GS.gemUpgrades[grgi])grGemNames.push(grgd.n+"+"+grgd.v.toFixed(2));}}h+='<div class="tt growRate" data-gr-info="'+grInfo+'" data-gr-upg="'+(grUpgNames.length>0?grUpgNames.join(","):"")+'" data-gr-relic="'+(grRelicNames.length>0?grRelicNames.join(","):"")+'" data-gr-gem="'+(grGemNames.length>0?grGemNames.join(","):"")+'" style="color:#4fc3f7;margin-top:2px;font-size:.7em;cursor:help">⚡ x'+grTotal.toFixed(2)+'</div></div>';
            }else{
                h+='<div class="sl" data-action="plant" data-rid="'+regionId+'" data-sid="'+li+'"><div style="font-size:2em">🌫</div><div>空地</div><div class="tt">点击种植</div><div class="tt">土壤:'+soilName(s.soil)+'</div></div>';
            }
        }
        h+='</div></div>';
    }
    var pf2=document.getElementById("pf");if(pf2)pf2.innerHTML=h;
};

// ============================================================
// Override tick — region-based growing
// ============================================================
(function(){
    var _tick = tick;
    tick = function(dt){
        dt=Math.min(dt,5);
        GS.seasonTimer+=dt;
        if(GS.seasonTimer>=GS.seasonDuration){
            GS.seasonTimer-=GS.seasonDuration;GS.season=(GS.season+1)%4;
            if(GS.season===0)GS.year++;
            notify(SICONS[GS.season]);
            if(GS._seenSeasons&&GS._seenSeasons.indexOf(SNAMES[GS.season])===-1){GS._seenSeasons.push(SNAMES[GS.season]);}
            checkStory("season_"+GS.year+"_"+GS.season);
        }
        GS.weatherTimer-=dt;
        if(GS.weatherTimer<=0){
            var r=Math.random();GS.weather=r<0.5?"sunny":r<0.8?"cloudy":r<0.95?"rainy":"storm";
            if(GS._seenWeather&&GS._seenWeather.indexOf(GS.weather)===-1){GS._seenWeather.push(GS.weather);notify("🔁 发现新天气："+GS.weather);}
            GS.weatherTimer=120+Math.random()*240;
        }
        var gh=GS.upgrades.greenhouse&&GS.greenhouseOn!==false,fa=GS.upgrades.drone;
        var gm=1;
        for(var k in UPG_DEFS){if(GS.upgrades[k]&&UPG_DEFS[k].ef==="grow")gm+=UPG_DEFS[k].v;}
        if(GS.research&&GS.research.completed){
            if(GS.research.completed.indexOf("compost")!==-1)gm+=0.2;
            if(GS.research.completed.indexOf("cropRotate")!==-1)gm+=0.15;
            if(GS.research.completed.indexOf("deepPlow")!==-1)gm+=0.15;
            if(GS.research.completed.indexOf("ghOptimize")!==-1&&gh)gm+=0.1;
        }
        if(GS.weather==="rainy")gm+=0.3;
        if(GS.weather==="sunny")gm+=0.1;
        if(GS.weather==="storm")gm-=0.4;
        if(GS.relics)for(var ri=0;ri<GS.relics.length;ri++){var rd=RELIC_DEFS[GS.relics[ri]];if(rd&&rd.ef==="grow")gm+=rd.v;}
        if(GS.gemUpgrades){for(var _gk in GEM_UPG_DEFS){var _gd=GEM_UPG_DEFS[_gk];if(_gd.ef==="grow"){if(_gd.repeatable){gm+=(GS._refineCount||0)*_gd.v;}else if(GS.gemUpgrades[_gk]){gm+=_gd.v;}}if(_gd.ef==="photosynthesis"&&GS.gemUpgrades[_gk]){if(GS.weather==="sunny")gm+=0.1;if(GS.weather==="rainy")gm+=0.3;}}}
        // Region-based growth
        for(var rid in GS.regions){
            var region=GS.regions[rid];
            if(!region||!region.unlocked||!region.lands)continue;
            for(var i=0;i<region.lands.length;i++){
                var s=region.lands[i];
                if(!s.crop||!s.unlocked)continue;
                var cd=CROP_DEFS[s.crop.id];
                if(!cd)continue;
                var seasonM2=getCropSeasonMult(cd,SNAMES[GS.season]);
                var soilM2=getCropSoilMult(cd,s.soil);
                var m=gh?gm:gm*seasonM2;
                m*=soilM2;
                s.crop.timer+=dt*m;
                if((GS.upgrades.autoHarvest||fa)&&s.crop.timer>=cd.g){
                    var _cid2=s.crop.id;
                    doHarvest(s,rid);
                    if(fa||GS.upgrades.scarecrow){
                        if(GS.inventory.seeds>0){
                            GS.inventory.seeds--;
                            s.crop={id:_cid2,timer:0,gt:CROP_DEFS[_cid2].g,watered:true};
                        }
                    }
                }
            }
        }
        // Scarecrow auto-plant
        if((GS.upgrades.scarecrow&&GS.scarecrowOn!==false)||(GS.upgrades.drone&&GS.droneOn!==false)){
            for(var rid2 in GS.regions){
                var region2=GS.regions[rid2];
                if(!region2||!region2.unlocked||!region2.lands)continue;
                for(var _si=0;_si<region2.lands.length;_si++){
                    var _s=region2.lands[_si];
                    if(_s.unlocked&&!_s.crop&&_s.lastCrop&&(GS.inventory.seeds||0)>0){
                        var _pick=_s.lastCrop;
                        if(GS.discoveredCrops.indexOf(_pick)!==-1){
                            var _cd2=CROP_DEFS[_pick];
                            var _sc2=Math.ceil(_cd2.v*0.25);
                            if((GS.inventory.seeds||0)>=_sc2){
                                plantCrop(rid2,_si,_pick);
                                GS.inventory.seeds-=_sc2;
                            }
                        }
                    }
                }
            }
        }
        // Animals
        var _aaf=1;if(GS.gemUpgrades&&GS.gemUpgrades.animalWhisper)_aaf+=0.2;
        for(var j=0;j<GS.animals.length;j++){
            var a=GS.animals[j];a.pt+=dt;
            if((GS.upgrades.drone&&GS.droneOn!==false||GS.upgrades.fullAuto)&&a.pr){
                var ad2=ANIMAL_DEFS[a.id];if(ad2){var pk2=ad2.p.k;if(!GS.inventory[pk2])GS.inventory[pk2]=0;GS.inventory[pk2]++;var adbl=GS.gemUpgrades&&GS.gemUpgrades.animalFriend?0.15:0;if(Math.random()<adbl){GS.inventory[pk2]++;}}a.pr=false;
            }
            if(a.pt>=a.pi){a.pt-=a.pi;a.pr=true;}
            if(a.af<a.am){a.af+=dt*0.05*_aaf;if(a.af>=a.am&&GS.animals.length<GS.maxAnimals&&Math.random()<0.15){var nk=Object.keys(ANIMAL_DEFS);var nid=nk[Math.floor(Math.random()*nk.length)];var nd=ANIMAL_DEFS[nid];if(GS.totalCoinsEarned>=nd.unlock){GS.animals.push({id:nid,n:nd.n,i:nd.i,af:0,am:nd.am,pt:0,pi:nd.p.t,pr:false});if(GS.discoveredAnimals.indexOf(nid)===-1)GS.discoveredAnimals.push(nid);GS.totalAnimalsRaised++;notify(nd.i+" "+nd.n+"被你的动物的好感吸引来了！");}}}
        }
        // Processors
        for(var pk in GS.processors){var pr=GS.processors[pk];if(!pr.busy)continue;if((GS.upgrades.drone&&GS.droneOn!==false)||GS.upgrades.fullAuto){var pd=PROC_DEFS[pk];if(pd&&(!GS.inventory[pd.inp.k]||GS.inventory[pd.inp.k]<1)){pr.busy=false;pr.timer=0;continue;}}pr.timer-=dt;if(pr.timer<=0){pr.busy=false;pr.timer=0;var d=PROC_DEFS[pk];if(!GS.inventory[d.out.k])GS.inventory[d.out.k]=0;GS.inventory[d.out.k]+=pr.level;if((GS.upgrades.drone&&GS.droneOn!==false)||GS.upgrades.fullAuto){if(GS.inventory[d.inp.k]>=1){GS.inventory[d.inp.k]--;pr.busy=true;pr.timer=d.t;}}notify(d.n+" 生产了"+pr.level+" 个"+d.out.n);}}
        GS.eventCooldown-=dt;if(GS.eventCooldown<=0){randEvent();GS.eventCooldown=180+Math.random()*300;}
        GS.merchantTimer-=dt;if(GS.merchantTimer<=0&&GS.coins>=5000){genMerchant();var mf2=1;if(GS.relics)for(var ri2=0;ri2<GS.relics.length;ri2++){var rd2=RELIC_DEFS[GS.relics[ri2]];if(rd2&&rd2.ef==="merchantFreq")mf2-=rd2.v;}GS.merchantTimer=(240+Math.random()*360)*Math.max(0.3,mf2);}
        checkAch();
    };
})();

// ============================================================
// Override renderPrestige — sort gems (unowned top, owned bottom)
// ============================================================
(function(){
    var _renderPrestige = renderPrestige;
    renderPrestige = function(){
        _renderPrestige();
        // Sort gem cards: unowned first
        var ppr=document.getElementById("ppr");
        if(!ppr)return;
        var cg=ppr.querySelector(".cg");
        if(!cg)return;
        var cards=Array.prototype.slice.call(cg.children);
        cards.sort(function(a,b){
            var oa=a.classList.contains("lk")?1:0;
            var ob=b.classList.contains("lk")?1:0;
            return oa-ob;
        });
        cards.forEach(function(c){cg.appendChild(c);});
    };
})();

// ============================================================
// Research functions
// ============================================================
function doResearch(researchId){
    if(!GS.research)GS.research={completed:[]};
    if(GS.research.completed.indexOf(researchId)!==-1){notify("已研究过此项目！");return;}
    var rd=DataRegistry.get("research",researchId);
    if(!rd){notify("未知研究项目");return;}
    if(rd.requires){
        for(var i=0;i<rd.requires.length;i++){
            if(GS.research.completed.indexOf(rd.requires[i])===-1){
                var preRd=DataRegistry.get("research",rd.requires[i]);
                notify("需要先完成前置研究："+(preRd?preRd.n:rd.requires[i]));
                return;
            }
        }
    }
    if(rd.cost){
        for(var rk in rd.cost){
            if(!GS.inventory[rk]||GS.inventory[rk]<rd.cost[rk]){
                var rn2=rk;if(CROP_DEFS[rk]&&CROP_DEFS[rk].n)rn2=CROP_DEFS[rk].n;else if(rk==="seeds")rn2="种子";else if(rk==="egg")rn2="鸡蛋";else if(rk==="milk")rn2="牛奶";else if(rk==="wool")rn2="羊毛";else if(rk==="flour")rn2="面粉";else if(rk==="bread")rn2="面包";notify("资源不足：需要"+rd.cost[rk]+"个"+rn2);
                return;
            }
        }
    }
    if(rd.cost){
        for(var rk2 in rd.cost){GS.inventory[rk2]-=rd.cost[rk2];}
    }
    GS.research.completed.push(researchId);
    if(rd.unlocks){
        for(var ui=0;ui<rd.unlocks.length;ui++){
            var u=rd.unlocks[ui];
            if(u.type==="upgrade"){
                notify("解锁升级："+(UPG_DEFS[u.id]?UPG_DEFS[u.id].n:u.id));
            }else if(u.type==="crop"){
                if(GS.discoveredCrops.indexOf(u.id)===-1){GS.discoveredCrops.push(u.id);}
                notify("解锁作物："+(CROP_DEFS[u.id]?CROP_DEFS[u.id].n:u.id));
            }else if(u.type==="resource"){
                if(!GS.inventory[u.k])GS.inventory[u.k]=0;
                GS.inventory[u.k]+=u.q;
                notify("获得资源："+u.k+" x"+u.q);
            }else if(u.type==="region"){
                if(GS.regions[u.id])GS.regions[u.id].unlocked=true;
                notify("解锁地域："+u.id);
            }else if(u.type==="story"){
                checkStory(u.id);
            }
        }
    }
    notify("研究完成："+rd.n+"！");
    renderResearch();renderUpgrades();R();
}

function renderResearch(){
    if(!GS.research)GS.research={completed:[]};
    var rids=DataRegistry.ids("research");
    var h='<div class="cd"><h3>🔬 研究项目</h3><div class="tt">研究不随转生重置</div><div class="cg">';
    // Sort: uncompleted first, completed last
    var sortedRids=rids.slice().sort(function(a,b){
        var da=GS.research.completed.indexOf(a)!==-1?1:0;
        var db=GS.research.completed.indexOf(b)!==-1?1:0;
        return da-db;
    });
    for(var i=0;i<sortedRids.length;i++){
        var rid=sortedRids[i];
        var rd=DataRegistry.get("research",rid);
        if(!rd)continue;
        var done=GS.research.completed.indexOf(rid)!==-1;
        var canDo=true;
        if(rd.requires){
            for(var j=0;j<rd.requires.length;j++){
                if(GS.research.completed.indexOf(rd.requires[j])===-1){canDo=false;break;}
            }
        }
        if(!canDo&&!done)continue;
        var costStr='';
        if(rd.cost){
            var parts=[];
            for(var rk in rd.cost){var rn=rk;if(CROP_DEFS[rk]&&CROP_DEFS[rk].n)rn=CROP_DEFS[rk].n;else if(rk==="seeds")rn="种子";else if(rk==="egg")rn="鸡蛋";else if(rk==="milk")rn="牛奶";else if(rk==="wool")rn="羊毛";else if(rk==="flour")rn="面粉";else if(rk==="bread")rn="面包";parts.push(rd.cost[rk]+' '+rn);}
            costStr=parts.join(', ');
        }
        h+='<div class="sl'+(done?' rd':'')+(!canDo&&!done?' lk':'')+'"';
        if(!done&&canDo)h+=' data-action="doResearch" data-rid="'+rid+'"';
        h+='><div style="font-size:2em">'+(rd.i||'🔬')+'</div><div>'+rd.n+'</div>';
        h+='<div class="tt">'+rd.desc+'</div>';
        if(!done&&costStr)h+='<div class="tt">消耗:'+costStr+'</div>';
        if(done)h+='<div style="color:#66bb6a">✅ 已完成</div>';
        h+='</div>';
    }
    h+='</div></div>';
    var pr2=document.getElementById("presearch");if(pr2)pr2.innerHTML=h;
}

// ============================================================
// Story group definitions
// ============================================================
var STORY_GROUPS = [
    {id:"oldfarmer", n:"老农日记", i:"📜", match:function(k){return k.indexOf("老农日记")===0||k.indexOf("老农的遗")===0||(STORIES[k]&&STORIES[k].t&&STORIES[k].t.indexOf("老农")===0);}},
    {id:"newcomer",  n:"后来者日记", i:"📘", match:function(k){return k.indexOf("后来者")===0||(STORIES[k]&&STORIES[k].t&&STORIES[k].t.indexOf("后来者")===0);}}
];
function getStoryGroup(k){
    for(var gi=0;gi<STORY_GROUPS.length;gi++){
        if(STORY_GROUPS[gi].match(k))return STORY_GROUPS[gi].id;
    }
    // Default to oldfarmer group
    return "oldfarmer";
}

// ============================================================
// Override renderJournal — sort + group + collapse
// ============================================================
renderJournal = function(){
    var h='<div class="cd"><h3>📜 故事</h3>';
    if(GS.storyFragments.length===0){
        h+='<div class="tt">还没有发现任何故事碎片。继续探索农场吧。</div>';
    }else{
        // Group stories
        var groups={};
        for(var i=0;i<GS.storyFragments.length;i++){
            var k=GS.storyFragments[i];
            var f=STORIES[k];
            if(!f)continue;
            var gid=getStoryGroup(k);
            if(!groups[gid])groups[gid]={id:gid,fragments:[]};
            groups[gid].fragments.push({k:k,f:f});
        }
        // Sort fragments within each group by number
        function extractNum(title){
            var m=title.match(/其([一二三四五六七八九十百千万]+)/);
            if(!m)return 99;
            var cn="一二三四五六七八九十百千万";
            var cv=[1,2,3,4,5,6,7,8,9,10,100,1000,10000];
            var idx=cn.indexOf(m[1]);
            return idx>=0?cv[idx]:99;
        }
        for(var gid in groups){
            groups[gid].fragments.sort(function(a,b){
                return extractNum(a.f.t)-extractNum(b.f.t);
            });
        }
        // Render groups
        for(var gi=0;gi<STORY_GROUPS.length;gi++){
            var sg=STORY_GROUPS[gi];
            var gdata=groups[sg.id];
            if(!gdata||gdata.fragments.length===0)continue;
            var expanded=GS._expandedJournalGroups&&GS._expandedJournalGroups[sg.id];
            h+='<div class="cd"><h3 style="cursor:pointer" data-action="toggleGroup" data-gid="'+sg.id+'">'+sg.i+' '+sg.n+' ('+gdata.fragments.length+')</h3>';
            h+='<div class="sg-body" style="display:'+(expanded?'':'none')+'">';
            for(var fi=0;fi<gdata.fragments.length;fi++){
                var frag=gdata.fragments[fi];
                h+='<div class="sf"><strong>'+frag.f.t+'</strong><p>'+frag.f.x+'</p></div>';
            }
            h+='</div></div>';
        }
    }
    h+='</div>';
    var pj=document.getElementById("pj");if(pj)pj.innerHTML=h;
};

// ============================================================
// Override renderBestiary — use formatTime
// ============================================================
(function(){
    var _renderBestiary = renderBestiary;
    renderBestiary = function(){
        _renderBestiary();
        // Post-process to replace "Xs" with formatTime
        var pb=document.getElementById("pb");
        if(!pb)return;
        var tts=pb.querySelectorAll(".tt");
        for(var i=0;i<tts.length;i++){
            var tt=tts[i];
            var m=tt.textContent.match(/生长:(\d+)s/);
            if(m){
                var sec=parseInt(m[1]);
                tt.textContent=tt.textContent.replace(/生长:\d+s/,"生长:"+formatTime(sec));
            }
        }
    };
})();

// ============================================================
// Override renderAll — include research
// ============================================================
renderAll = function(){
    R();
    renderFarm();renderSeedStore();renderAnimals();renderProc();renderUpgrades();renderTrade();
    renderBestiary();renderAch();renderJournal();renderPrestige();renderRelics();
    renderTutorial();renderInventory();renderSystem();renderResearch();
};

// ============================================================
// Override renderUpgrades — hide research-only upgrades
// ============================================================
(function(){
    var _renderUpgrades = renderUpgrades;
    renderUpgrades = function(){
        var h='<div class="cd"><h3>⬆ 科技升级</h3><div class="cg">';
        var upgKeys=Object.keys(UPG_DEFS).sort(function(a,b){
            var oa=GS.upgrades[a]?1:0;
            var ob=GS.upgrades[b]?1:0;
            return oa-ob;
        });
        for(var ki=0;ki<upgKeys.length;ki++){var k=upgKeys[ki];
            var d=UPG_DEFS[k];
            if(!d)continue;
            if(d.reqResearch){
                if(!GS.research||!GS.research.completed||GS.research.completed.indexOf(d.reqResearch)===-1)continue;
            }
            if(d.reqUpgrade&&!GS.upgrades[d.reqUpgrade])continue;
            var ow=GS.upgrades[k];
            var ul=GS.totalCoinsEarned>=d.unlock;
            h+='<div class="sl'+(ow?' rd':'')+(!ul&&!ow?' lk':'')+'"><div style="font-size:2em">'+d.i+'</div><div>'+d.n+'</div><div class="tt">'+d.d+'</div>'+(ow?'<div style="color:#66bb6a">✅ 已拥有</div>':ul?'<button class="bt sm bl" data-action="buyUpgrade" data-uid="'+k+'">购买 ('+d.c+'💰)</button>':'<div class="tt">需累计 '+d.unlock+'💰</div>')+'</div>';
        }
        h+='</div></div>';
        var pu=document.getElementById("pu");if(pu)pu.innerHTML=h;
    };
})();
// ============================================================
// ============================================================
// Override renderInventory — dynamic, mod-aware, three display modes
// ============================================================
renderInventory = function(){
    if(!GS._invDisplayMode)GS._invDisplayMode="alpha";
    var h='<div class="cd"><h3>📦 资源库存</h3>';
    // Mode switcher
    var modes=[{id:"alpha",n:"字典序"},{id:"category",n:"按种类"},{id:"mod",n:"按模组"}];
    h+='<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
    for(var mi=0;mi<modes.length;mi++){
        var isActive=GS._invDisplayMode===modes[mi].id;
        h+='<button class="bt sm'+(isActive?' gn':'')+'" onclick="GS._invDisplayMode=\x27'+modes[mi].id+'\x27;renderInventory();" style="font-size:.7em">'+modes[mi].n+'</button>';
    }
    h+='</div>';
    h+='<div class="cg">';
    // Build dynamic catalog
    var cat={};
    cat.seeds={n:"种子",i:"🌱",v:4,cat:"种子",mod:null};
    // Helper: get modId
    function getModId(k){
        var reg=DataRegistry.get("crop",k);if(reg&&reg.__modId)return reg.__modId;
        reg=DataRegistry.get("hybrid",k);if(reg&&reg.__modId)return reg.__modId;
        reg=DataRegistry.get("animal",k);if(reg&&reg.__modId)return reg.__modId;
        reg=DataRegistry.get("processor",k);if(reg&&reg.__modId)return reg.__modId;
        reg=DataRegistry.get("upgrade",k);if(reg&&reg.__modId)return reg.__modId;
        reg=DataRegistry.get("achievement",k);if(reg&&reg.__modId)return reg.__modId;
        return null;
    }
    // Crops (base + hybrid)
    for(var ck in CROP_DEFS){
        var cd=CROP_DEFS[ck];
        var ccat=cd.isHybrid?"杂交作物":"作物";
        cat[ck]={n:cd.n,i:cd.i||"📦",v:cd.v,cat:ccat,mod:getModId(ck)};
    }
    // Animal products
    for(var ak in ANIMAL_DEFS){
        var ad=ANIMAL_DEFS[ak];
        if(ad.p)cat[ad.p.k]={n:ad.p.n,i:ad.p.i||"📦",v:ad.p.v,cat:"动物产物",mod:getModId(ad.p.k)};
    }
    // Processor outputs
    for(var pk in PROC_DEFS){
        var pd=PROC_DEFS[pk];
        if(pd.out)cat[pd.out.k]={n:pd.out.n,i:pd.out.i||"📦",v:pd.out.v,cat:"加工品",mod:getModId(pd.out.k)};
    }
    // Extra items from inventory not in catalog (mod items)
    for(var ek in GS.inventory){
        if(!cat[ek]&&GS.inventory[ek]>0)cat[ek]={n:ek,i:"📦",v:10,cat:"其他",mod:getModId(ek)||"未知模组"};
    }
    // Build sorted list based on mode
    var items=[];
    for(var ck2 in cat){items.push({k:ck2,n:cat[ck2].n,i:cat[ck2].i,v:cat[ck2].v,cat:cat[ck2].cat,mod:cat[ck2].mod});}
    if(GS._invDisplayMode==="alpha"){
        items.sort(function(a,b){return a.n.localeCompare(b.n,"zh");});
    }else if(GS._invDisplayMode==="category"){
        var catOrder={种子:0,作物:1,杂交作物:2,动物产物:3,加工品:4,其他:5};
        items.sort(function(a,b){
            var ca=catOrder[a.cat]!==undefined?catOrder[a.cat]:9;
            var cb=catOrder[b.cat]!==undefined?catOrder[b.cat]:9;
            if(ca!==cb)return ca-cb;
            return a.n.localeCompare(b.n,"zh");
        });
    }else if(GS._invDisplayMode==="mod"){
        items.sort(function(a,b){
            var ma=a.mod||"原版";var mb=b.mod||"原版";
            if(ma!==mb)return ma.localeCompare(mb,"zh");
            return a.n.localeCompare(b.n,"zh");
        });
    }
    var hasAny=false;var lastCat=null;var lastMod=null;
    for(var ii=0;ii<items.length;ii++){
        var it=items[ii];var qty=GS.inventory[it.k]||0;
        if(qty>0)hasAny=true;
        // Category/mod headers
        if(GS._invDisplayMode==="category"&&it.cat!==lastCat){
            h+='<div style="grid-column:1/-1;padding:6px 0 2px;color:#ffcc80;font-weight:bold;font-size:.85em">'+it.cat+'</div>';
            lastCat=it.cat;
        }
        if(GS._invDisplayMode==="mod"&&it.mod!==lastMod){
            var modLabel=it.mod||"原版";
            if(it.mod&&window.__modManifest){
                for(var mi2=0;mi2<window.__modManifest.length;mi2++){
                    if(window.__modManifest[mi2].id===it.mod){modLabel=window.__modManifest[mi2].name;break;}
                }
            }
            h+='<div style="grid-column:1/-1;padding:6px 0 2px;color:#90caf9;font-weight:bold;font-size:.85em">'+modLabel+'</div>';
            lastMod=it.mod;
        }
        var sv=Math.floor(it.v*(1+GS.prestigePoints*0.1)*(GS.gemUpgrades&&GS.gemUpgrades.goldenLegend?1.2:1));
        h+='<div class="sl'+(qty>0?'':' lk')+'" style="min-height:115px"><div style="font-size:2.2em">'+it.i+'</div><div style="font-weight:bold">'+it.n+'</div><div class="tt">库存:'+qty+' | 单价:'+sv+'💰</div>';
        if(qty>0&&it.k!=="seeds"){
            h+='<div style="margin-top:5px">';
            h+='<button class="bt sm gn" onclick="window._sellK=\x27'+it.k+'\x27;window._sellQ=1;sellItem(window._sellK,window._sellQ)" style="font-size:.65em;padding:3px 8px">售1</button> ';
            if(qty>=10)h+='<button class="bt sm gn" onclick="window._sellK=\x27'+it.k+'\x27;window._sellQ=10;sellItem(window._sellK,window._sellQ)" style="font-size:.65em;padding:3px 8px">售10</button> ';
            h+='<button class="bt sm rd" onclick="window._sellK=\x27'+it.k+'\x27;window._sellQ='+qty+';sellItem(window._sellK,window._sellQ)" style="font-size:.65em;padding:3px 8px">售全部</button>';
            h+='</div>';
        }
        h+='</div>';
    }
    if(!hasAny)h+='<div style="text-align:center;padding:20px;color:#999">📭 暂无库存，收获作物或动物产品后将显示在这里。</div>';
    h+='</div></div>';
    var pinv=document.getElementById("pinv");if(pinv)pinv.innerHTML=h;
};

// ============================================================
// Tab switching — add research tab to panelMap
// ============================================================
(function(){
    var tabs=document.getElementById("tabs");
    if(tabs){
        tabs.addEventListener("click",function(e){
            var t=findTabEl(e.target,tabs);
            if(!t)return;
            var pn=t.getAttribute("data-pn");
            var allTabs=tabs.querySelectorAll(".tb");
            for(var i=0;i<allTabs.length;i++)allTabs[i].classList.remove("ac");
            t.classList.add("ac");
            var panels=document.querySelectorAll(".pn");
            for(var j=0;j<panels.length;j++)panels[j].classList.remove("ac");
            var panelMap={farm:"pf",animals:"pa",process:"pp",upgrades:"pu",trade:"pt",bestiary:"pb",achievements:"pach",journal:"pj",prestige:"ppr",relics:"pr",tutorial:"ptut",research:"presearch",inventory:"pinv",system:"psys",modedit:"pmodedit"};
            var targetEl=document.getElementById(panelMap[pn]);
            if(targetEl)targetEl.classList.add("ac");
            var ss=document.getElementById("seedstore");
            if(ss){if(pn==="farm")ss.classList.add("ac");else ss.classList.remove("ac");}
        });
    }
})();

// ============================================================
// Event delegation — pa panel (add releaseAnimal)
(function(){
    var pa=document.getElementById("pa");
    if(pa)pa.addEventListener("click",function(e){
        var el=findActEl(e.target,this);if(!el)return;
        var act=el.getAttribute("data-action");if(!act)return;
        var aidx=el.getAttribute("data-aidx");
        if(act==="releaseAnimal"){releaseAnimal(parseInt(aidx));}
    });
})();

// Event delegation — journal toggle
(function(){
    var pj=document.getElementById("pj");
    if(pj)pj.addEventListener("click",function(e){
        var el=e.target;
        while(el&&el!==pj&&el!==document.body){
            if(el.nodeType===1&&el.getAttribute("data-action")==="toggleGroup"){
                var gid=el.getAttribute("data-gid");
                if(gid){
                    if(!GS._expandedJournalGroups)GS._expandedJournalGroups={};
                    if(GS._expandedJournalGroups[gid])delete GS._expandedJournalGroups[gid];
                    else GS._expandedJournalGroups[gid]=true;
                    renderJournal();
                }
                return;
            }
            el=el.parentNode;
        }
    });
})();

// Event delegation — research panel
// ============================================================
(function(){
    var pr2=document.getElementById("presearch");
    if(pr2)pr2.addEventListener("click",function(e){
        var el=findActEl(e.target,this);if(!el)return;
        var act=el.getAttribute("data-action");if(!act)return;
        var rid=el.getAttribute("data-rid");
        if(act==="doResearch"){doResearch(rid);}
    });
})();

// ============================================================
// Prevent enter key in seed input from doing weird things
(function(){
    var si=document.getElementById("seedBuyQty");
    if(si)si.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();var bn=parseInt(this.value)||1;if(bn<1)bn=1;buySeedsN(bn);renderFarm();R();}});
})();

// Event delegation — pf panel (region-based + water/shovel)
// ============================================================
(function(){
    var pf=document.getElementById("pf");
    if(pf){
        pf.addEventListener("click",function(e){
            var el=findActEl(e.target,this);if(!el)return;
            var act=el.getAttribute("data-action");if(!act)return;
            var regionId=el.getAttribute("data-rid");
            var sid=el.getAttribute("data-sid");
            var cid=el.getAttribute("data-cid");
            if(act==="harvest"){harvestSlot(regionId,parseInt(sid));}
            else if(act==="unlock"){unlockLand(regionId,parseInt(sid));renderFarm();R();}
            else if(act==="plant"){showPlants(regionId,parseInt(sid));}
            else if(act==="buySeeds"){var bn=parseInt(el.getAttribute("data-n"))||5;buySeedsN(bn);renderFarm();R();}
            else if(act==="buySeedsInput"){var qtyEl=document.getElementById("seedBuyQty");var qty=qtyEl?parseInt(qtyEl.value)||1:1;if(qty<1)qty=1;if(qty>9999)qty=9999;buySeedsN(qty);renderFarm();R();}
            else if(act==="doPlant"){doPlant(regionId,parseInt(sid),cid);}
            else if(act==="cancelPlant"){GS._planting=-1;renderFarm();R();}
            else if(act==="water"){waterCrop(regionId,parseInt(sid));renderFarm();R();}
            else if(act==="shovel"){shovelCrop(regionId,parseInt(sid));renderFarm();R();}
        });
    }
})();

// ============================================================
// Greenhouse toggle
// ============================================================
window.toggleGreenhouse = function(){
    if(!GS.upgrades.greenhouse){notify("请先解锁温室升级！");return;}
    GS.greenhouseOn = GS.greenhouseOn===false ? true : false;
    notify(GS.greenhouseOn!==false ? "🏠 温室已开启" : "🏠 温室已关闭");
    saveGame();
};
(function(){
    var _R_gh = R;
    R = function(){
        _R_gh();
        var ghBtn = document.getElementById("btnGreenhouse");
        if(ghBtn){
            var on = GS.greenhouseOn !== false;
            ghBtn.textContent = "🏠 温室: " + (on ? "开" : "关");
            ghBtn.className = "bt sm" + (on ? " gn" : " rd");
            ghBtn.style.display = GS.upgrades.greenhouse ? "inline-block" : "none";
        }
    };
})();

// ============================================================
// Start the game
// ============================================================
// Inject greenhouse toggle button before game starts
(function(){
    var toggleDiv = document.getElementById("scarecrowToggle");
    if(toggleDiv){
        var ghBtn = document.createElement("button");
        ghBtn.id = "btnGreenhouse";
        ghBtn.className = "bt sm";
        ghBtn.style.display = "none";
        ghBtn.onclick = function(){ toggleGreenhouse(); };
        toggleDiv.appendChild(document.createTextNode(" "));
        toggleDiv.appendChild(ghBtn);
    }
})();

// Inject seedstore div before pf
(function(){
    var pf=document.getElementById("pf");
    if(pf){
        var ss=document.createElement("div");
        ss.id="seedstore";
        ss.className="pn ac";
        ss.style.cssText="margin:6px 0";
        pf.parentNode.insertBefore(ss,pf);
    }
})();

startGame();

// ============================================================
// Helper: iterate all crop slots across all regions
// ============================================================
function forEachCropSlot(fn){
    if(!GS.regions)return;
    for(var rid in GS.regions){
        var region=GS.regions[rid];
        if(!region||!region.unlocked||!region.lands)continue;
        for(var li=0;li<region.lands.length;li++){
            var s=region.lands[li];
            if(s&&s.unlocked&&s.crop)fn(s,rid,li);
        }
    }
}
function forEachLandSlot(fn){
    if(!GS.regions)return;
    for(var rid in GS.regions){
        var region=GS.regions[rid];
        if(!region||!region.unlocked||!region.lands)continue;
        for(var li=0;li<region.lands.length;li++){
            var s=region.lands[li];
            if(s&&s.unlocked)fn(s,rid,li);
        }
    }
}

// ============================================================
// Override genMerchant — use all inventory items
// ============================================================
genMerchant = function(){
    if(GS.merchantOffers.length>6)GS.merchantOffers=[];
    var avail=[];
    for(var ik in GS.inventory){
        if(ik==="seeds"||!GS.inventory[ik]||GS.inventory[ik]<=0)continue;
        var iname=ik;
        if(CROP_DEFS[ik]&&CROP_DEFS[ik].n)iname=CROP_DEFS[ik].n;
        else if(ik==="flour")iname="面粉";
        else if(ik==="bread")iname="面包";
        else if(ik==="egg")iname="鸡蛋";
        else if(ik==="milk")iname="牛奶";
        else if(ik==="wool")iname="羊毛";
        avail.push({k:ik,n:iname,q:GS.inventory[ik]});
    }
    if(avail.length===0&&(GS.inventory.seeds||0)>5){
        avail.push({k:"seeds",n:"种子",q:GS.inventory.seeds||0});
    }
    var prestigeMul=1+GS.prestigePoints*0.1;
    for(var i=0;i<3;i++){
        if(avail.length===0)break;
        var idx2=Math.floor(Math.random()*avail.length);
        var picked=avail[idx2];
        var baseVal=10;
        if(CROP_DEFS[picked.k])baseVal=CROP_DEFS[picked.k].v;
        var sellQty=Math.max(1,Math.floor(picked.q*0.3));
        if(sellQty<1)sellQty=1;
        var sellPrice=Math.floor(baseVal*sellQty*0.7*prestigeMul);
        if(sellPrice<5)sellPrice=5;
        GS.merchantOffers.push({t:"sell",k:picked.k,n:picked.n,q:sellQty,p:sellPrice});
    }
    var buyPool=[];
    for(var bk in CROP_DEFS){
        if(!GS.inventory[bk]||GS.inventory[bk]<10)buyPool.push({k:bk,n:CROP_DEFS[bk].n,v:CROP_DEFS[bk].v});
    }
    if(buyPool.length>0){
        var count=1+Math.floor(Math.random()*2);
        for(var j=0;j<count&&buyPool.length>0;j++){
            var bi=Math.floor(Math.random()*buyPool.length);
            var bp=buyPool[bi];
            var bq=1+Math.floor(Math.random()*5);
            var bp2=Math.floor(bp.v*bq*1.3*prestigeMul);
            if(bp2<10)bp2=10;
            GS.merchantOffers.push({t:"buy",k:bp.k,n:bp.n,q:bq,p:bp2});
            buyPool.splice(bi,1);
        }
    }
    if(GS.merchantOffers.length>0)notify("商人来了！查看贸易面板。");
};

// ============================================================
// Override randEvent — fix GS.land references
// ============================================================
randEvent = function(){
    var evs=[
        {n:"天降甘霖",d:"雨水滋润了土地！",ef:function(){GS.weatherTimer=60;GS.weather="rainy";}},
        {n:"兔子来袭",d:"兔子偷吃了一些作物，但留下了兔毛可卖钱。",ef:function(){GS.coins+=Math.floor(Math.random()*200)+50;forEachCropSlot(function(s){if(Math.random()<0.15)s.crop.timer=Math.max(0,s.crop.timer-30);});}},
        {n:"双倍市价日",d:"市场行情大涨，60秒内收获价值翻倍。",ef:function(){window._doubleValue=true;window._doubleValueEnd=Date.now()+60000;setTimeout(function(){window._doubleValue=false;window._doubleValueEnd=0;},60000);}},
        {n:"神秘商人",d:"一位神秘商人高价收购你的产品！",ef:function(){var b=Math.floor(Math.random()*1000)+300;GS.coins+=b;GS.totalCoinsEarned+=b;notify("神秘商人给了你"+b+"💰");}},
        {n:"发现种子袋",d:"在田地边缘发现了被遗忘的种子！",ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+8;notify("获得 8 颗种子！");}},
        {n:"友善的邻居",d:"邻居老张送来了他培育的新品种！",ef:function(){var lk=[];for(var k in CROP_DEFS){if(GS.discoveredCrops.indexOf(k)===-1&&CROP_DEFS[k].unlock<=GS.totalCoinsEarned+5000)lk.push(k);}if(lk.length>0){var cid=lk[Math.floor(Math.random()*lk.length)];GS.discoveredCrops.push(cid);notify("解锁了新品种："+CROP_DEFS[cid].n+"！");}}},
        {n:"害虫入侵",d:"害虫破坏庄稼，部分作物生长倒退。",ef:function(){forEachCropSlot(function(s){if(Math.random()<0.3)s.crop.timer=Math.max(0,s.crop.timer-60);});}},
        {n:"丰收庆典",d:"镇上举办丰收庆典，获得金币奖励！",ef:function(){var b=Math.floor(Math.random()*500)+500;GS.coins+=b;GS.totalCoinsEarned+=b;notify("庆典奖励："+b+"💰！");}},
        {n:"大地赐福",d:"土地异常肥沃，所有作物瞬间成熟！",ef:function(){forEachCropSlot(function(s){s.crop.timer=s.crop.gt;});}},
        {n:"流浪猫到访",d:"一只橘猫在农场安了家。它不干活，但让你的心情变好了。",ef:function(){GS.gems=(GS.gems||0)+1;notify("获得1颗宝石💎（猫咪带来的好运）");}},
        {n:"土地塌陷",d:"一块地下陷，露出了一些奇怪的古物。",ef:function(){var b=Math.floor(Math.random()*800)+400;GS.coins+=b;GS.totalCoinsEarned+=b;notify("古物卖了 "+b+"💰！");}},
        {n:"鸟群来袭",d:"一群鸟偷吃种子！",ef:function(){GS.inventory.seeds=Math.max(0,(GS.inventory.seeds||0)-Math.floor(Math.random()*5+1));notify("损失了一些种子...");}},
        {n:"天气预报错误",d:"原本预报的天气突然反转！",ef:function(){var wr=["sunny","cloudy","rainy","storm"];GS.weather=wr[Math.floor(Math.random()*wr.length)];GS.weatherTimer=90+Math.random()*120;notify("天气突变："+GS.weather+"！");}},
        {n:"旅行商人停留",d:"一个疲惫的商人借宿一晚，留下了一些稀有货物。",ef:function(){genMerchant();notify("商人留下了一批货物！");}},
        {n:"地下温泉",d:"地质勘探队在农场地下发现温泉，土壤变得异常肥沃。",ef:function(){GS.weatherTimer=30;GS.weather="rainy";forEachCropSlot(function(s2){s2.crop.timer*=1.8;});}},
        {n:"植物突变",d:"一株作物发生了奇怪的变化，价值暴增！",ef:function(){forEachLandSlot(function(s3,rid,li){if(s3.crop&&Math.random()<0.2){var b2=CROP_DEFS[s3.crop.id].v*8;GS.coins+=b2;GS.totalCoinsEarned+=b2;notify("突变作物价值"+b2+"💰！");s3.crop=null;return true;}});}},
        {n:"农具促销",d:"镇上五金店大甩卖，升级费用打折！",ef:function(){var b3=Math.floor(Math.random()*300)+200;GS.coins+=b3;GS.totalCoinsEarned+=b3;notify("省下了"+b3+"💰！");}},
        {n:"金色传说",d:"一道金光从田中出现——一株作物镀上了金色！",ef:function(){forEachCropSlot(function(s4){if(Math.random()<0.15){s4.crop.timer=s4.crop.gt;return true;}});notify("金色作物瞬间成熟！");}},
        {n:"丰收女神的祝福",d:"丰收女神路过此地，被你的勤劳打动。",ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+15;var b4=Math.floor(Math.random()*2000)+1000;GS.coins+=b4;GS.totalCoinsEarned+=b4;notify("丰收女神赐予 "+b4+"💰 和 15 颗种子！");}},
        {n:"虫害预警",d:"农业局发来虫害预警，但你的杀虫剂刚好够用。",ef:function(){if(Math.random()<0.5){notify("成功抵御虫害！");}else{forEachCropSlot(function(s5){if(Math.random()<0.25)s5.crop.timer=Math.max(0,s5.crop.timer-50);});notify("虫害造成部分损失...");}}}
    ];
    var ev=evs[Math.floor(Math.random()*evs.length)];
    notify("📙 "+ev.n+"："+ev.d);
    if(GS._seenEvents&&GS._seenEvents.indexOf(ev.n)===-1){GS._seenEvents.push(ev.n);notify("🔁 发现新事件："+ev.n);}
    ev.ef();
};
