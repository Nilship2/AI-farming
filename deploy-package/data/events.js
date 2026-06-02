// 随机事件定义
DataRegistry.registerAll("event", [
    {id:"rain_bless",    n:"天降甘霖",i:"🌧️",   d:"雨水滋润了土地！",                    ef:function(){GS.weatherTimer=60;GS.weather="rainy";}},
    {id:"rabbit_raid",   n:"兔子来袭",i:"🐰",   d:"兔子偷吃了一些作物，但留下了兔毛可卖钱。", ef:function(){GS.coins+=Math.floor(Math.random()*200)+50;forEachCropSlot(function(s){if(Math.random()<0.15)s.crop.timer=Math.max(0,s.crop.timer-30);});notify("兔子留下了兔毛，+"+(Math.floor(Math.random()*200)+50)+"💰");}},
    {id:"double_value",  n:"双倍市价日",i:"💰", d:"市场行情大涨！60秒内收获价值翻倍。",      ef:function(){window._doubleValue=true;window._doubleValueEnd=Date.now()+60000;setTimeout(function(){window._doubleValue=false;window._doubleValueEnd=0;},60000);}},
    {id:"mystic_merch",  n:"神秘商人",i:"🧙",   d:"一位神秘商人高价收购你的产品！",          ef:function(){var b=Math.floor(Math.random()*1000)+300;GS.coins+=b;GS.totalCoinsEarned+=b;notify("神秘商人给了你 "+b+"💰");}},
    {id:"seed_bag",      n:"发现种子袋",i:"🌱", d:"在田地边缘发现了被遗忘的种子！",          ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+8;notify("获得 8 颗种子！");}},
    {id:"friendly_neigh",n:"友善的邻居",i:"👨‍🌾", d:"邻居老张送来了他培育的新品种！",           ef:function(){var allCrops=DataRegistry.ids("crop");var undiscovered=[];for(var i=0;i<allCrops.length;i++){if(GS.discoveredCrops.indexOf(allCrops[i])===-1)undiscovered.push(allCrops[i]);}if(undiscovered.length>0){var pick=undiscovered[Math.floor(Math.random()*undiscovered.length)];GS.discoveredCrops.push(pick);notify("解锁新作物："+DataRegistry.get("crop",pick).n);}else{GS.inventory.seeds=(GS.inventory.seeds||0)+20;notify("获得 20 颗种子！");}}},
    {id:"pest_invasion", n:"害虫入侵",i:"🐛",   d:"一群害虫袭击了农场，部分作物受损！",      ef:function(){forEachCropSlot(function(s){if(Math.random()<0.3)s.crop.timer=Math.max(0,s.crop.timer-60);});notify("害虫被驱散了，但一些作物受到了损伤。");}},
    {id:"land_collapse", n:"土地塌陷",i:"🕳️",   d:"一块田地发生了塌陷！",                    ef:function(){var b=Math.floor(Math.random()*800)+400;GS.coins+=b;GS.totalCoinsEarned+=b;notify("古物卖了 "+b+"💰！");}},
    {id:"bird_raid",     n:"鸟群来袭",i:"🐦",   d:"鸟群袭击了农田！种子被偷吃了。",          ef:function(){var lost=Math.floor(Math.random()*5)+1;GS.inventory.seeds=Math.max(0,(GS.inventory.seeds||0)-lost);notify("鸟群偷吃了 "+lost+" 颗种子！");}},
    {id:"tool_sale",     n:"农具促销",i:"🔧",   d:"镇上农具店大促销！升级成本临时降低。",     ef:function(){window._toolDiscount=true;setTimeout(function(){window._toolDiscount=false;},60000);}},
    {id:"plant_mutation",n:"植物突变",i:"🧬",   d:"一株作物发生了奇怪的变化，价值暴增！",     ef:function(){forEachLandSlot(function(s3,rid,li){if(s3.crop&&Math.random()<0.2){var b2=CROP_DEFS[s3.crop.id].v*8;GS.coins+=b2;GS.totalCoinsEarned+=b2;notify("突变作物价值"+b2+"💰！");s3.crop=null;return true;}});if(true)notify("空气中弥漫着奇怪的味道...");}},
    {id:"harvest_fest",  n:"丰收庆典",i:"🎉",   d:"村民们举办丰收庆典，送来了礼物！",        ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+15;GS.coins+=200;GS.totalCoinsEarned+=200;notify("获得 15 颗种子 + 200💰！");}},
    {id:"harvest_goddess",n:"丰收女神的祝福",i:"✨",d:"丰收女神路过此地，被你的勤劳打动。",      ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+15;var b4=Math.floor(Math.random()*2000)+1000;GS.coins+=b4;GS.totalCoinsEarned+=b4;notify("丰收女神赐予 "+b4+"💰 和 15 颗种子！");}},
    {id:"earth_bless",   n:"大地赐福",i:"🌍",   d:"土地异常肥沃，所有作物瞬间成熟！",          ef:function(){forEachCropSlot(function(s){s.crop.timer=s.crop.gt;});}},
    {id:"stray_cat",     n:"流浪猫到访",i:"🐱", d:"一只橘猫在农场安了家。它不干活，但让你的心情变好了。", ef:function(){GS.gems=(GS.gems||0)+1;notify("获得1颗宝石💎（猫咪带来的好运）");}},
    {id:"weather_flip",  n:"天气预报错误",i:"🔄", d:"原本预报的天气突然反转！",                       ef:function(){var wr=["sunny","cloudy","rainy","storm"];GS.weather=wr[Math.floor(Math.random()*wr.length)];GS.weatherTimer=90+Math.random()*120;notify("天气突变："+GS.weather+"！");}},
    {id:"hot_spring",    n:"地下温泉",i:"♨️",   d:"地质勘探队在农场地下发现温泉，土壤变得异常肥沃。",   ef:function(){GS.weatherTimer=30;GS.weather="rainy";forEachCropSlot(function(s2){s2.crop.timer*=1.8;});}},

    {id:"golden_legend", n:"金色传说",i:"🌟",   d:"一道金光从田中出现——一株作物镀上了金色！",         ef:function(){forEachCropSlot(function(s4){if(Math.random()<0.15){s4.crop.timer=s4.crop.gt;return true;}});notify("金色作物瞬间成熟！");}},
    {id:"merchant_stay", n:"旅行商人停留",i:"🚚", d:"一个疲惫的商人借宿一晚，留下了一些稀有货物。",     ef:function(){genMerchant();notify("商人留下了一批货物！");}},
    {id:"pest_warning",  n:"虫害预警",i:"🐛",   d:"农业局发来虫害预警，但你的杀虫剂刚好够用。",       ef:function(){if(Math.random()<0.5){notify("成功抵御虫害！");}else{forEachCropSlot(function(s5){if(Math.random()<0.25)s5.crop.timer=Math.max(0,s5.crop.timer-50);});notify("虫害造成部分损失...");}}}
]);