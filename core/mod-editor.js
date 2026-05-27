// ============================================================
// mod-editor.js — 内置模组编辑器
// ============================================================
(function(){
if(!window._devMode)window._devMode=false;

// ====== Draft management ======
var DRAFT_KEY="mod_editor_draft";
function loadDraft(){
    try{var r=localStorage.getItem(DRAFT_KEY);return r?JSON.parse(r):getEmptyDraft();}
    catch(e){return getEmptyDraft();}
}
function saveDraft(d){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d));}catch(e){}}
function getEmptyDraft(){
    return {name:"",id:"",version:"1.0",desc:"",
        crops:[],hybrids:[],animals:[],processors:[],upgrades:[],
        relics:[],achievements:[],events:[]};
}
var draft=loadDraft();

// ====== Data type definitions for forms ======
var FIELD_DEFS={
    crop:[
        {k:"id",n:"ID",t:"text",ph:"magic_cabbage",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法卷心菜",req:true},
        {k:"i",n:"图标",t:"text",ph:"🥬✨"},
        {k:"g",n:"生长时间(秒)",t:"number",ph:"180",req:true},
        {k:"v",n:"价值(金币)",t:"number",ph:"80",req:true},
        {k:"soil",n:"偏好土壤",t:"select",opts:[["","无偏好"],["clay","粘土地"],["sand","沙地"],["dark","黑土地"]]},
        {k:"season",n:"偏好季节",t:"select",opts:[["","无偏好"],["spring","春季"],["summer","夏季"],["autumn","秋季"],["winter","冬季"]]},
        {k:"seasonMult",n:"季节倍率",t:"number",ph:"1.5"},
        {k:"harvestCount",n:"收获数量",t:"number",ph:"2"},
        {k:"unlock",n:"解锁金币",t:"number",ph:"0",req:true}
    ],
    hybrid:[
        {k:"id",n:"ID",t:"text",ph:"magic_hybrid",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法杂交品",req:true},
        {k:"i",n:"图标",t:"text",ph:"✨🌱"},
        {k:"parent1",n:"亲本1 ID",t:"text",ph:"magic_cabbage",req:true},
        {k:"parent2",n:"亲本2 ID",t:"text",ph:"pumpkin",req:true},
        {k:"ch",n:"杂交概率",t:"number",ph:"0.1",req:true},
        {k:"v",n:"价值",t:"number",ph:"200",req:true},
        {k:"g",n:"生长时间(秒)",t:"number",ph:"300",req:true},
        {k:"harvestCount",n:"收获数量",t:"number",ph:"2"},
        {k:"unlock",n:"解锁金币",t:"number",ph:"100000"}
    ],
    animal:[
        {k:"id",n:"ID",t:"text",ph:"magic_cow",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法牛",req:true},
        {k:"i",n:"图标",t:"text",ph:"🐮✨"},
        {k:"c",n:"价格",t:"number",ph:"1000",req:true},
        {k:"pk",n:"产物ID",t:"text",ph:"magic_milk",req:true},
        {k:"pn",n:"产物名",t:"text",ph:"魔法牛奶",req:true},
        {k:"pi",n:"产物图标",t:"text",ph:"🥛✨"},
        {k:"pt",n:"产物时间(秒)",t:"number",ph:"150",req:true},
        {k:"pv",n:"产物价值",t:"number",ph:"50",req:true},
        {k:"am",n:"好感上限",t:"number",ph:"100"},
        {k:"unlock",n:"解锁金币",t:"number",ph:"5000"}
    ],
    processor:[
        {k:"id",n:"ID",t:"text",ph:"magic_mill",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法磨坊",req:true},
        {k:"i",n:"图标",t:"text",ph:"🏭✨"},
        {k:"c",n:"建造成本",t:"number",ph:"5000",req:true},
        {k:"inpK",n:"原料ID",t:"text",ph:"magic_cabbage",req:true},
        {k:"inpN",n:"原料名",t:"text",ph:"魔法卷心菜",req:true},
        {k:"outK",n:"产物ID",t:"text",ph:"magic_powder",req:true},
        {k:"outN",n:"产物名",t:"text",ph:"魔法粉末",req:true},
        {k:"outI",n:"产物图标",t:"text",ph:"✨📦"},
        {k:"outV",n:"产物价值",t:"number",ph:"120",req:true},
        {k:"t",n:"加工时间(秒)",t:"number",ph:"40",req:true},
        {k:"unlock",n:"解锁金币",t:"number",ph:"20000"}
    ],
    achievement:[
        {k:"id",n:"ID",t:"text",ph:"magic_harvest",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法农夫",req:true},
        {k:"d",n:"描述",t:"text",ph:"收获魔法作物",req:true},
        {k:"t",n:"等级(1-5星)",t:"number",ph:"3",req:true},
        {k:"cond",n:"条件(JS表达式)",t:"text",ph:"(GS.inventory.magic_cabbage||0)>=1",req:true}
    ],
    relic:[
        {k:"id",n:"ID",t:"text",ph:"magic_relic",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法遗物",req:true},
        {k:"i",n:"图标",t:"text",ph:"🪄"},
        {k:"d",n:"描述",t:"text",ph:"所有作物价值+20%",req:true},
        {k:"ef",n:"效果类型",t:"select",opts:[["cropValue","作物价值"],["grow","生长速度"],["harvestPlus","收获+1"],["weatherResist","天气抵抗"],["seedDiscount","种子折扣"],["hybridChance","杂交概率"],["merchantFreq","商人频率"],["processSpeed","加工速度"]],req:true},
        {k:"v",n:"效果数值",t:"number",ph:"0.2"}
    ],
    event:[
        {k:"id",n:"ID",t:"text",ph:"magic_event",req:true},
        {k:"n",n:"名称",t:"text",ph:"魔法事件",req:true},
        {k:"i",n:"图标",t:"text",ph:"✨"},
        {k:"d",n:"描述",t:"text",ph:"发生了神秘的事情！",req:true},
        {k:"efCode",n:"效果(JS代码)",t:"textarea",ph:"GS.coins+=500;notify('获得500金币！');",req:true}
    ]
};

// ====== Render mod editor ======
window.renderModEditor = function(){
    var h='<div class="cd"><h3>🔧 模组开发</h3>';
    h+='<div style="font-size:.8em;color:#aaa;margin-bottom:8px">在手机上便捷开发官方模组。草稿自动保存至本地。</div>';

    // Meta info
    h+='<div class="me-entry"><h4>📋 模组信息</h4><div class="me-row">';
    h+=_field('name','模组名','text',draft.name,'魔法作物包','me-name');
    h+=_field('id','模组ID','text',draft.id,'magic_crops','me-id');
    h+='</div><div class="me-row">';
    h+=_field('version','版本','text',draft.version,'1.0','me-ver');
    h+=_field('desc','描述','text',draft.desc,'添加魔法作物和对应成就','me-desc');
    h+='</div></div>';

    // Data sections
    var sections=[
        {cat:'crops',n:'🌾 作物',icon:'+ 添加作物'},
        {cat:'hybrids',n:'🧬 杂交品种',icon:'+ 添加杂交'},
        {cat:'animals',n:'🐄 动物',icon:'+ 添加动物'},
        {cat:'processors',n:'🏭 加工设施',icon:'+ 添加加工品'},
        {cat:'achievements',n:'🏆 成就',icon:'+ 添加成就'},
        {cat:'relics',n:'🏺 遗物',icon:'+ 添加遗物'},
        {cat:'events',n:'🎲 随机事件',icon:'+ 添加事件'}
    ];
    for(var si=0;si<sections.length;si++){
        var sec=sections[si];
        var items=draft[sec.cat]||[];
        h+='<div class="me-entry"><h4>'+sec.n+' ('+items.length+'个)</h4>';
        for(var ei=0;ei<items.length;ei++){
            h+=_renderEntry(sec.cat,ei,items[ei]);
        }
        h+='<button class="bt sm bl" onclick="window._modEditor.addEntry(\x27'+sec.cat+'\x27)" style="font-size:.75em">'+sec.icon+'</button>';
        h+='</div>';
    }

    // Actions
    h+='<div class="me-actions">';
    h+='<button class="bt" onclick="window._modEditor.inject()" style="font-size:.85em">🧪 注入测试</button>';
    h+='<button class="bt gn" onclick="window._modEditor.exportMod()" style="font-size:.85em">📤 导出模组</button>';
    h+='<button class="bt bl" onclick="window._modEditor.importMod()" style="font-size:.85em">📥 导入模组</button>';
    h+='<button class="bt rd" onclick="if(confirm(\x27确定清空所有草稿？\x27))window._modEditor.clearAll()" style="font-size:.85em">🗑 清空</button>';
    h+='</div>';
    h+='</div>';
    var pm=document.getElementById("pmodedit");if(pm)pm.innerHTML=h;
    saveDraft(draft);
};

function _field(key,label,type,value,placeholder,cls){
    var h='<label>'+label+': ';
    if(type==='textarea'){
        h+='<textarea class="'+cls+'" oninput="window._modEditor.setMeta(\x27'+key+'\x27,this.value)" placeholder="'+placeholder+'">'+_esc(value||'')+'</textarea>';
    }else if(type==='select'){
        h+='<select class="'+cls+'" oninput="window._modEditor.setMeta(\x27'+key+'\x27,this.value)">';
        var fd=FIELD_DEFS[cls]||[];
        for(var fi=0;fi<fd.length;fi++){if(fd[fi].k===key&&fd[fi].opts){for(var oi=0;oi<fd[fi].opts.length;oi++){var sel=fd[fi].opts[oi];h+='<option value="'+sel[0]+'"'+(value===sel[0]?' selected':'')+'>'+sel[1]+'</option>';}break;}}
        h+='</select>';
    }else{
        h+='<input class="'+cls+'" type="'+type+'" oninput="window._modEditor.setMeta(\x27'+key+'\x27,this.value)" placeholder="'+placeholder+'" value="'+_esc(value||'')+'">';
    }
    h+='</label>';
    return h;
}
function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function _renderEntry(cat,idx,entry){
    var h='<div data-entry="'+cat+'-'+idx+'" data-idx="'+idx+'" style="border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:8px;margin:4px 0;background:rgba(0,0,0,.1)">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    h+='<span style="color:#ffcc80;font-size:.85em">#'+(idx+1)+' '+(entry.n||entry.id||'未命名')+'</span>';
    h+='<button class="bt sm rd" onclick="window._modEditor.removeEntry(\x27'+cat+'\x27,'+idx+')" style="font-size:.65em;padding:2px 6px">✕</button>';
    h+='</div>';
    var catSingular=cat.replace(/s$/,'');var fields=FIELD_DEFS[catSingular]||FIELD_DEFS[cat]||[];
    for(var fi=0;fi<fields.length;fi++){
        var f=fields[fi];
        var val=entry[f.k]!==undefined?entry[f.k]:'';
        h+='<div style="margin:2px 0">';
        if(f.t==='select'){
            h+='<label style="font-size:.75em;color:#aaa">'+f.n+': <select oninput="window._modEditor.setField(\x27'+cat+'\x27,'+idx+',\x27'+f.k+'\x27,this.value,this)" style="background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);color:#f0e0c0;padding:2px 4px;border-radius:3px;font-size:.8em;font-family:inherit;width:100%">';
            for(var oi=0;oi<f.opts.length;oi++){h+='<option value="'+f.opts[oi][0]+'"'+(String(val)===f.opts[oi][0]?' selected':'')+'>'+f.opts[oi][1]+'</option>';}
            h+='</select></label>';
        }else{
            h+='<label style="font-size:.75em;color:#aaa">'+f.n+': <'+(f.t==='textarea'?'<textarea oninput="window._modEditor.setField(\x27'+cat+'\x27,'+idx+',\x27'+f.k+'\x27,this.value,this)" placeholder="'+(f.ph||'')+'" style="background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);color:#f0e0c0;padding:2px 4px;border-radius:3px;font-size:.8em;font-family:inherit;width:100%;min-height:50px">'+_esc(val)+'</textarea>':'<input type="'+f.t+'" oninput="window._modEditor.setField(\x27'+cat+'\x27,'+idx+',\x27'+f.k+'\x27,this.value,this)" placeholder="'+(f.ph||'')+'" value="'+_esc(val)+'" style="background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);color:#f0e0c0;padding:2px 4px;border-radius:3px;font-size:.8em;font-family:inherit;width:100%">')+(f.req?' <span style="color:#ef5350">*</span>':'')+'</label>';
        }
        h+='</div>';
    }
    h+='</div>';
    return h;
}

// ====== Editor actions ======
window._modEditor={
    setMeta:function(k,v){draft[k]=v;saveDraft(draft);},
    addEntry:function(cat){
        if(!draft[cat])draft[cat]=[];
        var entry={};
        var catSingular=cat.replace(/s$/,'');var fields=FIELD_DEFS[catSingular]||FIELD_DEFS[cat]||[];
        for(var i=0;i<fields.length;i++){entry[fields[i].k]='';}
        draft[cat].push(entry);
        saveDraft(draft);
        renderModEditor();
    },
    removeEntry:function(cat,idx){
        draft[cat].splice(idx,1);
        saveDraft(draft);
        renderModEditor();
    },
    setField:function(cat,idx,key,value,el){
        if(!draft[cat]||!draft[cat][idx])return;
        var v=value;
        if(key==='g'||key==='v'||key==='c'||key==='t'||key==='pt'||key==='pv'||key==='am'||key==='unlock'||key==='ch'||key==='harvestCount')v=parseFloat(value)||0;
        draft[cat][idx][key]=v;
        saveDraft(draft);
        if(el){
            var entryDiv=el;
            while(entryDiv&&!entryDiv.getAttribute('data-entry'))entryDiv=entryDiv.parentNode;
            if(entryDiv){
                var hdr=entryDiv.querySelector('span');
                if(hdr){
                    var idx2=parseInt(entryDiv.getAttribute('data-idx'))+1;
                    hdr.textContent='#'+idx2+' '+(draft[cat][idx].n||draft[cat][idx].id||'未命名');
                }
            }
        }
    },
    inject:function(){
        if(!draft.id){notify('请先填写模组ID');return;}
        // Build and register all entries
        var modId=draft.id;
        _injectCrops(modId);
        _injectHybrids(modId);
        _injectAnimals(modId);
        _injectProcessors(modId);
        _injectAchievements(modId);
        _injectRelics(modId);
        _injectEvents(modId);
        rebuildBridge();
        renderAll();
        notify('✅ 模组已注入！可切换到对应面板查看效果');
    },
    exportMod:function(){
        if(!draft.id){notify('请先填写模组ID');return;}
        var js=_buildModJS();
        // Download as file
        var blob=new Blob([js],{type:'text/javascript'});
        var a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download=draft.id+'.js';
        a.click();
        URL.revokeObjectURL(a.href);
        notify('📤 模组已导出: '+draft.id+'.js');
    },
    importMod:function(){
        var inp=document.createElement('input');
        inp.type='file';inp.accept='.js';
        inp.onchange=function(e){
            var file=e.target.files[0];
            if(!file)return;
            var reader=new FileReader();
            reader.onload=function(ev){
                try{_parseModJS(ev.target.result);renderModEditor();notify('📥 模组已导入');}
                catch(err){notify('❌ 导入失败: '+err.message);}
            };
            reader.readAsText(file);
        };
        inp.click();
    },
    clearAll:function(){
        draft=getEmptyDraft();
        saveDraft(draft);
        renderModEditor();
    }
};

// ====== Injection helpers ======
function _injectCrops(modId){
    var items=draft.crops||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id)continue;
        var def={id:it.id,n:it.n||it.id,i:it.i||'📦',g:it.g||60,v:it.v||10};
        if(it.soil)def.specialSoils=[{soil:it.soil,mult:parseFloat(it.seasonMult)||1.5}];
        else def.specialSoils=[];
        if(it.season)def.specialSeasons=[{season:it.season,mult:parseFloat(it.seasonMult)||1.3}];
        else def.specialSeasons=[];
        def.harvestCount=it.harvestCount||2;
        def.unlock=it.unlock||0;
        DataRegistry.register("crop",def,{modId:modId});
    }
}
function _injectHybrids(modId){
    var items=draft.hybrids||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id||!it.parent1||!it.parent2)continue;
        DataRegistry.register("hybrid",{
            id:it.id,n:it.n||it.id,i:it.i||'✨',p:[it.parent1,it.parent2],
            ch:it.ch||0.1,v:it.v||100,g:it.g||200,
            specialSoils:[],specialSeasons:[],
            harvestCount:it.harvestCount||2,unlock:it.unlock||0
        },{modId:modId});
    }
}
function _injectAnimals(modId){
    var items=draft.animals||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id)continue;
        DataRegistry.register("animal",{
            id:it.id,n:it.n||it.id,i:it.i||'🐾',c:it.c||500,
            p:{n:it.pn||'产物',i:it.pi||'📦',t:it.pt||120,v:it.pv||20,k:it.pk||(it.id+'_product')},
            am:it.am||100,unlock:it.unlock||0
        },{modId:modId});
    }
}
function _injectProcessors(modId){
    var items=draft.processors||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id)continue;
        DataRegistry.register("processor",{
            id:it.id,n:it.n||it.id,i:it.i||'🏭',c:it.c||1000,
            inp:{k:it.inpK||'',n:it.inpN||''},
            out:{k:it.outK||'',n:it.outN||'',i:it.outI||'📦',v:it.outV||50},
            t:it.t||30,unlock:it.unlock||0
        },{modId:modId});
    }
}
function _injectAchievements(modId){
    var items=draft.achievements||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id||!it.cond)continue;
        var condFn=new Function('return '+it.cond);
        DataRegistry.register("achievement",{
            id:it.id,n:it.n||it.id,d:it.d||'',t:it.t||3,ch:condFn
        },{modId:modId});
    }
}
function _injectRelics(modId){
    var items=draft.relics||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id)continue;
        DataRegistry.register("relic",{
            id:it.id,n:it.n||it.id,i:it.i||'🏺',d:it.d||'',
            ef:it.ef||'cropValue',v:it.v||0.1
        },{modId:modId});
    }
}
function _injectEvents(modId){
    var items=draft.events||[];
    for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.id||!it.efCode)continue;
        var efFn=new Function(it.efCode);
        DataRegistry.register("event",{
            id:it.id,n:it.n||it.id,i:it.i||'✨',d:it.d||'',ef:efFn
        },{modId:modId});
    }
}

