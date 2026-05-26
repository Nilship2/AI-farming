// 基础作物定义
// specialSoils: [{soil, mult}] — 特殊土壤加成，不在列表中的土壤默认 x1.0
// specialSeasons: [{season, mult}] — 特殊季节加成，不在列表中的季节默认 x1.0
// harvestCount: 每次收获产量，默认2
DataRegistry.registerAll("crop", [
    {id:"wheat",     n:"小麦",   i:"🌾",   g:60,  v:10,  specialSoils:[],                                                specialSeasons:[{season:"spring",mult:1.3}],               harvestCount:3, unlock:0},
    {id:"carrot",    n:"胡萝卜", i:"🥕",   g:90,  v:16,  specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"spring",mult:1.2}],               harvestCount:2, unlock:500},
    {id:"potato",    n:"土豆",   i:"🥔",   g:120, v:25,  specialSoils:[{soil:"clay",mult:1.5}],                          specialSeasons:[{season:"winter",mult:1.4}],               harvestCount:3, unlock:2000},
    {id:"tomato",    n:"番茄",   i:"🍅",   g:150, v:35,  specialSoils:[],                                                specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:2, unlock:5000},
    {id:"corn",      n:"玉米",   i:"🌽",   g:180, v:50,  specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"summer",mult:1.4}],               harvestCount:3, unlock:12000},
    {id:"strawberry",n:"草莓",   i:"🍓",   g:210, v:70,  specialSoils:[{soil:"dark",mult:1.5}],                          specialSeasons:[{season:"spring",mult:1.2}],               harvestCount:4, unlock:30000},
    {id:"pumpkin",   n:"南瓜",   i:"🎃",   g:260, v:100, specialSoils:[{soil:"dark",mult:1.5}],                          specialSeasons:[{season:"autumn",mult:1.4}],               harvestCount:2, unlock:70000},
    {id:"watermelon",n:"西瓜",   i:"🍉",   g:320, v:160, specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:2, unlock:200000},
    {id:"blueberry", n:"蓝莓",   i:"🫐",   g:200, v:60,  specialSoils:[{soil:"dark",mult:1.5}],                          specialSeasons:[],                                        harvestCount:5, unlock:60000},
    {id:"sunflower", n:"向日葵", i:"🌻",   g:160, v:45,  specialSoils:[],                                                specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:2, unlock:35000},
    {id:"grape",     n:"葡萄",   i:"🍇",   g:280, v:130, specialSoils:[{soil:"clay",mult:1.5}],                          specialSeasons:[{season:"autumn",mult:1.3}],               harvestCount:3, unlock:150000},
    {id:"pepper",    n:"辣椒",   i:"🌶️",  g:140, v:40,  specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:3, unlock:40000}
]);
