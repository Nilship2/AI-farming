// DataRegistry — 数据注册中心
var DataRegistry = (function() {
    var _data = {};
    var _order = {};
    function _ensure(cat) {
        if (!_data[cat]) { _data[cat] = {}; _order[cat] = []; }
    }
    return {
        register: function(cat, def) {
            _ensure(cat);
            var id = def.id;
            if (!id) { console.warn("DataRegistry: missing id", cat, def); return; }
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
                result.push(_data[cat][_order[cat][i]]);
            }
            return result;
        },
        filter: function(cat, fn) {
            var all = DataRegistry.all(cat);
            return all.filter(fn);
        },
        ids: function(cat) {
            return _order[cat] ? _order[cat].slice() : [];
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
            return _order[cat] ? _order[cat].length : 0;
        },
        remove: function(cat, id) {
            if (_data[cat]) delete _data[cat][id];
            if (_order[cat]) {
                var idx = _order[cat].indexOf(id);
                if (idx !== -1) _order[cat].splice(idx, 1);
            }
        },
        dump: function(cat) {
            if (cat) return JSON.parse(JSON.stringify(_data[cat] || {}));
            return JSON.parse(JSON.stringify(_data));
        }
    };
})();