// ====== Export / Import ======
function _buildModJS(){
    var h='// '+draft.name+' — '+draft.desc+'\n';
    h+='// Generated by 农场增量 Mod Editor\n';
    h+='// Version: '+draft.version+'\n\n';
    h+='// Mod manifest entry:\n';
    h+='// {id:"'+draft.id+'", name:"'+draft.name+'", file:"mods/'+draft.id+'.js", desc:"'+draft.desc+'", version:"'+draft.version+'"}\n\n';

    var cats=[
        ['crop','作物定义',_fmtCrop],
        ['hybrid','杂交品种',_fmtHybrid],
        ['animal','动物定义',_fmtAnimal],
        ['processor','加工设施',_fmtProcessor],
        ['achievement','成就定义',_fmtAchievement],
        ['relic','遗物定义',_fmtRelic],
        ['event','随机事件',_fmtEvent]
    ];
    for(var ci=0;ci<cats.length;ci++){
        var c=cats[ci];
        var items=draft[c[0]]||[];
        if(items.length===0)continue;
        h+='// '+c[1]+'\n';
        h+='DataRegistry.registerAll("'+c[0]+'", [\n';
        for(var ii=0;ii<items.length;ii++){
            if(!items[ii].id)continue;
            h+='    '+c[2](items[ii])+',\n';
        }
        h+='], {modId: "'+draft.id+'"});\n\n';
    }
    return h;
}
function _fmtCrop(it){
    var parts=[];
    parts.push('id:"'+it.id+'"');parts.push('n:"'+(it.n||'')+'"');parts.push('i:"'+(it.i||'')+'"');
    parts.push('g:'+(it.g||60));parts.push('v:'+(it.v||10));
    if(it.soil)parts.push('specialSoils:[{soil:"'+it.soil+'",mult:'+(parseFloat(it.seasonMult)||1.5)+'}]');
    else parts.push('specialSoils:[]');
    if(it.season)parts.push('specialSeasons:[{season:"'+it.season+'",mult:'+(parseFloat(it.seasonMult)||1.3)+'}]');
    else parts.push('specialSeasons:[]');
    parts.push('harvestCount:'+(it.harvestCount||2));
    parts.push('unlock:'+(it.unlock||0));
    return '{'+parts.join(',')+'}';
}
function _fmtHybrid(it){
    return '{id:"'+it.id+'",n:"'+(it.n||'')+'",i:"'+(it.i||'')+'",p:["'+it.parent1+'","'+it.parent2+'"],ch:'+(it.ch||0.1)+',v:'+(it.v||100)+',g:'+(it.g||200)+',specialSoils:[],specialSeasons:[],harvestCount:'+(it.harvestCount||2)+',unlock:'+(it.unlock||0)+'}';
}
function _fmtAnimal(it){
    return '{id:"'+it.id+'",n:"'+(it.n||'')+'",i:"'+(it.i||'')+'",c:'+(it.c||500)+',p:{n:"'+(it.pn||'')+'",i:"'+(it.pi||'')+'",t:'+(it.pt||120)+',v:'+(it.pv||20)+',k:"'+(it.pk||'')+'"},am:'+(it.am||100)+',unlock:'+(it.unlock||0)+'}';
}
function _fmtProcessor(it){
    return '{id:"'+it.id+'",n:"'+(it.n||'')+'",i:"'+(it.i||'')+'",c:'+(it.c||1000)+',inp:{k:"'+(it.inpK||'')+'",n:"'+(it.inpN||'')+'"},out:{k:"'+(it.outK||'')+'",n:"'+(it.outN||'')+'",i:"'+(it.outI||'')+'",v:'+(it.outV||50)+'},t:'+(it.t||30)+',unlock:'+(it.unlock||0)+'}';
}
function _fmtAchievement(it){
    return '{id:"'+it.id+'",n:"'+(it.n||'')+'",d:"'+(it.d||'')+'",t:'+(it.t||3)+',ch:function(){return '+it.cond+';}}';
}
function _fmtRelic(it){
    return '{id:"'+it.id+'",n:"'+(it.n||'')+'",i:"'+(it.i||'')+'",d:"'+(it.d||'')+'",ef:"'+(it.ef||'cropValue')+'",v:'+(it.v||0.1)+'}';
}
function _fmtEvent(it){
    return '{id:"'+it.id+'",n:"'+(it.n||'')+'",i:"'+(it.i||'')+'",d:"'+(it.d||'')+'",ef:function(){'+it.efCode+'}}';
}

