"use strict";if(!Object.assign){Object.assign=function(t){for(var s,i=1;i<arguments.length;i++){s=arguments[i];for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k))t[k]=s[k];}}return t;};}

var GS={coins:0,gems:0,prestigePoints:0,totalCoinsEarned:0,totalCropsHarvested:0,totalAnimalsRaised:0,year:1,season:0,seasonTimer:0,seasonDuration:1800,weather:"sunny",weatherTimer:0,land:[],maxLand:6,animals:[],maxAnimals:4,upgrades:{},processors:{},inventory:{seeds:10},discoveredCrops:["wheat"],discoveredAnimals:[],discoveredHybrids:[],achievements:{},storyFragments:[],eventCooldown:0,merchantTimer:0,merchantOffers:[],scarecrowOn:true,lastSave:0};
var SNAMES=["spring","summer","autumn","winter"];
var SICONS=["🌸 春季","☀️ 夏季","🍂 秋季","❄️ 冬季"];
var CROP_DEFS={wheat:{n:"小麦",i:"🌾",g:60,v:10,soil:null,unlock:0},carrot:{n:"胡萝卜",i:"🥕",g:90,v:16,soil:null,unlock:500},potato:{n:"土豆",i:"🥔",g:120,v:25,soil:"clay",unlock:2000},tomato:{n:"番茄",i:"🍅",g:150,v:35,soil:null,unlock:5000},corn:{n:"玉米",i:"🌽",g:180,v:50,soil:"sand",unlock:12000},strawberry:{n:"草莓",i:"🍓",g:210,v:70,soil:"dark",unlock:30000},pumpkin:{n:"南瓜",i:"🎃",g:260,v:100,soil:"dark",unlock:70000},watermelon:{n:"西瓜",i:"🍉",g:320,v:160,soil:"sand",unlock:200000},blueberry:{n:"蓝莓",i:"🫐",g:200,v:60,soil:"dark",unlock:60000},sunflower:{n:"向日葵",i:"🌻",g:160,v:45,soil:null,unlock:35000},grape:{n:"葡萄",i:"🍇",g:280,v:130,soil:"clay",unlock:150000},pepper:{n:"辣椒",i:"🌶️",g:140,v:40,soil:"sand",unlock:40000}};
var HYBRID_DEFS={"carrot_pumpkin":{n:"金色胡萝卜",i:"✨🥕",p:["carrot","pumpkin"],ch:0.15,v:120,unlock:50000},"corn_blueberry":{n:"紫玉米",i:"💜🌽",p:["corn","blueberry"],ch:0.12,v:100,unlock:60000},"tomato_pepper":{n:"火焰番茄",i:"🔥🍅",p:["tomato","pepper"],ch:0.1,v:90,unlock:45000},"wheat_sunflower":{n:"金穗麦",i:"🌟🌾",p:["wheat","sunflower"],ch:0.08,v:150,unlock:100000},"strawberry_grape":{n:"宝石莓",i:"💎🍓",p:["strawberry","grape"],ch:0.06,v:200,unlock:150000},"watermelon_pumpkin":{n:"巨无霸瓜",i:"🏆🎃",p:["watermelon","pumpkin"],ch:0.05,v:300,unlock:250000}};
var ANIMAL_DEFS={chicken:{n:"鸡",i:"🐔",c:200,p:{n:"鸡蛋",i:"🥚",t:120,v:15,k:"egg"},am:100,unlock:800},cow:{n:"牛",i:"🐮",c:800,p:{n:"牛奶",i:"🥛",t:200,v:40,k:"milk"},am:120,unlock:4000},sheep:{n:"羊",i:"🐑",c:2000,p:{n:"羊毛",i:"🧶",t:250,v:60,k:"wool"},am:100,unlock:12000},pig:{n:"猪",i:"🐷",c:5000,p:{n:"松露",i:"🍄",t:350,v:150,k:"truffle"},am:80,unlock:30000}};
var PROC_DEFS={mill:{n:"磨坊",i:"🏭",c:400,inp:{k:"wheat",n:"小麦"},out:{k:"flour",n:"面粉",i:"🌾📦",v:20},t:30,unlock:1000},bakery:{n:"面包房",i:"🍞",c:2000,inp:{k:"flour",n:"面粉"},out:{k:"bread",n:"面包",i:"🍞",v:60},t:45,unlock:5000},dairy:{n:"奶酪坊",i:"🧀",c:4000,inp:{k:"milk",n:"牛奶"},out:{k:"cheese",n:"奶酪",i:"🧀",v:100},t:50,unlock:12000},loom:{n:"织布机",i:"🧵",c:15000,inp:{k:"wool",n:"羊毛"},out:{k:"cloth",n:"布料",i:"👘",v:150},t:60,unlock:60000},smoker:{n:"熏制坊",i:"🔥",c:20000,inp:{k:"pumpkin",n:"南瓜"},out:{k:"smoked_pumpkin",n:"烟熏南瓜",i:"🔥🎃",v:200},t:60,unlock:100000},brewery:{n:"酿酒坊",i:"🍺",c:25000,inp:{k:"corn",n:"玉米"},out:{k:"corn_wine",n:"玉米酒",i:"🍺🌽",v:180},t:55,unlock:120000},jam_kitchen:{n:"果酱工坊",i:"🍯",c:30000,inp:{k:"strawberry",n:"草莓"},out:{k:"strawberry_jam",n:"草莓果酱",i:"🍯🍓",v:220},t:50,unlock:150000}};var UPG_DEFS={scarecrow:{n:"稻草人助手",i:"🤖",d:"自动播种",c:300,unlock:500,ef:"autoPlant"},irrigation:{n:"灌溉系统",i:"💧",d:"生长加速20%",c:1500,unlock:3000,ef:"grow",v:0.2},fertilizer:{n:"肥料研究",i:"🧪",d:"生长加速30%",c:5000,unlock:10000,ef:"grow",v:0.3},greenhouse:{n:"温室",i:"🏠",d:"无视季节限制",c:20000,unlock:50000,ef:"ignoreSeason"},autoHarvest:{n:"自动收割机",i:"🚜",d:"自动收获",c:15000,unlock:40000,ef:"autoHarvest"},sprinkler:{n:"高级洒水器",i:"🚿",d:"生长加速50%",c:30000,unlock:80000,ef:"grow",v:0.5},megaFert:{n:"超级肥料",i:"⚗️",d:"生长加速100%",c:100000,unlock:200000,ef:"grow",v:1.0},drone:{n:"无人机群",i:"🛸",d:"全自动管理",c:50000,unlock:150000,ef:"fullAuto"}};
var RELIC_DEFS={ancient_hoe:{n:"远古石锄",i:"🪨",d:"所有作物价值+15%",ef:"cropValue",v:0.15},fertility_totem:{n:"丰收图腾",i:"🗿",d:"生长速度+25%",ef:"grow",v:0.25},golden_sickle:{n:"黄金镰刀",i:"🔱",d:"收获时额外获得50%金币",ef:"harvestBonus",v:0.5},weather_vane:{n:"风向标",i:"🎏",d:"不利天气影响减半",ef:"weatherResist",v:0.5},ancient_seed_bag:{n:"远古种子袋",i:"🎒",d:"种子消耗-30%",ef:"seedDiscount",v:0.3},lucky_clover:{n:"四叶幸运草",i:"🍀",d:"杂交概率翻倍",ef:"hybridChance",v:2.0},merchant_contract:{n:"远古商契",i:"📜",d:"商人到访频率+50%",ef:"merchantFreq",v:0.5},time_hourglass:{n:"时之沙漏",i:"⏳",d:"加工时间-40%",ef:"processSpeed",v:0.4}};var ACH_DEFS=[{id:"first_harvest",n:"第一次收获",d:"收获第一棵作物",t:1,ch:function(){return GS.totalCropsHarvested>=1;}},{id:"harvest_50",n:"勤劳农民",d:"累计收获50次",t:2,ch:function(){return GS.totalCropsHarvested>=50;}},{id:"harvest_200",n:"丰收大师",d:"累计收获200次",t:3,ch:function(){return GS.totalCropsHarvested>=200;}},{id:"harvest_1000",n:"农业之王",d:"累计收获1000次",t:4,ch:function(){return GS.totalCropsHarvested>=1000;}},{id:"coins_1000",n:"小康之家",d:"累计获得1000金币",t:1,ch:function(){return GS.totalCoinsEarned>=1000;}},{id:"coins_10000",n:"农场大亨",d:"累计获得10000金币",t:2,ch:function(){return GS.totalCoinsEarned>=10000;}},{id:"coins_100000",n:"百万富翁",d:"累计获得100000金币",t:3,ch:function(){return GS.totalCoinsEarned>=100000;}},{id:"coins_1000000",n:"富甲一方",d:"累计获得1000000金币",t:4,ch:function(){return GS.totalCoinsEarned>=1000000;}},{id:"first_animal",n:"动物伙伴",d:"购买第一只动物",t:1,ch:function(){return GS.totalAnimalsRaised>=1;}},{id:"animals_10",n:"牧场主",d:"累计饲养10只动物",t:3,ch:function(){return GS.totalAnimalsRaised>=10;}},{id:"first_upgrade",n:"科技兴农",d:"购买第一个升级",t:1,ch:function(){var v=(function(o){var r=[];for(var k in o){if(o.hasOwnProperty(k))r.push(o[k]);}return r;})(GS.upgrades);for(var i=0;i<v.length;i++){if(v[i])return true;}return false;}},{id:"all_upgrades",n:"全自动化",d:"购买所有升级",t:4,ch:function(){var k=Object.keys(UPG_DEFS);for(var i=0;i<k.length;i++){if(!GS.upgrades[k[i]])return false;}return true;}},{id:"first_prestige",n:"新的开始",d:"完成第一次转生",t:3,ch:function(){return GS.prestigePoints>=1;}},{id:"prestige_5",n:"轮回之旅",d:"累计获得5个农场之心",t:4,ch:function(){return GS.prestigePoints>=5;}},{id:"prestige_20",n:"永恒农者",d:"累计获得20个农场之心",t:5,ch:function(){return GS.prestigePoints>=20;}},{id:"all_crops",n:"植物学家",d:"发现所有基础作物",t:3,ch:function(){var k=Object.keys(CROP_DEFS);for(var i=0;i<k.length;i++){if(GS.discoveredCrops.indexOf(k[i])===-1)return false;}return true;}},{id:"first_hybrid",n:"基因工程师",d:"培育出第一个杂交作物",t:3,ch:function(){return GS.discoveredHybrids.length>=1;}},{id:"all_hybrids",n:"杂交大师",d:"培育出所有杂交作物",t:5,ch:function(){return GS.discoveredHybrids.length>=Object.keys(HYBRID_DEFS).length;}},{id:"all_animals",n:"动物学家",d:"饲养过所有种类动物",t:3,ch:function(){var k=Object.keys(ANIMAL_DEFS);for(var i=0;i<k.length;i++){if(GS.discoveredAnimals.indexOf(k[i])===-1)return false;}return true;}},{id:"season_cycle",n:"四季轮回",d:"经历完整的四季循环",t:1,ch:function(){return GS.year>1;}},{id:"coins_10000000",n:"农场帝国",d:"累计获得10000000金币",t:5,ch:function(){return GS.totalCoinsEarned>=10000000;}},{id:"harvest_5000",n:"丰收之神",d:"累计收获5000次",t:5,ch:function(){return GS.totalCropsHarvested>=5000;}},{id:"animals_50",n:"动物园长",d:"累计饲养50只动物",t:5,ch:function(){return GS.totalAnimalsRaised>=50;}},{id:"seeds_1000",n:"种子大亨",d:"拥有1000颗种子",t:3,ch:function(){return (GS.inventory.seeds||0)>=1000;}},{id:"all_processors",n:"工业巨头",d:"拥有所有加工设施",t:3,ch:function(){var k=Object.keys(PROC_DEFS);for(var i=0;i<k.length;i++){if(!GS.processors[k[i]]||!GS.processors[k[i]].owned)return false;}return true;}},{id:"max_processor",n:"自动化大师",d:"任意加工设施达到5级",t:4,ch:function(){var k=Object.keys(GS.processors);for(var i=0;i<k.length;i++){if(GS.processors[k[i]]&&GS.processors[k[i]].level>=5)return true;}return false;}},{id:"land_10",n:"大地主",d:"拥有10块土地",t:3,ch:function(){return GS.land.length>=10;}},{id:"land_20",n:"领土之王",d:"拥有20块土地",t:5,ch:function(){return GS.land.length>=20;}},{id:"one_million_one_harvest",n:"一掷千金",d:"单次收获获得100000金币",t:4,ch:function(){if(!GS._maxSingleHarvest)GS._maxSingleHarvest=0;return GS._maxSingleHarvest>=100000;}},{id:"relic_1",n:"考古学家",d:"发现第一个遗迹",t:3,ch:function(){return (GS.relics||[]).length>=1;}},{id:"relic_5",n:"遗迹收集者",d:"发现5个遗迹",t:4,ch:function(){return (GS.relics||[]).length>=5;}},{id:"relic_all",n:"文明追溯者",d:"发现全部遗迹",t:5,ch:function(){return (GS.relics||[]).length>=Object.keys(RELIC_DEFS).length;}},{id:"speed_run",n:"速通达人",d:"1小时内完成首次转生",t:4,ch:function(){return GS.prestigePoints>=1&&GS.year<=2;}},{id:"all_stories",n:"故事收集者",d:"收集所有故事碎片",t:4,ch:function(){return GS.storyFragments.length>=Object.keys(STORIES).length;}}];
var STORIES={land_3:{t:"老农日记·其一",x:"今天在这片土地上挖出了一本破旧的日记。第一天，我种下了第一颗种子。土地虽然贫瘠，但我相信只要用心，它一定会回馈我。"},land_5:{t:"老农日记·其二",x:"又挖到一页日记。第三年，稻草人终于不够用了。我试着用木头做了个简单的灌溉装置，没想到效果出奇的好。"},animal_cow:{t:"老农日记·其三",x:"今天买了一头牛。它脾气倔得很，但产的奶是全镇最甜的。隔壁老王总想买走它，我才不卖。"},upgrade_greenhouse:{t:"老农日记·其四",x:"温室建好了！冬天也能种番茄了。孩子们说这是魔法，我说这是科学。不过有时候我也分不太清。"},hybrid_carrot_pumpkin:{t:"老农日记·其五",x:"不可思议！胡萝卜和南瓜竟然杂交出了金色的新品种！我决定叫它金色胡萝卜。"},season_2_0:{t:"老农日记·其六",x:"又是一年春天。已经在这里种了十年地了。有人问我不无聊吗？我说，每天都能看到新芽破土，怎么可能会无聊。"},processor_mill:{t:"老农日记·其七",x:"磨坊建好的那天，全镇的人都来帮忙。小麦变成面粉，面粉变成面包。我突然明白，农业的意义不只是养活自己，更是把人们聚在一起。"},prestige_1:{t:"老农日记·其八",x:"翻开日记最后一页，上面只有一句话：如果有一天你读到这里，说明你已经继承了这片土地。好好待它，它会好好待你。"},land_8:{t:"老农日记·其九",x:"在第八块地的深处挖到了一个铁盒子。里面是一张泛黄的照片，老农和一头牛的合影，背面写着最好的伙伴。"},animal_sheep:{t:"老农日记·其十",x:"羊来了之后，农场热闹多了。它们总是咩咩叫，像是在抱怨伙食不好。好吧，我承认有时候会偷偷多喂它们一些。"},upgrade_drone:{t:"老农日记·其十一",x:"我要是活在今天，一定想都不敢想，无人机在田地上空盘旋，自己播种自己收割。这才是真正的魔法。"},hybrid_strawberry_grape:{t:"老农日记·其十二",x:"草莓和葡萄杂交出的新品种美得像宝石。我把它叫做宝石莓。村里的小孩们抢着要吃。"},season_3_3:{t:"老农日记·其十三",x:"日记的最后一页夹着一片干枯的枫叶。又是一年深秋。树叶落了，庄稼收了。坐在田埂上，看着夕阳把农场染成金色。我想，这就是幸福吧。"},prestige_3:{t:"老农的遗嘱",x:"在农场地下深处挖到了一个密封的罐子，里面是老农的遗嘱：我将这片土地和我毕生的经验，托付给每一个愿意在这里挥洒汗水的人。请不要辜负它。"},hybrid_tomato_pepper:{t:"老农日记·其十四",x:"辣椒和番茄杂交出来的品种简直像地狱来的，又辣又甜。我决定叫它火焰番茄。吃一口能让你流汗，但第二口就停不下来。"}};function initGame(){GS.land=[];GS.maxLand=20+Math.floor(GS.prestigePoints/2);var allSoils=["normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark","normal","clay","sand","dark"];for(var i=0;i<GS.maxLand;i++)GS.land.push({id:i,unlocked:i<3,crop:null,soil:allSoils[i]||"normal"});GS.animals=[];GS.upgrades={};GS.processors={};GS.inventory={seeds:10};GS._planting=-1;if(!GS.relics)GS.relics=[];GS.merchantOffers=[];GS.merchantTimer=120;GS.eventCooldown=180;for(var k in PROC_DEFS)GS.processors[k]={owned:false,level:1,busy:false,timer:0};for(var k2 in UPG_DEFS)GS.upgrades[k2]=false;if(!GS.storyFragments)GS.storyFragments=[];if(!GS.achievements)GS.achievements={};if(!GS.discoveredHybrids)GS.discoveredHybrids=[];if(!GS.discoveredAnimals)GS.discoveredAnimals=[];if(!GS.prestigePoints&&GS.prestigePoints!==0)GS.prestigePoints=0;if(!GS.discoveredCrops||GS.discoveredCrops.length===0)GS.discoveredCrops=["wheat"];GS._seenEvents=[];GS._seenWeather=["sunny"];GS._seenSeasons=["spring"];plantCrop(0,"wheat");plantCrop(1,"wheat");plantCrop(2,"carrot");GS.inventory.seeds=Math.max(0,GS.inventory.seeds-Math.ceil(CROP_DEFS.wheat.v*0.25)-Math.ceil(CROP_DEFS.wheat.v*0.25)-Math.ceil(CROP_DEFS.carrot.v*0.25));}
function plantCrop(sid,cid){var s=GS.land[sid];if(!s||!s.unlocked||s.crop)return false;s.crop={id:cid,timer:0,gt:CROP_DEFS[cid].g,watered:true};if(GS.discoveredCrops.indexOf(cid)===-1){GS.discoveredCrops.push(cid);notify("🔓 解锁新作物："+CROP_DEFS[cid].n+"！");}return true;}
function saveGame(){GS.lastSave=Date.now();try{localStorage.setItem("farm_save",JSON.stringify(GS));}catch(e){}}
function loadGame(){var raw;try{raw=localStorage.getItem("farm_save");}catch(e){raw=null;}if(!raw){initGame();return false;}try{var d=JSON.parse(raw);if(!d||typeof d!=="object"||typeof d.coins!=="number"){initGame();return false;}Object.assign(GS,d);for(var pk in PROC_DEFS){if(!GS.processors[pk])GS.processors[pk]={owned:false,level:1,busy:false,timer:0};}if(!GS.relics)GS.relics=[];if(!GS._maxSingleHarvest)GS._maxSingleHarvest=0;if(!GS.discoveredHybrids)GS.discoveredHybrids=[];if(!GS.discoveredAnimals)GS.discoveredAnimals=[];if(!GS._seenEvents)GS._seenEvents=[];if(!GS._seenWeather)GS._seenWeather=["sunny"];if(!GS._seenSeasons)GS._seenSeasons=["spring"];return true;}catch(e){initGame();return false;}}
function resetGame(){if(confirm("确定要删除存档吗？")){try{localStorage.removeItem("farm_save");}catch(e){}location.reload();}}
function notify(msg){var c=document.getElementById("nf");if(!c)return;var e=document.createElement("div");e.className="nt";e.textContent=msg;c.appendChild(e);setTimeout(function(){e.style.opacity="0";e.style.transition="opacity .5s";setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e);},500);},4000);}
function tick(dt){dt=Math.min(dt,5);GS.seasonTimer+=dt;if(GS.seasonTimer>=GS.seasonDuration){GS.seasonTimer-=GS.seasonDuration;GS.season=(GS.season+1)%4;if(GS.season===0)GS.year++;notify(SICONS[GS.season]);if(GS._seenSeasons&&GS._seenSeasons.indexOf(SNAMES[GS.season])===-1){GS._seenSeasons.push(SNAMES[GS.season]);}checkStory("season_"+GS.year+"_"+GS.season);}GS.weatherTimer-=dt;if(GS.weatherTimer<=0){var r=Math.random();GS.weather=r<0.5?"sunny":r<0.8?"cloudy":r<0.95?"rainy":"storm";if(GS._seenWeather&&GS._seenWeather.indexOf(GS.weather)===-1){GS._seenWeather.push(GS.weather);notify("🔓 发现新天气："+GS.weather);}GS.weatherTimer=120+Math.random()*240;}var gh=GS.upgrades.greenhouse,fa=GS.upgrades.drone;var gm=1;for(var k in UPG_DEFS){if(GS.upgrades[k]&&UPG_DEFS[k].ef==="grow")gm+=UPG_DEFS[k].v;}if(GS.weather==="rainy")gm+=0.3;if(GS.weather==="sunny")gm+=0.1;if(GS.relics)for(var ri=0;ri<GS.relics.length;ri++){var rd=RELIC_DEFS[GS.relics[ri]];if(rd&&rd.ef==="grow")gm+=rd.v;}var sb={wheat:"spring",corn:"summer",pumpkin:"autumn",potato:"winter"};for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(!s.crop||!s.unlocked)continue;var cd=CROP_DEFS[s.crop.id];if(!cd)continue;var so=!sb[s.crop.id]||sb[s.crop.id]===SNAMES[GS.season];var m=gh?gm:(so?gm:gm*0.5);if(cd.soil&&cd.soil===s.soil)m*=1.5;s.crop.timer+=dt*m;if((GS.upgrades.autoHarvest||fa)&&s.crop.timer>=cd.g){var _cid2=s.crop.id;doHarvest(s);if(fa||GS.upgrades.scarecrow){if(GS.inventory.seeds>0){GS.inventory.seeds--;var cid2=_cid2;s.crop={id:cid2,timer:0,gt:CROP_DEFS[cid2].g,watered:true};}}}}if((GS.upgrades.scarecrow||GS.upgrades.drone)&&GS.scarecrowOn!==false){for(var _si=0;_si<GS.land.length;_si++){var _s=GS.land[_si];if(_s.unlocked&&!_s.crop&&_s.lastCrop&&(GS.inventory.seeds||0)>0){var _pick=_s.lastCrop;if(GS.discoveredCrops.indexOf(_pick)!==-1){var _cd2=CROP_DEFS[_pick];var _sc2=Math.ceil(_cd2.v*0.25);if((GS.inventory.seeds||0)>=_sc2){plantCrop(_si,_pick);GS.inventory.seeds-=_sc2;}}}}}for(var j=0;j<GS.animals.length;j++){var a=GS.animals[j];a.pt+=dt;if(a.pt>=a.pi){a.pt-=a.pi;a.pr=true;}if(a.af<a.am){a.af+=dt*0.05;if(a.af>=a.am&&GS.animals.length<GS.maxAnimals&&Math.random()<0.15){var nk=Object.keys(ANIMAL_DEFS);var nid=nk[Math.floor(Math.random()*nk.length)];var nd=ANIMAL_DEFS[nid];if(GS.totalCoinsEarned>=nd.unlock){GS.animals.push({id:nid,n:nd.n,i:nd.i,af:0,am:nd.am,pt:0,pi:nd.p.t,pr:false});if(GS.discoveredAnimals.indexOf(nid)===-1)GS.discoveredAnimals.push(nid);GS.totalAnimalsRaised++;notify(nd.i+" "+nd.n+"被你的动物的好感吸引来了！");}}}}for(var pk in GS.processors){var pr=GS.processors[pk];if(!pr.busy)continue;pr.timer-=dt;if(pr.timer<=0){pr.busy=false;pr.timer=0;var d=PROC_DEFS[pk];if(!GS.inventory[d.out.k])GS.inventory[d.out.k]=0;GS.inventory[d.out.k]+=pr.level;notify(d.n+" 生产了 "+pr.level+" 个"+d.out.n);}}GS.eventCooldown-=dt;if(GS.eventCooldown<=0){randEvent();GS.eventCooldown=180+Math.random()*300;}GS.merchantTimer-=dt;if(GS.merchantTimer<=0&&GS.coins>=5000){genMerchant();var mf=1;if(GS.relics)for(var ri2=0;ri2<GS.relics.length;ri2++){var rd2=RELIC_DEFS[GS.relics[ri2]];if(rd2&&rd2.ef==="merchantFreq")mf-=rd2.v;}GS.merchantTimer=(240+Math.random()*360)*Math.max(0.3,mf);}checkAch();}
function doHarvest(s){if(!s.crop)return;var cd=CROP_DEFS[s.crop.id];if(!cd||s.crop.timer<cd.g)return;var idx=GS.land.indexOf(s);for(var hk in HYBRID_DEFS){var hd=HYBRID_DEFS[hk];if(GS.coins>=hd.unlock&&GS.discoveredHybrids.indexOf(hk)===-1){var adjList=[idx-1,idx+1,idx-3,idx+3];for(var ai=0;ai<adjList.length;ai++){var adj=adjList[ai];if(adj>=0&&adj<GS.land.length&&GS.land[adj].crop){var ac=GS.land[adj].crop.id;if(hd.p.indexOf(s.crop.id)!==-1&&hd.p.indexOf(ac)!==-1&&s.crop.id!==ac){var hcf=1;if(GS.relics)for(var ri6=0;ri6<GS.relics.length;ri6++){var rd6=RELIC_DEFS[GS.relics[ri6]];if(rd6&&rd6.ef==="hybridChance")hcf*=rd6.v;}if(Math.random()*hcf<hd.ch){GS.discoveredHybrids.push(hk);var b=hd.v*3;GS.coins+=b;GS.totalCoinsEarned+=b;notify("杂交成功！"+hd.n+"！+"+b+"💰");checkStory("hybrid_"+hk);}}}}}}var v=cd.v*(1+GS.prestigePoints*0.1);var resQty=2;if(GS.relics)for(var ri3=0;ri3<GS.relics.length;ri3++){var rd3=RELIC_DEFS[GS.relics[ri3]];if(rd3&&rd3.ef==="cropValue")v*=(1+rd3.v);if(rd3&&rd3.ef==="harvestBonus")v*=(1+rd3.v);}GS.totalCropsHarvested++;if(!GS.inventory[s.crop.id])GS.inventory[s.crop.id]=0;GS.inventory[s.crop.id]+=2;if(Math.random()<0.3)GS.inventory.seeds=(GS.inventory.seeds||0)+1;s.crop=null;if(Math.random()<0.005*(1+GS.prestigePoints*0.1)){var rk=Object.keys(RELIC_DEFS);var rid=rk[Math.floor(Math.random()*rk.length)];if(GS.relics.indexOf(rid)===-1){GS.relics.push(rid);notify("🏺 发现遗迹："+RELIC_DEFS[rid].n+"！"+RELIC_DEFS[rid].d);checkStory("relic_"+rid);}}}
function harvestSlot(i){doHarvest(GS.land[i]);renderFarm();R();}
function collAnimal(idx){var a=GS.animals[idx];if(!a||!a.pr)return;var d=ANIMAL_DEFS[a.id];var m=a.af>=a.am?2:1;a.pr=false;a.pt=0;var pk2=d.p.k||d.id;if(!GS.inventory[pk2])GS.inventory[pk2]=0;GS.inventory[pk2]++;notify("收获"+d.p.i+d.p.n+" x1");}
function buySeeds(){buySeedsN(5);}
function buySeedsN(n){var cost=n*4;if(GS.coins<cost){notify("金币不足！需要"+cost+"💰");return;}GS.coins-=cost;GS.inventory.seeds=(GS.inventory.seeds||0)+n;notify("买了"+n+"颗种子");renderFarm();R();}
function unlockLand(i){var s=GS.land[i];if(!s||s.unlocked)return;var c=i<3?0:i<6?(i-2)*300:i<10?1200+(i-6)*600:i<15?3600+(i-10)*1000:i<20?8600+(i-15)*2000:18600+(i-20)*5000;if(GS.coins<c){notify("需要"+c+"💰解锁");return;}GS.coins-=c;s.unlocked=true;notify("解锁新土地！土壤："+s.soil);checkStory("land_"+i);}
function buyUpgrade(k){if(GS.upgrades[k])return;var d=UPG_DEFS[k];if(GS.totalCoinsEarned<d.unlock){notify("尚未解锁此升级");return;}if(GS.coins<d.c){notify("金币不足！");return;}GS.coins-=d.c;GS.upgrades[k]=true;notify("获得："+d.n);checkStory("upgrade_"+k);}
function buyAnimal(k){if(GS.animals.length>=GS.maxAnimals){notify("畜棚已满！");return;}var d=ANIMAL_DEFS[k];if(GS.totalCoinsEarned<d.unlock){notify("尚未解锁此动物");return;}if(GS.coins<d.c){notify("金币不足！");return;}GS.coins-=d.c;GS.animals.push({id:k,n:d.n,i:d.i,af:0,am:d.am,pt:0,pi:d.p.t,pr:false});if(GS.discoveredAnimals.indexOf(k)===-1)GS.discoveredAnimals.push(k);GS.totalAnimalsRaised++;notify("购买了"+d.n);checkStory("animal_"+k);}
function buyProc(k){var pr=GS.processors[k];if(!pr)return;var d=PROC_DEFS[k];if(GS.totalCoinsEarned<d.unlock){notify("尚未解锁");return;}if(!pr.owned){if(GS.coins<d.c){notify("金币不足！");return;}GS.coins-=d.c;pr.owned=true;notify("建造了"+d.n);}else{var uc=d.c*pr.level*2;if(GS.coins<uc){notify("金币不足！");return;}GS.coins-=uc;pr.level++;notify(d.n+" Lv."+pr.level);}checkStory("processor_"+k);}
function startProc(k){var pr=GS.processors[k];if(!pr||!pr.owned||pr.busy)return;var d=PROC_DEFS[k];if(!GS.inventory[d.inp.k]||GS.inventory[d.inp.k]<=0){notify(d.inp.n+"不足！");return;}GS.inventory[d.inp.k]--;pr.busy=true;var psf=0;if(GS.relics)for(var ri5=0;ri5<GS.relics.length;ri5++){var rd5=RELIC_DEFS[GS.relics[ri5]];if(rd5&&rd5.ef==="processSpeed")psf+=rd5.v;}pr.timer=d.t*(1-Math.min(0.9,psf));notify(d.n+"开始加工");}
function showPlants(sid){GS._planting=sid;var av=[];for(var k in CROP_DEFS){if(GS.discoveredCrops.indexOf(k)!==-1||CROP_DEFS[k].unlock<=GS.totalCoinsEarned)av.push(k);}var h='<div class="cd"><h3>选择种植</h3><div class="cg" style="grid-template-columns:repeat(5,1fr)">';for(var i=0;i<av.length;i++){var cid=av[i];var cd=CROP_DEFS[cid];var sf=0;if(GS.relics)for(var ri4=0;ri4<GS.relics.length;ri4++){var rd4=RELIC_DEFS[GS.relics[ri4]];if(rd4&&rd4.ef==="seedDiscount")sf+=rd4.v;}var sc=Math.ceil(cd.v*0.25*(1-Math.min(0.9,sf)));h+='<div class="sl" data-action="doPlant" data-sid="'+sid+'" data-cid="'+cid+'"><div style="font-size:2em">'+(cd.i||'🌱')+'</div><div>'+cd.n+'</div><div class="tt">生长:'+cd.g+'s | 产出:2个</div><div class="tt">需要种子:'+sc+'</div></div>';}h+='<button class="bt sm rd" data-action="cancelPlant" style="margin-top:8px">✕ 取消</button></div></div>';var pf=document.getElementById("pf");if(pf)pf.innerHTML=h;}
function doPlant(sid,cid){var cd=CROP_DEFS[cid];var sf=0;if(GS.relics)for(var ri4=0;ri4<GS.relics.length;ri4++){var rd4=RELIC_DEFS[GS.relics[ri4]];if(rd4&&rd4.ef==="seedDiscount")sf+=rd4.v;}var sc=Math.ceil(cd.v*0.25*(1-Math.min(0.9,sf)));if((GS.inventory.seeds||0)<sc){notify("种子不足！");return;}if(!plantCrop(sid,cid)){notify("无法在此种植！");return;}GS.inventory.seeds-=sc;GS._planting=-1;notify("种植了"+cd.n);renderFarm();R();}
function acceptOffer(idx){var o=GS.merchantOffers[idx];if(!o)return;if(o.t==="buy"){if(!GS.inventory[o.k]||GS.inventory[o.k]<o.q){notify("物品不足！");return;}GS.inventory[o.k]-=o.q;GS.coins+=o.p;GS.totalCoinsEarned+=o.p;notify("交易成功！+"+o.p+"💰");}else{if(GS.coins<o.p){notify("金币不足！");return;}GS.coins-=o.p;if(!GS.inventory[o.k])GS.inventory[o.k]=0;GS.inventory[o.k]+=o.q;notify("购买了"+o.q+"个"+o.n);}GS.merchantOffers.splice(idx,1);renderTrade();R();}
function randEvent(){var evs=[{n:"天降甘霖",d:"雨水滋润了土地！",ef:function(){GS.weatherTimer=60;GS.weather="rainy";}},{n:"兔子来袭",d:"兔子偷吃了一些作物，但留下了兔毛可卖钱。",ef:function(){GS.coins+=Math.floor(Math.random()*200)+50;for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop&&Math.random()<0.15)s.crop.timer=Math.max(0,s.crop.timer-30);}}},{n:"双倍市价日",d:"市场行情大涨！60秒内收获价值翻倍。",ef:function(){window._doubleValue=true;window._doubleValueEnd=Date.now()+60000;setTimeout(function(){window._doubleValue=false;window._doubleValueEnd=0;},60000);}},{n:"神秘商人",d:"一位神秘商人高价收购你的产品！",ef:function(){var b=Math.floor(Math.random()*1000)+300;GS.coins+=b;GS.totalCoinsEarned+=b;notify("神秘商人给了你 "+b+"💰");}},{n:"发现种子袋",d:"在田地边缘发现了被遗忘的种子！",ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+8;notify("获得 8 颗种子！");}},{n:"友善的邻居",d:"邻居老张送来了他培育的新品种！",ef:function(){var lk=[];for(var k in CROP_DEFS){if(GS.discoveredCrops.indexOf(k)===-1&&CROP_DEFS[k].unlock<=GS.totalCoinsEarned+5000)lk.push(k);}if(lk.length>0){var cid=lk[Math.floor(Math.random()*lk.length)];GS.discoveredCrops.push(cid);notify("解锁了新品种："+CROP_DEFS[cid].n+"！");}}},{n:"害虫入侵",d:"害虫破坏庄稼，部分作物生长倒退。",ef:function(){for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop&&Math.random()<0.3)s.crop.timer=Math.max(0,s.crop.timer-60);}}},{n:"丰收庆典",d:"镇上举办丰收庆典，获得金币奖励！",ef:function(){var b=Math.floor(Math.random()*500)+500;GS.coins+=b;GS.totalCoinsEarned+=b;notify("庆典奖励："+b+"💰！");}},{n:"大地赐福",d:"土地异常肥沃，所有作物瞬间成熟！",ef:function(){for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop)s.crop.timer=s.crop.gt;}}},{n:"流浪猫到访",d:"一只橘猫在农场安了家。它不干活，但让你的心情变好了。",ef:function(){GS.gems=(GS.gems||0)+1;notify("获得1颗宝石💎（猫猫带来的好运）");}},{n:"土地塌陷",d:"一块地下陷，露出了一些奇怪的古物。",ef:function(){var b=Math.floor(Math.random()*800)+400;GS.coins+=b;GS.totalCoinsEarned+=b;notify("古物卖了 "+b+"💰！");}},{n:"鸟群来袭",d:"一群鸟偷吃种子！",ef:function(){GS.inventory.seeds=Math.max(0,(GS.inventory.seeds||0)-Math.floor(Math.random()*5+1));notify("损失了一些种子...");}},{n:"天气预报错误",d:"原本预报的天气突然反转！",ef:function(){var wr=["sunny","cloudy","rainy","storm"];GS.weather=wr[Math.floor(Math.random()*wr.length)];GS.weatherTimer=90+Math.random()*120;notify("天气突变："+GS.weather+"！");}},{n:"旅行商人停留",d:"一个疲惫的商人借宿一晚，留下了一些稀有货物。",ef:function(){genMerchant();notify("商人留下了一批货物！");}},{n:"地下温泉",d:"地质勘探队在农场地下发现温泉，土壤变得异常肥沃。",ef:function(){GS.weatherTimer=30;GS.weather="rainy";for(var i=0;i<GS.land.length;i++){var s2=GS.land[i];if(s2.crop)s2.crop.timer*=1.8;}}},{n:"植物突变",d:"一株作物发生了奇怪的变化，价值暴增！",ef:function(){for(var i=0;i<GS.land.length;i++){var s3=GS.land[i];if(s3.crop&&Math.random()<0.2){var b2=CROP_DEFS[s3.crop.id].v*8;GS.coins+=b2;GS.totalCoinsEarned+=b2;notify("突变作物价值 "+b2+"💰！");s3.crop=null;break;}}}},{n:"农具促销",d:"镇上五金店大甩卖，升级费用打折！",ef:function(){var b3=Math.floor(Math.random()*300)+200;GS.coins+=b3;GS.totalCoinsEarned+=b3;notify("省下了 "+b3+"💰！");}},{n:"金色传说",d:"一道金光从田中出现——一株作物镀上了金色！",ef:function(){for(var i=0;i<GS.land.length;i++){var s4=GS.land[i];if(s4.crop&&Math.random()<0.15){s4.crop.timer=s4.crop.gt;break;}}notify("金色作物瞬间成熟！");}},{n:"丰收女神的祝福",d:"丰收女神路过此地，被你的勤劳打动。",ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+15;var b4=Math.floor(Math.random()*2000)+1000;GS.coins+=b4;GS.totalCoinsEarned+=b4;notify("丰收女神赐予 "+b4+"💰 和 15 颗种子！");}},{n:"虫害预警",d:"农业局发来虫害预警，但你的杀虫剂刚好够用。",ef:function(){if(Math.random()<0.5){notify("成功抵御虫害！");}else{for(var i=0;i<GS.land.length;i++){var s5=GS.land[i];if(s5.crop&&Math.random()<0.25)s5.crop.timer=Math.max(0,s5.crop.timer-50);}notify("虫害造成部分损失...");}}}];var ev=evs[Math.floor(Math.random()*evs.length)];notify("📢 "+ev.n+"："+ev.d);if(GS._seenEvents&&GS._seenEvents.indexOf(ev.n)===-1){GS._seenEvents.push(ev.n);notify("🔓 发现新事件："+ev.n);}ev.ef();}function genMerchant(){if(GS.merchantOffers.length>6)GS.merchantOffers=[];var items=[{t:"sell",k:"seeds",n:"种子",q:10,p:80},{t:"sell",k:"flour",n:"面粉",q:3,p:80},{t:"sell",k:"bread",n:"面包",q:2,p:150}];for(var i=0;i<3;i++){var it=items[Math.floor(Math.random()*items.length)];GS.merchantOffers.push({t:it.t,k:it.k,n:it.n,q:it.q,p:it.p+Math.floor(Math.random()*50)});}if(GS.inventory.flour&&GS.inventory.flour>2)GS.merchantOffers.push({t:"buy",k:"flour",n:"面粉",q:2,p:150});if(GS.inventory.bread&&GS.inventory.bread>1)GS.merchantOffers.push({t:"buy",k:"bread",n:"面包",q:1,p:200});if(GS.merchantOffers.length>0)notify("🏪 商人来了！查看贸易面板。");}
function checkAch(){for(var i=0;i<ACH_DEFS.length;i++){var a=ACH_DEFS[i];if(!GS.achievements[a.id]&&a.ch()){GS.achievements[a.id]=Date.now();GS.gems+=a.t*2;notify("🏆 成就解锁："+a.n+"！+"+a.t*2+"💎");}}}
function checkStory(k){if(STORIES[k]&&GS.storyFragments.indexOf(k)===-1){GS.storyFragments.push(k);notify("📜 发现故事碎片："+STORIES[k].t);}}
function doPrestige(){var pts=Math.floor(Math.sqrt(Math.max(0,GS.totalCoinsEarned)/10000));if(pts<1){notify("需要累计至少获得 10000 金币才能转生！");return;}if(!confirm("转生将重置所有进度，获得 "+pts+" 个农场之心。\n每个农场之心永久 +10% 金币收入。\n图鉴、杂交品种、成就和故事碎片会保留。\n\n确定转生吗？"))return;GS.prestigePoints+=pts;var dc=GS.discoveredCrops.slice(),dh=GS.discoveredHybrids.slice(),da=GS.discoveredAnimals.slice();var ss=GS.storyFragments.slice(),sa=Object.assign({},GS.achievements);GS.coins=0;GS.gems=0;GS.totalCoinsEarned=0;GS.totalCropsHarvested=0;GS.totalAnimalsRaised=0;GS.year=1;GS.season=0;GS.seasonTimer=0;GS.weather="sunny";GS.weatherTimer=120;GS.maxAnimals=4+Math.floor(GS.prestigePoints/2);GS.upgrades={};GS.processors={};GS.inventory={seeds:10};GS._planting=-1;if(!GS.relics)GS.relics=[];GS.merchantOffers=[];GS.merchantTimer=120;GS.eventCooldown=180;GS.discoveredCrops=dc;GS.discoveredHybrids=dh;GS.discoveredAnimals=da;GS.storyFragments=ss;GS.achievements=sa;var savedRelics=GS.relics?GS.relics.slice():[];initGame();GS.relics=savedRelics;notify("🔄 转生成功！获得 "+pts+" 个农场之心！（总计："+GS.prestigePoints+"）");checkStory("prestige_"+GS.prestigePoints);saveGame();renderAll();}
function R(){var rc=document.getElementById("rc");if(rc)rc.textContent=Math.floor(GS.coins).toLocaleString();var rg=document.getElementById("rg");if(rg)rg.textContent=GS.gems;var rs=document.getElementById("rs");if(rs)rs.textContent=GS.inventory.seeds||0;var rh=document.getElementById("rh");if(rh)rh.textContent=GS.prestigePoints;var sn=document.getElementById("sn");if(sn){sn.textContent=SICONS[GS.season]+" · 第"+GS.year+"年";var sp=document.getElementById("seasonProgress");if(sp){sp.style.width=Math.floor(GS.seasonTimer/GS.seasonDuration*100)+"%";}}var wi={sunny:"☀️ 晴天",cloudy:"⛅ 多云",rainy:"🌧️ 雨天",storm:"⛈️ 暴风雨"};var wt=document.getElementById("wt");if(wt)wt.textContent=wi[GS.weather]||GS.weather;}
function renderFarm(){var soilName=function(s){return s==="clay"?"粘土地":s==="sand"?"沙地":s==="dark"?"黑土地":"普通土地";};if(GS._planting>=0)return;var h='<div class="cd"><h3>🌾 农田</h3><button class="bt sm gn" data-action="buySeeds" data-n="100" style="font-size:.7em">🌱+1 (4💰)</button> <button class="bt sm gn" data-action="buySeeds" data-n="5" style="font-size:.7em">🌱+5 (20💰)</button> <button class="bt sm gn" data-action="buySeeds" data-n="20" style="font-size:.7em">🌱+20 (80💰)</button> <button class="bt sm gn" data-action="buySeeds" data-n="100" style="font-size:.7em">🌱+100 (400💰)</button> <button class="bt sm gn" data-action="buySeeds" data-n="500" style="font-size:.7em">🌱+500 (2000💰)</button><div class="cg" style="grid-template-columns:repeat(5,1fr)">';for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(!s.unlocked){var c=i<3?0:i<6?(i-2)*300:i<10?1200+(i-6)*600:i<15?3600+(i-10)*1000:i<20?8600+(i-15)*2000:18600+(i-20)*5000;h+='<div class="sl lk" data-action="unlock" data-sid="'+i+'"><div>🔒</div><div>锁定</div><div class="tt">解锁:'+c+'💰</div><div class="tt">土壤:'+soilName(s.soil)+'</div></div>';}else if(s.crop){var cd=CROP_DEFS[s.crop.id];var p=Math.min(1,s.crop.timer/cd.g);var rd=p>=1;h+='<div class="sl'+(rd?' rd':'')+'" data-action="'+(rd?'harvest':'growing')+'" data-sid="'+i+'"><div style="font-size:2em">'+(cd.i||'🌱')+'</div><div>'+cd.n+'</div><div class="pb"><div class="pf" style="width:'+(p*100)+'%"></div></div><div class="tt">'+(rd?'✅ 可收获！':Math.floor(cd.g-s.crop.timer)+'s')+'</div><div class="tt">土壤:'+soilName(s.soil)+' | 产出:2个</div></div>';}else{h+='<div class="sl" data-action="plant" data-sid="'+i+'"><div style="font-size:2em">🟫</div><div>空地</div><div class="tt">点击种植</div><div class="tt">土壤:'+soilName(s.soil)+'</div></div>';}}h+='</div></div>';var pf=document.getElementById("pf");if(pf)pf.innerHTML=h;}function renderAnimals(){var h='<div class="cd"><h3>🐄 畜棚</h3><div class="tt">容量：'+GS.animals.length+'/'+GS.maxAnimals+'</div><div class="cg">';for(var k in ANIMAL_DEFS){var d=ANIMAL_DEFS[k];var ow=0;for(var i=0;i<GS.animals.length;i++){if(GS.animals[i].id===k)ow++;}var ul=GS.totalCoinsEarned>=d.unlock||GS.discoveredAnimals.indexOf(k)!==-1;h+='<div class="sl'+(ul?'':' lk')+'"><div style="font-size:2em">'+d.i+'</div><div>'+d.n+'</div><div class="tt">产物:'+d.p.i+d.p.n+'</div><div class="tt">拥有:'+ow+' | 价格:'+d.c+'💰</div>'+(ul?'<button class="bt sm bl" data-action="buyAnimal" data-aid="'+k+'">购买</button>':'')+'</div>';}h+='</div></div>';if(GS.animals.length>0){h+='<div class="cd"><h3>我的动物</h3><div class="cg">';for(var j=0;j<GS.animals.length;j++){var a=GS.animals[j];var ad=ANIMAL_DEFS[a.id];var ap=Math.floor(a.af/a.am*100);h+='<div class="sl'+(a.pr?' rd':'')+'" data-action="collectAnimal" data-aidx="'+j+'"><div style="font-size:2em">'+ad.i+'</div><div>'+ad.n+'</div><div class="pb"><div class="pf" style="width:'+(a.pr?100:Math.floor(a.pt/a.pi*100))+'%"></div></div><div class="tt">好感:'+(new Array(Math.ceil(ap/25)+1).join('❤️')||'🤍')+' '+ap+'%</div>'+(a.pr?'<div class="tt">✅ 可收取！</div>':'<div class="tt">'+Math.floor(a.pi-a.pt)+'s</div>')+'</div>';}h+='</div></div>';}var pa=document.getElementById("pa");if(pa)pa.innerHTML=h;}
function renderProc(){var h='<div class="cd"><h3>🏭 加工设施</h3><div class="cg">';for(var k in PROC_DEFS){var d=PROC_DEFS[k];var pr=GS.processors[k]||{owned:false,level:1,busy:false,timer:0};var ul=GS.totalCoinsEarned>=d.unlock;h+='<div class="sl'+(ul?'':' lk')+'"><div style="font-size:2em">'+d.i+'</div><div>'+d.n+' '+(pr.owned?'Lv.'+pr.level:'')+'</div><div class="tt">'+d.inp.n+' → '+d.out.i+d.out.n+'</div><div class="tt">价值提升:'+d.out.v+'💰</div>';if(ul){if(!pr.owned)h+='<button class="bt sm bl" data-action="buyProc" data-pid="'+k+'">建造 ('+d.c+'💰)</button>';else{h+='<button class="bt sm pu" data-action="buyProc" data-pid="'+k+'">升级 ('+(d.c*pr.level*2)+'💰)</button>';if(pr.busy)h+='<div class="pb" style="margin-top:4px"><div class="pf" style="width:'+(100-Math.floor(pr.timer/d.t*100))+'%"></div></div><div class="tt">加工中...'+Math.floor(pr.timer)+'s</div>';else h+='<button class="bt sm gn" data-action="startProc" data-pid="'+k+'">加工 ('+d.inp.n+'x1)</button>';}}h+='</div>';}h+='</div></div>';var pp=document.getElementById("pp");if(pp)pp.innerHTML=h;}
function renderUpgrades(){var h='<div class="cd"><h3>⬆ 科技升级</h3><div class="cg">';for(var k in UPG_DEFS){var d=UPG_DEFS[k];var ow=GS.upgrades[k];var ul=GS.totalCoinsEarned>=d.unlock;h+='<div class="sl'+(ow?' rd':'')+(!ul&&!ow?' lk':'')+'"><div style="font-size:2em">'+d.i+'</div><div>'+d.n+'</div><div class="tt">'+d.d+'</div>'+(ow?'<div style="color:#66bb6a">✅ 已拥有</div>':ul?'<button class="bt sm bl" data-action="buyUpgrade" data-uid="'+k+'">购买 ('+d.c+'💰)</button>':'<div class="tt">需累计 '+d.unlock+'💰</div>')+'</div>';}h+='</div></div>';var pu=document.getElementById("pu");if(pu)pu.innerHTML=h;}
function renderTrade(){var h='<div class="cd"><h3>🏪 贸易站</h3>';if(GS.merchantOffers.length===0)h+='<div class="tt">商人尚未到来... 请耐心等待，或积累更多金币。</div>';else{for(var i=0;i<GS.merchantOffers.length;i++){var o=GS.merchantOffers[i];h+='<div class="mr"><span>'+(o.t==="buy"?'🛒':'💰')+' '+o.n+' x'+o.q+'</span><span>'+o.p+'💰</span><button class="bt sm gn" data-action="acceptOffer" data-oidx="'+i+'">'+(o.t==="buy"?'出售':'购买')+'</button></div>';}}h+='</div>';var pt=document.getElementById("pt");if(pt)pt.innerHTML=h;}
function renderBestiary(){
var h='<div class="cd"><h3>📖 作物图鉴</h3><div class="cg">';
for(var k in CROP_DEFS){var d=CROP_DEFS[k];var dv=GS.discoveredCrops.indexOf(k)!==-1;
h+='<div class="sl'+(dv?'':' lk')+'"><div style="font-size:2em">'+(dv?d.i:'❓')+'</div><div>'+(dv?d.n:'???')+'</div>'+(dv?'<div class="tt">生长:'+d.g+'s | 产出:2个</div>':'')+'</div>';}
h+='</div></div>';
if(GS.discoveredHybrids.length>0){h+='<div class="cd"><h3>🧬 杂交品种</h3><div class="cg">';
for(var hi=0;hi<GS.discoveredHybrids.length;hi++){var hk=GS.discoveredHybrids[hi];var hd=HYBRID_DEFS[hk];
h+='<div class="sl rd"><div style="font-size:2em">'+hd.i+'</div><div>'+hd.n+'</div><div class="tt">价值:'+hd.v+'💰</div><div class="tt">亲本:'+CROP_DEFS[hd.p[0]].n+'+'+CROP_DEFS[hd.p[1]].n+'</div></div>';}
h+='</div></div>';}
h+='<div class="cd"><h3>🐾 动物图鉴</h3><div class="cg">';
for(var ak in ANIMAL_DEFS){var ad=ANIMAL_DEFS[ak];var dv2=GS.discoveredAnimals.indexOf(ak)!==-1;
h+='<div class="sl'+(dv2?'':' lk')+'"><div style="font-size:2em">'+(dv2?ad.i:'❓')+'</div><div>'+(dv2?ad.n:'???')+'</div>'+(dv2?'<div class="tt">产出:'+ad.p.n+' x1</div>':'')+'</div>';}
h+='</div></div>';
h+='<div class="cd"><h3>📢 事件图鉴</h3><div class="cg">';
var allEv=[{n:"天降甘霒",d:"雨水滋润土地",i:"🌧"},{n:"兔子来袭",d:"兔子偷吃留下兔毛",i:"🐰"},{n:"双倍市价日",d:"60秒价值翻倍",i:"📈"},{n:"神秘商人",d:"高价收购产品",i:"🤵"},{n:"发现种子袋",d:"获得额外种子",i:"🌱"},{n:"友善的邻居",d:"送来新品种",i:"🤝"},{n:"害虫入侵",d:"作物生长倒退",i:"🐛"},{n:"丰收庆典",d:"获得金币奖励",i:"🎉"},{n:"大地赐福",d:"所有作物瞬间成熟",i:"🌍"},{n:"流浪猫到访",d:"动物好感度+20%",i:"🐱"},{n:"土地塌陷",d:"发现随机遗物",i:"🕳"},{n:"鸟群来袭",d:"损失种子",i:"🐦"},{n:"天气预报错误",d:"天气随机反转",i:"🔀"},{n:"旅行商人停留",d:"获得稀有货物",i:"🚶"},{n:"地下温泉",d:"120秒生长翻倍",i:"🌊"},{n:"植物突变",d:"随机作物价值暴增",i:"🔬"},{n:"农具促销",d:"升级费用减半",i:"🔨"},{n:"金色传说",d:"随机作物变金色",i:"🌟"},{n:"丰收女神的祝福",d:"升级费用-30%",i:"🌟"},{n:"虫害预警",d:"成功抵御虫害",i:"🚨"}];
for(var ei=0;ei<allEv.length;ei++){var e=allEv[ei];var se=GS._seenEvents&&GS._seenEvents.indexOf(e.n)!==-1;
h+='<div class="sl'+(se?'':' lk')+'"><div style="font-size:2em">'+(se?e.i:'❓')+'</div><div>'+(se?e.n:'???')+'</div>'+(se?'<div class="tt">'+e.d+'</div>':'')+'</div>';}
h+='</div></div>';
h+='<div class="cd"><h3>☀️ 天气图鉴</h3><div class="cg">';
var allW=[{k:"sunny",n:"晴天",i:"☀️",d:"生长加速+10%"},{k:"cloudy",n:"多云",i:"☁️",d:"无加成"},{k:"rainy",n:"雨天",i:"🌧️",d:"生长加速+30%，免浇水"},{k:"storm",n:"暴风雨",i:"⛈️",d:"无加成"}];
for(var wi=0;wi<allW.length;wi++){var w=allW[wi];var ws=GS._seenWeather&&GS._seenWeather.indexOf(w.k)!==-1;
h+='<div class="sl'+(ws?'':' lk')+'"><div style="font-size:2em">'+(ws?w.i:'❓')+'</div><div>'+(ws?w.n:'???')+'</div>'+(ws?'<div class="tt">'+w.d+'</div>':'')+'</div>';}
h+='</div></div>';
h+='<div class="cd"><h3>🍁 季节图鉴</h3><div class="cg">';
var allS=[{k:"spring",n:"🌸 春季",i:"🌸",d:"适配:小麦"},{k:"summer",n:"☀️ 夏季",i:"☀️",d:"适配:玉米"},{k:"autumn",n:"🍂 秋季",i:"🍂",d:"适配:南瓜"},{k:"winter",n:"❄️ 冬季",i:"❄️",d:"适配:土豆"}];
for(var si=0;si<allS.length;si++){var se=allS[si];var ss=GS._seenSeasons&&GS._seenSeasons.indexOf(se.k)!==-1;
h+='<div class="sl'+(ss?'':' lk')+'"><div style="font-size:2em">'+(ss?se.i:'❓')+'</div><div>'+(ss?se.n:'???')+'</div>'+(ss?'<div class="tt">'+se.d+'</div>':'')+'</div>';}
h+='</div></div>';
var pb=document.getElementById("pb");if(pb)pb.innerHTML=h;
}function renderAch(){var h='<div class="cd"><h3>🏆 成就</h3>';for(var i=0;i<ACH_DEFS.length;i++){var a=ACH_DEFS[i];var ul=GS.achievements[a.id];h+='<div class="ar'+(ul?' un':' lk')+'"><span>'+new Array(a.t+1).join('⭐')+'</span><div><div>'+(ul?'✅ ':'')+a.n+'</div><div class="tt">'+a.d+'</div></div></div>';}h+='</div>';var pach=document.getElementById("pach");if(pach)pach.innerHTML=h;}
function renderJournal(){var h='<div class="cd"><h3>📜 老农日记</h3>';if(GS.storyFragments.length===0)h+='<div class="tt">还没有发现任何故事碎片。继续探索农场，在扩张土地、解锁新功能时可能会发现它们。</div>';else{for(var i=0;i<GS.storyFragments.length;i++){var k=GS.storyFragments[i];var f=STORIES[k];if(f)h+='<div class="sf"><strong>'+f.t+'</strong><p>'+f.x+'</p></div>';}}h+='</div>';var pj=document.getElementById("pj");if(pj)pj.innerHTML=h;}
function renderPrestige(){var pts=Math.floor(Math.sqrt(Math.max(0,GS.totalCoinsEarned)/10000));var h='<div class="cd"><h3>🔄 转生系统</h3>';h+='<p>累计获得 <strong>'+Math.floor(GS.totalCoinsEarned).toLocaleString()+'</strong> 金币</p>';h+='<p>转生后可获得 <strong>'+pts+'</strong> 个农场之心</p>';h+='<p>当前农场之心：<strong>'+GS.prestigePoints+'</strong>（金币收入 +'+GS.prestigePoints*10+'%）</p>';h+='<p class="tt">转生将重置所有进度，但保留：图鉴、杂交品种、成就、故事碎片</p>';h+='<p class="tt">转生后解锁更多土地和畜棚容量</p>';h+='<button class="bt" data-action="doPrestige"'+(pts<1?' disabled':'')+'>🔄 转生获得 '+pts+' 个农场之心</button>';h+='</div>';var ppr=document.getElementById("ppr");if(ppr)ppr.innerHTML=h;}
function renderTutorial(){
var h='<div class="cd"><h3>📖 新手指南</h3>';
h+='<div class="sf"><strong>欢迎来到农场增量！</strong><p>这是一款放置增量游戏。即使关闭页面，进度也会保留。</p></div>';
h+='<div class="cd"><h3>🌾 基础循环</h3>';
h+='<p>1. <strong>种植</strong>：点击空地选择作物，消耗种子</p>';
h+='<p>2. <strong>生长</strong>：作物自动生长，进度条满后点击收获</p>';
h+='<p>3. <strong>收获</strong>：获得 <b>2个</b> 对应作物资源</p>';
h+='<p>4. <strong>出售</strong>：在「📦 库存」标签页卖出资源换取金币</p>';
h+='<p>5. <strong>扩张</strong>：用金币解锁更多土地、动物、加工设施</p></div>';
h+='<div class="cd"><h3>📦 经济循环</h3>';
h+='<p>★ 收获作物 → 获得资源 → 卖出资源 → 获得金币 → 买种子/升级</p>';
h+='<p class="tt">每次收获产出2个作物，有30%概率返还1颗种子。动物每次产出1个产品。</p></div>';
h+='<div class="cd"><h3>🐾 动物</h3><p>在畜棚面板购买动物。好感度满后产出翻倍。点击动物收取产品。</p></div>';
h+='<div class="cd"><h3>🏭 加工链</h3><p>小麦 → 磨坊 → 面粉 → 面包房 → 面包。每个环节提升价值。</p></div>';
h+='<div class="cd"><h3>🤖 升级</h3><p>稻草人 → 灌溉 → 肥料 → 温室 → 自动收割机 → 无人机群。逐步实现全自动。</p></div>';
h+='<div class="cd"><h3>🧬 杂交</h3><p>不同作物种在<strong>相邻位置</strong>，收获时概率发现新品种。</p></div>';
h+='<div class="cd"><h3>☀️ 季节</h3><p>每30分钟切换季节，影响作物生长。温室无视季节。</p></div>';
h+='<div class="cd"><h3>🔄 转生</h3><p>累计足够金币后转生获得农场之心，永久+金币收入。</p></div>';
h+='<div class="cd"><h3>📌 小贴士</h3>';
h+='<p>· 注意土壤类型！匹配土壤生长+50%。</p>';
h+='<p>· 加工品可卖给商人。随机事件带来惊喜。</p>';
h+='<p>· 图鉴和成就记录探索进度。每30秒自动保存。</p>';
h+='<p>· 在「⚙️ 系统」可导入/导出存档、切换主题。</p></div></div>';
var ptut=document.getElementById("ptut");if(ptut)ptut.innerHTML=h;
}function renderRelics(){var h='<div class="cd"><h3>🏺 远古遗迹</h3><p class="tt">收获时有概率发现远古遗物，提供永久加成</p>';if(!GS.relics||GS.relics.length===0){h+='<div class="sf">尚未发现任何遗迹。继续收获，或许某天会挖到什么...</div>';}else{h+='<div class="cg">';for(var i=0;i<GS.relics.length;i++){var rd=RELIC_DEFS[GS.relics[i]];h+='<div class="sl"><div style="font-size:2em">'+(rd.i||'🏺')+'</div><div>'+rd.n+'</div><div class="tt">'+rd.d+'</div></div>';}h+='</div>';var missing=Object.keys(RELIC_DEFS).length-GS.relics.length;h+='<div class="tt" style="text-align:center;margin-top:8px">已发现 '+GS.relics.length+'/'+Object.keys(RELIC_DEFS).length+' 个遗迹'+(missing>0?'，还有 '+missing+' 个等待发现':' ✅ 全部收集！')+'</div>';}h+='</div>';var pr=document.getElementById("pr");if(pr)pr.innerHTML=h;}
function renderInventory(){
var h='<div class="cd"><h3>📦 资源库存</h3><div class="cg">';
var invItems=[{k:'seeds',n:'种子',i:'🌱',v:4},{k:'wheat',n:'小麦',i:'🌾',v:10},{k:'carrot',n:'胡萝卜',i:'🥕',v:16},{k:'potato',n:'土豆',i:'🥔',v:25},{k:'corn',n:'玉米',i:'🌽',v:50},{k:'pumpkin',n:'南瓜',i:'🎃',v:100},{k:'strawberry',n:'草莓',i:'🍓',v:70},{k:'tomato',n:'番茄',i:'🍅',v:35},{k:'pepper',n:'辣椒',i:'🌶',v:40},{k:'egg',n:'鸡蛋',i:'🥚',v:15},{k:'milk',n:'牛奶',i:'🥛',v:40},{k:'wool',n:'羊毛',i:'🧶',v:60},{k:'truffle',n:'松露',i:'🍄',v:150},{k:'flour',n:'面粉',i:'🌾📦',v:20},{k:'bread',n:'面包',i:'🍞',v:60},{k:'cheese',n:'奶酪',i:'🧀',v:100},{k:'cloth',n:'布料',i:'👘',v:150},{k:'smoked_pumpkin',n:'烟熏南瓜',i:'🔥🎃',v:200},{k:'corn_wine',n:'玉米酒',i:'🍺🌽',v:180},{k:'strawberry_jam',n:'草莓果酱',i:'🍯🍓',v:220}];
var hasAny=false;
for(var ii=0;ii<invItems.length;ii++){
var it=invItems[ii];var qty=GS.inventory[it.k]||0;
if(qty>0)hasAny=true;
var sv=Math.floor(it.v*(1+GS.prestigePoints*0.1));
h+='<div class="sl'+(qty>0?'':' lk')+'" style="min-height:115px"><div style="font-size:2.2em">'+it.i+'</div><div style="font-weight:bold">'+it.n+'</div><div style="font-size:1.3em;color:#ffd700;margin:4px 0">x'+qty+'</div><div class="tt">单价:'+sv+'💰</div>';
if(qty>0){
h+='<div style="margin-top:5px">';
h+='<button class="bt sm gn" onclick="window._sellK=\x27'+it.k+'\x27;window._sellQ=1;sellItem(window._sellK,window._sellQ)" style="font-size:.65em;padding:2px 6px">卖1</button> ';
if(qty>=10)h+='<button class="bt sm gn" onclick="window._sellK=\x27'+it.k+'\x27;window._sellQ=10;sellItem(window._sellK,window._sellQ)" style="font-size:.65em;padding:2px 6px">卖10</button> ';
h+='<button class="bt sm rd" onclick="window._sellK=\x27'+it.k+'\x27;window._sellQ='+qty+';sellItem(window._sellK,window._sellQ)" style="font-size:.65em;padding:2px 6px">卖全部</button>';
h+='</div>';
}
h+='</div>';
}
if(!hasAny)h+='<div style="text-align:center;padding:20px;color:#999">📭 暂无库存，收获作物或动物产品后将显示在这里。</div>';
h+='</div></div>';
var pinv=document.getElementById("pinv");if(pinv)pinv.innerHTML=h;
}
function sellItem(k,q){
if(!GS.inventory[k]||GS.inventory[k]<q){notify("库存不足！");return;}
GS.inventory[k]-=q;
var sellPrice=0;
var items=[{k:'seeds',v:4},{k:'wheat',v:10},{k:'carrot',v:16},{k:'potato',v:25},{k:'corn',v:50},{k:'pumpkin',v:100},{k:'strawberry',v:70},{k:'tomato',v:35},{k:'pepper',v:40},{k:'egg',v:15},{k:'milk',v:40},{k:'wool',v:60},{k:'truffle',v:150},{k:'flour',v:20},{k:'bread',v:60},{k:'cheese',v:100},{k:'cloth',v:150},{k:'smoked_pumpkin',v:200},{k:'corn_wine',v:180},{k:'strawberry_jam',v:220}];
for(var i=0;i<items.length;i++){if(items[i].k===k){sellPrice=items[i].v;break;}}
var total=Math.floor(sellPrice*q*(1+GS.prestigePoints*0.1));
GS.coins+=total;GS.totalCoinsEarned+=total;
notify("出售 "+q+"x 获得 +"+total+"💰");
renderInventory();renderFarm();R();
}

