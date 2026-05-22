# -*- coding: utf-8 -*-
path = r"C:\农场增量\game.js"
with open(path, "r", encoding="utf-8") as f:
    js = f.read()

# Get merchant trade details
merch_start = js.find("function genMerchant(){")
merch_end = js.find("function checkAch", merch_start)
if merch_end < 0:
    merch_end = js.find("function", merch_start+25)
merch_code = js[merch_start:merch_end]
print("=== 贸易站详情 ===")
print(merch_code[:1500])

# Also get animal and upgrade data
anim_start = js.find("var ANIMAL_DEFS={")
anim_end = js.find("};", anim_start) + 2
print("\n=== 动物数据 ===")
print(js[anim_start:anim_end])

upg_start = js.find("var UPG_DEFS={")
upg_end = js.find("};", upg_start) + 2
print("\n=== 升级数据 ===")
print(js[upg_start:upg_end])

proc_start = js.find("var PROC_DEFS={")
proc_end = js.find("};", proc_start) + 2
print("\n=== 加工设施 ===")
print(js[proc_start:proc_end])

# Get soil effects
print("\n=== 土壤效果 ===")
print("黏土(clay): 适配土豆、葡萄 → 生长+50%")
print("沙地(sand): 适配玉米、辣椒、西瓜 → 生长+50%")
print("黑土(dark): 适配草莓、南瓜、蓝莓 → 生长+50%")
print("普通(normal): 无加成")
