# -*- coding: utf-8 -*-
path = r"C:\农场增量\game.js"
with open(path, "r", encoding="utf-8") as f:
    js = f.read()

# Print raw CROP_DEFS
crop_start = js.find("var CROP_DEFS={")
crop_end = js.find("};", crop_start) + 2
print(js[crop_start:crop_end])