function renderSystem(){
var h='<div class="cd"><h3>⚙️ 系统</h3>';
h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
h+='<button class="bt sm" onclick="manualSave()" id="btnSave">💾 保存进度</button>';
h+='<button class="bt sm bl" onclick="showLog()">📋 通知历史</button>';
h+='<button class="bt sm rd" onclick="resetGame()">🗑 删除存档</button>';
h+='</div>';
h+='<div class="cd"><h4>📤 导入/导出存档</h4>';
h+='<button class="bt sm" onclick="exportSave()" style="margin-right:8px">📋 复制存档到剪切板</button>';
h+='<button class="bt sm bl" onclick="importSavePrompt()">📥 从剪切板导入</button>';
h+='<textarea id="saveDataArea" style="width:100%;height:80px;margin-top:6px;font-size:.7em;background:rgba(0,0,0,.3);color:#ccc;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:6px;font-family:monospace" placeholder="粘贴存档数据到此处然后点击导入..."></textarea>';
h+='</div>';
h+='<div class="cd"><h4>🎨 主题设置</h4>';
h+='<p class="tt" style="margin:4px 0">当前: <span id="themeLabel">🌙 深色</span></p>';
h+='<button class="bt sm" onclick="toggleTheme()" id="btnTheme">☀️ 切换浅色模式</button>';
h+='</div>';
h+='<div class="tt sb">每30秒自动保存 | 刷新页面继续游戏</div>';
h+='</div>';
var psys=document.getElementById("psys");if(psys){var ta=document.getElementById("saveDataArea");var wasFocused=ta&&document.activeElement===ta;var oldVal=wasFocused?ta.value:"";psys.innerHTML=h;if(wasFocused){var ta2=document.getElementById("saveDataArea");if(ta2){ta2.value=oldVal;ta2.focus();}}}
}
function exportSave(){
var raw=JSON.stringify(GS);
var ta=document.getElementById("saveDataArea");
if(ta)ta.value=raw;
try{
var ta2=document.createElement("textarea");
ta2.value=raw;ta2.style.position="fixed";ta2.style.opacity="0";
document.body.appendChild(ta2);ta2.select();
document.execCommand("copy");document.body.removeChild(ta2);
notify("✅ 存档已复制到剪切板！");
}catch(e){notify("⚠️ 复制失败，请手动复制上方文本框内容");}
}
function importSavePrompt(){
var ta=document.getElementById("saveDataArea");
if(!ta||!ta.value.trim()){notify("⚠️ 请先粘贴存档数据到文本框");return;}
try{
var d=JSON.parse(ta.value.trim());
if(!d||typeof d!=="object"||typeof d.coins!=="number"){notify("❌ 无效的存档数据");return;}
Object.assign(GS,d);
for(var pk in PROC_DEFS){if(!GS.processors[pk])GS.processors[pk]={owned:false,level:1,busy:false,timer:0};}
if(!GS.relics)GS.relics=[];
if(!GS.discoveredHybrids)GS.discoveredHybrids=[];
if(!GS.discoveredAnimals)GS.discoveredAnimals=[];
if(!GS._seenEvents)GS._seenEvents=[];
if(!GS._seenWeather)GS._seenWeather=["sunny"];
if(!GS._seenSeasons)GS._seenSeasons=["spring"];
if(typeof GS.scarecrowOn==="undefined")GS.scarecrowOn=true;
GS.maxLand=20+Math.floor((GS.prestigePoints||0)/2);
while(GS.land.length<GS.maxLand){var soils=["normal","clay","sand","dark"];GS.land.push({id:GS.land.length,unlocked:false,soil:soils[GS.land.length%4]});}
saveGame();renderAll();
notify("✅ 存档导入成功！游戏已恢复。");
}catch(e){notify("❌ 存档解析失败："+e.message);}
}
function toggleTheme(){
var b=document.body;
var label=document.getElementById("themeLabel");
var btn=document.getElementById("btnTheme");
var cn=b.className;
if((" "+cn+" ").indexOf(" light ")!==-1){
b.className=cn.replace(" light","").replace("light ","").replace("light","");
localStorage.setItem("farm_theme","dark");
if(label)label.textContent="🌙 深色";
if(btn)btn.textContent="☀️ 切换浅色模式";
}else{
b.className=cn+" light";
localStorage.setItem("farm_theme","light");
if(label)label.textContent="☀️ 浅色";
if(btn)btn.textContent="🌙 切换深色模式";
}
}
(function(){if(localStorage.getItem("farm_theme")==="light"){document.body.className=document.body.className+" light";}})();
function renderAll(){R();renderFarm();renderAnimals();renderProc();renderUpgrades();renderTrade();renderBestiary();renderAch();renderJournal();renderPrestige();renderRelics();renderTutorial();renderInventory();renderSystem();}
function findActEl(t,c){var e=t;while(e&&e!==c){if(e.nodeType===1&&e.getAttribute("data-action")!==null)return e;e=e.parentNode;}if(e===c&&e.nodeType===1&&e.getAttribute("data-action")!==null)return e;return null;}// === Event Delegation ===
(function(){
var pf=document.getElementById("pf");
if(pf)pf.addEventListener("click",function(e){
var el=findActEl(e.target,this);if(!el)return;
var act=el.getAttribute("data-action");if(!act)return;
var sid=el.getAttribute("data-sid");
var cid=el.getAttribute("data-cid");
if(act==="harvest"){harvestSlot(parseInt(sid));}
else if(act==="unlock"){unlockLand(parseInt(sid));renderFarm();R();}
else if(act==="plant"){showPlants(parseInt(sid));}
else if(act==="buySeeds"){var bn=parseInt(el.getAttribute("data-n"))||5;buySeedsN(bn);renderFarm();R();}
else if(act==="doPlant"){doPlant(parseInt(sid),cid);}
else if(act==="cancelPlant"){GS._planting=-1;renderFarm();R();}
});
var pa=document.getElementById("pa");
if(pa)pa.addEventListener("click",function(e){
var el=findActEl(e.target,this);if(!el)return;
var act=el.getAttribute("data-action");if(!act)return;
var aid=el.getAttribute("data-aid");
var aidx=el.getAttribute("data-aidx");
if(act==="buyAnimal"){buyAnimal(aid);renderAnimals();R();}
else if(act==="collectAnimal"){collAnimal(parseInt(aidx));renderAnimals();R();}
});
var pp=document.getElementById("pp");
if(pp)pp.addEventListener("click",function(e){
var el=findActEl(e.target,this);if(!el)return;
var act=el.getAttribute("data-action");if(!act)return;
var pid=el.getAttribute("data-pid");
if(act==="buyProc"){buyProc(pid);renderProc();R();}
else if(act==="startProc"){startProc(pid);renderProc();}
});
var pu=document.getElementById("pu");
if(pu)pu.addEventListener("click",function(e){
var el=findActEl(e.target,this);if(!el)return;
var act=el.getAttribute("data-action");if(!act)return;
var uid=el.getAttribute("data-uid");
if(act==="buyUpgrade"){buyUpgrade(uid);renderUpgrades();R();}
});
var pt=document.getElementById("pt");
if(pt)pt.addEventListener("click",function(e){
var el=findActEl(e.target,this);if(!el)return;
var act=el.getAttribute("data-action");if(!act)return;
var oidx=el.getAttribute("data-oidx");
if(act==="acceptOffer"){acceptOffer(parseInt(oidx));}
});
var ppr=document.getElementById("ppr");
if(ppr)ppr.addEventListener("click",function(e){
var el=findActEl(e.target,this);if(!el)return;
var act=el.getAttribute("data-action");if(!act)return;
if(act==="doPrestige"){doPrestige();}
});
})();
// === Tab Switching ===
function findTabEl(target,container){
    var el=target;
    while(el&&el!==container&&el!==document.body){
        if(el.nodeType===1&&el.getAttribute("data-pn")!==null)return el;
        el=el.parentNode;
    }
    return null;
}
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
var panelMap={farm:"pf",animals:"pa",process:"pp",upgrades:"pu",trade:"pt",bestiary:"pb",achievements:"pach",journal:"pj",prestige:"ppr",relics:"pr",tutorial:"ptut",inventory:"pinv",system:"psys"};
var targetEl=document.getElementById(panelMap[pn]);
if(targetEl)targetEl.classList.add("ac");
});
}
})();
// === Main Loop ===
var lastTick=Date.now();
var autoSaveTimer=0;
var _renderInterval=0;
function gameLoop(){
var now=Date.now();var dt=(now-lastTick)/1000;lastTick=now;
tick(dt);
_renderInterval+=dt;
if(_renderInterval>=0.3){
_renderInterval=0;
renderFarm();R();renderAnimals();renderProc();renderUpgrades();renderTrade();renderBestiary();renderAch();renderJournal();renderPrestige();renderRelics();renderInventory();renderSystem();
}
autoSaveTimer+=dt;
if(autoSaveTimer>=30){autoSaveTimer=0;saveGame();}
requestAnimationFrame(gameLoop);
}
// === Init ===
var loaded=loadGame();
if(!loaded)initGame();
renderAll();
notify("🌾 欢迎来到农场增量！从种植小麦开始吧~");
lastTick=Date.now();
requestAnimationFrame(gameLoop);
