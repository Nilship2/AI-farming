// 加工设施定义
DataRegistry.registerAll("processor", [
    {id:"mill",         n:"磨坊",     i:"🏭", c:400,   inp:{k:"wheat",n:"小麦"},       out:{k:"flour",n:"面粉",i:"🌾📦",v:20},   t:30, unlock:1000},
    {id:"bakery",       n:"面包房",   i:"🍞", c:2000,  inp:{k:"flour",n:"面粉"},       out:{k:"bread",n:"面包",i:"🍞",v:60},      t:45, unlock:5000},
    {id:"dairy",        n:"奶酪坊",   i:"🧀", c:4000,  inp:{k:"milk",n:"牛奶"},        out:{k:"cheese",n:"奶酪",i:"🧀",v:100},    t:50, unlock:12000},
    {id:"loom",         n:"织布机",   i:"🧵", c:15000, inp:{k:"wool",n:"羊毛"},        out:{k:"cloth",n:"布料",i:"👘",v:150},     t:60, unlock:60000},
    {id:"smoker",       n:"熏制坊",   i:"🔥", c:20000, inp:{k:"pumpkin",n:"南瓜"},     out:{k:"smoked_pumpkin",n:"烟熏南瓜",i:"🔥🎃",v:200}, t:60, unlock:100000},
    {id:"brewery",      n:"酿酒坊",   i:"🍺", c:25000, inp:{k:"corn",n:"玉米"},        out:{k:"corn_wine",n:"玉米酒",i:"🍺🌽",v:180},   t:55, unlock:120000},
    {id:"jam_kitchen",  n:"果酱工坊", i:"🍯", c:30000, inp:{k:"strawberry",n:"草莓"},  out:{k:"strawberry_jam",n:"草莓果酱",i:"🍯🍓",v:220}, t:50, unlock:150000}
]);