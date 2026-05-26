// 地域定义
// soil: 该地域的土壤类型
// startUnlocked: 是否开局解锁
// priceA, priceB: 第x块地的价格 = a*x + b
// startLands: 开局免费解锁地块数
DataRegistry.registerAll("region", [
    {id:"plain",    n:"平原",     i:"🌾", soil:"normal", startUnlocked:true,  priceA:200,  priceB:0,   startLands:1},
    {id:"sandland", n:"沙地",     i:"🏜️", soil:"sand",   startUnlocked:true,  priceA:400,  priceB:200, startLands:1},
    {id:"darkland", n:"黑土平原", i:"🌑", soil:"dark",   startUnlocked:true,  priceA:600,  priceB:400, startLands:1},
    {id:"clayhill", n:"黏土山",   i:"⛰️", soil:"clay",   startUnlocked:true,  priceA:500,  priceB:300, startLands:1}
]);
