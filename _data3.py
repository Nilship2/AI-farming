# -*- coding: utf-8 -*-
path = r"C:\农场增量\game.js"
with open(path, "r", encoding="utf-8") as f:
    js = f.read()

print("="*70)
print("1. 所有作物数据")
print("="*70)
print("名称     | 图标  | 生长 | 价值 | 适配土壤 | 解锁(累计💰)")
print("-"*70)
crops = [
    ("小麦",    "wheat",      60,  10,  "无",   0),
    ("胡萝卜",  "carrot",     90,  16,  "无",   500),
    ("土豆",    "potato",     120, 25,  "黏土",  2000),
    ("番茄",    "tomato",     150, 35,  "无",   5000),
    ("玉米",    "corn",       180, 50,  "沙",   12000),
    ("草莓",    "strawberry", 210, 70,  "黑土",  30000),
    ("向日葵",  "sunflower",  160, 45,  "无",   35000),
    ("辣椒",    "pepper",     140, 40,  "沙",   40000),
    ("蓝莓",    "blueberry",  200, 60,  "黑土",  60000),
    ("南瓜",    "pumpkin",    260, 100, "黑土",  70000),
    ("葡萄",    "grape",      280, 130, "黏土",  150000),
    ("西瓜",    "watermelon", 320, 160, "沙",   200000),
]
icons = {"wheat":"🌾","carrot":"🥕","potato":"🥔","tomato":"🍅","corn":"🌽",
         "strawberry":"🍓","sunflower":"🌻","pepper":"🌶️","blueberry":"🫐",
         "pumpkin":"🎃","grape":"🍇","watermelon":"🍉"}
for name, cid, g, v, soil, unl in crops:
    print("%-5s %s | %3ss | %3d💰 | %-4s | %d" % (name, icons[cid], g, v, soil, unl))

# 2. Seeds cost
print("\n种子购买: 4💰/个 (1=4💰, 5=20💰, 20=80💰)")
print("种植消耗种子数 = ceil(作物价值 × 0.25)")
print("  小麦(10): 3种子 | 胡萝卜(16): 4种子 | 土豆(25): 7种子")
print("  收获时30%概率返还1颗种子")

# 3. Weather
print("\n" + "="*70)
print("2. 天气系统")
print("="*70)
print("天气     | 效果")
print("-"*70)
print("晴天 ☀️ | 生长加速+10%")
print("多云 ☁️ | 无加成")
print("雨天 🌧️ | 生长加速+30% (免浇水)")
print("暴风雨 ⛈️| 无加成")
print("切换: 每120~360秒随机切换一次")

# 4. Seasons
print("\n" + "="*70)  
print("3. 季节系统")
print("="*70)
print("每30分钟(1800秒)切换一季，四季轮替 → 每年2小时")
print()
print("季节   | 适配作物")
print("-"*70)
print("春季 🌸 | 小麦(wheat)")
print("夏季 ☀️ | 玉米(corn)")
print("秋季 🍂 | 南瓜(pumpkin)")
print("冬季 ❄️ | 土豆(potato)")
print()
print("非适配季节: 生长速度×0.5")
print("温室升级: 无视季节限制")

# 5. Events
print("\n" + "="*70)
print("4. 随机事件 (共约30种,间隔180~480秒)")
print("="*70)
# Extract events from game.js
ev_start = js.find("function randEvent(){")
ev_end = js.find("function checkAch", ev_start)
ev_code = js[ev_start:ev_end]

# Find event names
import re
ev_names = re.findall(r'n:"([^"]+)"', ev_code)
ev_descs = re.findall(r'd:"([^"]+)"', ev_code)
print("事件名 | 描述")
print("-"*70)
for i in range(min(len(ev_names), len(ev_descs))):
    print("%s | %s" % (ev_names[i], ev_descs[i]))

# 6. Trade / merchant
print("\n" + "="*70)
print("5. 贸易站")
print("="*70)
# Find merchant generation
merch_start = js.find("function genMerchant(){")
merch_end = js.find("function", merch_start+10)
merch_code = js[merch_start:merch_end] if merch_end > 0 else js[merch_start:merch_start+800]
print("触发条件: 累计金币≥5000, 每240~360秒刷新一次")
print("(远古商契遗物: 频率+50%)")

# 7. Prestige
print("\n" + "="*70)
print("6. 转生系统")
print("="*70)
print("农场之心 = floor(sqrt(累计获得金币 / 10000))")
print("每1个农场之心: 永久 +10% 金币收入")
print("转生后保留: 图鉴、杂交品种、成就、故事碎片")
print("转生后重置: 金币、土地、动物、升级、设施")
print("转生后: 最大土地 += floor(农场之心/2)")
