# -*- coding: utf-8 -*-
path = r"C:\农场增量\game.js"
with open(path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. All crop definitions
crop_start = js.find("var CROP_DEFS={")
crop_end = js.find("};", crop_start) + 2
crop_str = js[crop_start:crop_end]
print("=== 作物数据 ===")
# Parse crops manually
import re
crops = re.findall(r'(\w+):\{n:"([^"]+)",i:"([^"]+)",g:(\d+),v:(\d+),soil:(\w+|null),unlock:(\d+)\}', crop_str)
print("作物名 | 图标 | 生长(s) | 价值 | 适配土壤 | 解锁累计金币")
print("-"*70)
for c in crops:
    soil_cn = {"clay":"黏土", "sand":"沙", "dark":"黑土", "null":"无"}.get(c[5], c[5])
    print("%s | %s | %ss | %s💰 | %s | %s" % (c[1], c[2], c[3], c[4], soil_cn, c[6]))

# 2. Hybrid definitions
hyb_start = js.find("var HYBRID_DEFS={")
hyb_end = js.find("};", hyb_start) + 2
hyb_str = js[hyb_start:hyb_end]
print("\n=== 杂交作物 ===")
hybs = re.findall(r'"([^"]+)":\{n:"([^"]+)",i:"([^"]+)",p:\["(\w+)","(\w+)"\],ch:([\d.]+),v:(\d+),unlock:(\d+)\}', hyb_str)
print("杂交品 | 图标 | 亲本A+亲本B | 概率 | 价值 | 解锁")
print("-"*70)
for h in hybs:
    print("%s | %s | %s+%s | %.0f%% | %s💰 | %s" % (h[1], h[2], h[3], h[4], float(h[5])*100, h[6], h[7]))