function _parseModJS(js){
    // Simple parser: extract DataRegistry.registerAll calls
    var cats=['crop','hybrid','animal','processor','achievement','relic','event'];
    for(var ci=0;ci<cats.length;ci++){
        var cat=cats[ci];
        var re=new RegExp('DataRegistry\\.registerAll\\("'+cat+'",\\s*\\[([\\s\\S]*?)\\][\\s\\S]*?\\);','g');
        var m=re.exec(js);
        if(m){
            try{
                var arr=eval('['+m[1]+']');
                if(!draft[cat])draft[cat]=[];
                for(var ai=0;ai<arr.length;ai++){
                    var src=arr[ai];
                    var entry={};
                    var catSingular=cat.replace(/s$/,'');var fields=FIELD_DEFS[catSingular]||FIELD_DEFS[cat]||[];
                    for(var fi=0;fi<fields.length;fi++){
                        var fk=fields[fi].k;
                        if(cat==='crop'){
                            if(fk==='soil'&&src.specialSoils&&src.specialSoils.length>0)entry.soil=src.specialSoils[0].soil;
                            else if(fk==='season'&&src.specialSeasons&&src.specialSeasons.length>0)entry.season=src.specialSeasons[0].season;
                            else if(fk==='seasonMult'&&src.specialSeasons&&src.specialSeasons.length>0)entry.seasonMult=src.specialSeasons[0].mult;
                            else if(src[fk]!==undefined)entry[fk]=src[fk];
                        }else if(cat==='animal'){
                            if(fk==='pk'&&src.p)entry.pk=src.p.k;
                            else if(fk==='pn'&&src.p)entry.pn=src.p.n;
                            else if(fk==='pi'&&src.p)entry.pi=src.p.i;
                            else if(fk==='pt'&&src.p)entry.pt=src.p.t;
                            else if(fk==='pv'&&src.p)entry.pv=src.p.v;
                            else if(src[fk]!==undefined)entry[fk]=src[fk];
                        }else if(cat==='processor'){
                            if(fk==='inpK'&&src.inp)entry.inpK=src.inp.k;
                            else if(fk==='inpN'&&src.inp)entry.inpN=src.inp.n;
                            else if(fk==='outK'&&src.out)entry.outK=src.out.k;
                            else if(fk==='outN'&&src.out)entry.outN=src.out.n;
                            else if(fk==='outI'&&src.out)entry.outI=src.out.i;
                            else if(fk==='outV'&&src.out)entry.outV=src.out.v;
                            else if(src[fk]!==undefined)entry[fk]=src[fk];
                        }else if(cat==='achievement'){
                            if(fk==='cond'&&src.ch)entry.cond=String(src.ch).replace(/^function[^{]*\{|\}$/g,'').trim();
                            else if(src[fk]!==undefined)entry[fk]=src[fk];
                        }else if(cat==='event'){
                            if(fk==='efCode'&&src.ef)entry.efCode=String(src.ef).replace(/^function[^{]*\{|\}$/g,'').trim();
                            else if(src[fk]!==undefined)entry[fk]=src[fk];
                        }else{
                            if(src[fk]!==undefined)entry[fk]=src[fk];
                        }
                    }
                    draft[cat].push(entry);
                }
            }catch(e){notify('解析'+cat+'失败: '+e.message);}
        }
    }
    saveDraft(draft);
}

// ====== Init: hook into render cycle ======
var _renderAll = renderAll;
renderAll = function(){
    _renderAll();
    if(window._devMode)renderModEditor();
};

// Also hook tab switching to render mod editor
(function(){
    var tabs=document.getElementById("tabs");
    if(tabs){
        var _origClick = tabs.onclick;
        tabs.addEventListener("click",function(e){
            setTimeout(function(){
                if(window._devMode && document.getElementById("pmodedit") && document.getElementById("pmodedit").classList.contains("ac")){
                    renderModEditor();
                }
            },50);
        });
    }
})();

})();