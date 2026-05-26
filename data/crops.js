// 基础作物定义
DataRegistry.registerAll("crop", [
    {id:"wheat",     n:"小麦",   i:"🌾",   g:60,  v:10,  soil:null,   unlock:0,    season:"spring"},
    {id:"carrot",    n:"胡萝卜", i:"🥕",   g:90,  v:16,  soil:null,   unlock:500},
    {id:"potato",    n:"土豆",   i:"🥔",   g:120, v:25,  soil:"clay", unlock:2000,  season:"winter"},
    {id:"tomato",    n:"番茄",   i:"🍅",   g:150, v:35,  soil:null,   unlock:5000},
    {id:"corn",      n:"玉米",   i:"🌽",   g:180, v:50,  soil:"sand", unlock:12000, season:"summer"},
    {id:"strawberry",n:"草莓",   i:"🍓",   g:210, v:70,  soil:"dark", unlock:30000},
    {id:"pumpkin",   n:"南瓜",   i:"🎃",   g:260, v:100, soil:"dark", unlock:70000, season:"autumn"},
    {id:"watermelon",n:"西瓜",   i:"🍉",   g:320, v:160, soil:"sand", unlock:200000},
    {id:"blueberry", n:"蓝莓",   i:"🫐",   g:200, v:60,  soil:"dark", unlock:60000},
    {id:"sunflower", n:"向日葵", i:"🌻",   g:160, v:45,  soil:null,   unlock:35000},
    {id:"grape",     n:"葡萄",   i:"🍇",   g:280, v:130, soil:"clay", unlock:150000},
    {id:"pepper",    n:"辣椒",   i:"🌶️",  g:140, v:40,  soil:"sand", unlock:40000}
]);