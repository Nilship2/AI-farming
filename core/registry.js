// DataRegistry — 数据注册中心（支持 Mod 启用/禁用）
var DataRegistry = (function() {
    var _data = {};
    var _order = {};
    var _disabledMods = {};  // { modId: true } 禁用的 Mod
    
    function _ensure(cat) {
        if (!_data[cat]) { _data[cat] = {}; _order[cat] = []; }
    }
    
    function _isDisabled(def) {
        return def.__modId && _disabledMods[def.__modId];
    }
    
    return {
        register: function(cat, def, opts) {
            _ensure(cat);
            var id = def.id;
            if (!id) { console.warn("DataRegistry: missing id", cat, def); return; }
            if (opts && opts.modId) def.__modId = opts.modId;
            _data[cat][id] = def;
            if (_order[cat].indexOf(id) === -1) _order[cat].push(id);
        },
        registerAll: function(cat, defs) {
            for (var i = 0; i < defs.length; i++) {
                DataRegistry.register(cat, defs[i]);
            }
        },
        get: function(cat, id) {
            return (_data[cat] && _data[cat][id]) || null;
        },
        all: function(cat) {
            if (!_data[cat]) return [];
            var result = [];
            for (var i = 0; i < _order[cat].length; i++) {
                var def = _data[cat][_order[cat][i]];
                if (!_isDisabled(def)) result.push(def);
            }
            return result;
        },
        filter: function(cat, fn) {
            return DataRegistry.all(cat).filter(fn);
        },
        ids: function(cat) {
            if (!_data[cat]) return [];
            var result = [];
            for (var i = 0; i < _order[cat].length; i++) {
                var def = _data[cat][_order[cat][i]];
                if (!_isDisabled(def)) result.push(def.id);
            }
            return result;
        },
        override: function(cat, def) {
            _ensure(cat);
            _data[cat][def.id] = def;
            if (_order[cat].indexOf(def.id) === -1) _order[cat].push(def.id);
        },
        has: function(cat, id) {
            return !!(_data[cat] && _data[cat][id]);
        },
        count: function(cat) {
            return DataRegistry.ids(cat).length;
        },
        remove: function(cat, id) {
            if (_data[cat]) delete _data[cat][id];
            if (_order[cat]) {
                var idx = _order[cat].indexOf(id);
                if (idx !== -1) _order[cat].splice(idx, 1);
            }
        },
        // Mod 管理
        enableMod: function(modId) {
            delete _disabledMods[modId];
        },
        disableMod: function(modId) {
            _disabledMods[modId] = true;
        },
        setEnabledMods: function(modIds) {
            _disabledMods = {};
            if (window.__modManifest) {
                for (var i = 0; i < window.__modManifest.length; i++) {
                    var mid = window.__modManifest[i].id;
                    if (modIds.indexOf(mid) === -1) _disabledMods[mid] = true;
                }
            }
        },
        dump: function(cat) {
            if (cat) {
                var obj = {};
                var ids = DataRegistry.ids(cat);
                for (var i = 0; i < ids.length; i++) {
                    obj[ids[i]] = JSON.parse(JSON.stringify(_data[cat][ids[i]]));
                }
                return obj;
            }
            return JSON.parse(JSON.stringify(_data));
        }
    };
})();