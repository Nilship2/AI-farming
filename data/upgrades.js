// 农场升级定义
DataRegistry.registerAll("upgrade", [
    {id:"scarecrow",    n:"稻草人助手", i:"🤖", d:"自动播种",       c:300,   unlock:500,   ef:"autoPlant"},
    {id:"irrigation",   n:"灌溉系统",   i:"💧", d:"生长加速20%",    c:1500,  unlock:3000,  ef:"grow",     v:0.2},
    {id:"fertilizer",   n:"肥料研究",   i:"🧪", d:"生长加速30%",    c:5000,  unlock:10000, ef:"grow",     v:0.3},
    {id:"greenhouse",   n:"温室",       i:"🏠", d:"无视季节限制",   c:20000, unlock:50000, ef:"ignoreSeason"},
    {id:"autoHarvest",  n:"自动收割机", i:"🚜", d:"自动收获",       c:15000, unlock:40000, ef:"autoHarvest"},
    {id:"sprinkler",    n:"高级洒水器", i:"🚿", d:"生长加速50%",    c:30000, unlock:80000, ef:"grow",     v:0.5},
    {id:"megaFert",     n:"超级肥料",   i:"⚗️", d:"生长加速100%",  c:100000, unlock:200000, ef:"grow",    v:1.0},
    {id:"drone",        n:"无人机群",   i:"🛸", d:"全自动管理",     c:50000, unlock:150000, ef:"fullAuto"}
]);