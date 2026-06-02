// ============================================================
// tech-tree.js v4 — 动态区域宽度，首尾相接
// ============================================================
(function() {

var CARD_W=148,CARD_H=90,GAP_X=30,GAP_Y=24,ROOT_H=70,MARGIN=30;

function buildTechNodes(){
    var nodes=[],nodeMap={};
    function add(id,type,parents,extra){
        if(nodeMap[id])return;
        var def;
        if(type==="upgrade")def=DataRegistry.get("upgrade",id);
        else if(type==="gem")def=DataRegistry.get("gemUpgrade",id);
        else if(type==="research")def=DataRegistry.get("research",id);
        if(!def)return;
        var n={id:id,type:type,n:def.n,i:def.i||"?",d:def.d||def.desc||"",parents:parents||[],x:0,y:0};
        if(extra)for(var k in extra)n[k]=extra[k];
        if(type==="upgrade"){n.c=def.c;n.unlock=def.unlock||0;}
        else if(type==="gem"){n.c=def.c;n.gem=true;n.repeatable=def.repeatable;}
        else if(type==="research"){n.resCost=def.cost;}
        nodes.push(n);nodeMap[id]=n;return n;
    }
    var ui=DataRegistry.ids("upgrade");
    for(var i=0;i<ui.length;i++){var u=ui[i],d=DataRegistry.get("upgrade",u),p=[];if(d.reqUpgrade)p.push(d.reqUpgrade);add(u,"upgrade",p,{reqResearch:d.reqResearch||null,ef:d.ef});}
    var gi=DataRegistry.ids("gemUpgrade");
    for(var i=0;i<gi.length;i++){var g=gi[i],gd=DataRegistry.get("gemUpgrade",g),p=[];if(gd.req)p.push(gd.req);add(g,"gem",p,{ef:gd.ef,costGrowth:gd.costGrowth});}
    var ri=DataRegistry.ids("research");
    for(var i=0;i<ri.length;i++){var r=ri[i],rd=DataRegistry.get("research",r);add(r,"research",rd.requires||[],{resCost:rd.cost});}
    return{nodes:nodes,nodeMap:nodeMap};
}

// 布局一组节点，返回 {width, nodes(含x,y), edges}
function layoutGroup(nodes,nodeMap,allChildren){
    var depth={},queue=[];
    // 组内无parent → depth=0
    for(var i=0;i<nodes.length;i++){
        var n=nodes[i],has=false;
        for(var j=0;j<n.parents.length;j++){if(nodeMap[n.parents[j]]&&nodeMap[n.parents[j]].type===n.type){has=true;break;}}
        if(!has){depth[n.id]=0;queue.push(n.id);}
    }
    var qi=0;
    while(qi<queue.length){
        var pid=queue[qi++],kids=allChildren[pid]||[];
        for(var k=0;k<kids.length;k++){
            var nd=(depth[pid]||0)+1;
            if(depth[kids[k]]===undefined||nd>depth[kids[k]]){
                depth[kids[k]]=nd;
                var idx=queue.indexOf(kids[k]);if(idx>=0)queue.splice(idx,1);
                queue.push(kids[k]);
            }
        }
    }
    for(var i=0;i<nodes.length;i++){if(depth[nodes[i].id]===undefined)depth[nodes[i].id]=0;}

    // 按行分组
    var rows={};
    for(var i=0;i<nodes.length;i++){var d=depth[nodes[i].id];if(!rows[d])rows[d]=[];rows[d].push(nodes[i]);}
    var dkeys=Object.keys(rows).sort(function(a,b){return parseInt(a)-parseInt(b);});
    var colW=CARD_W+GAP_X,rowH=CARD_H+GAP_Y;

    // 计算最大行宽
    var maxW=0;
    for(var ri=0;ri<dkeys.length;ri++){
        var rn=rows[dkeys[ri]];rn.sort(function(a,b){return a.n.localeCompare(b.n);});
        var cnt=rn.length,totalW=cnt*colW-GAP_X;
        if(totalW>maxW)maxW=totalW;
    }

    // 以 maxW 为区域宽度，各行居中对齐
    for(var ri=0;ri<dkeys.length;ri++){
        var rn=rows[dkeys[ri]],cnt=rn.length,totalW=cnt*colW-GAP_X;
        var offsetX=(maxW-totalW)/2;
        for(var ci=0;ci<cnt;ci++){rn[ci]._col=offsetX+ci*colW+colW/2;rn[ci]._row=parseInt(dkeys[ri]);}
    }

    // 边
    var edges=[];
    for(var i=0;i<nodes.length;i++){
        var n=nodes[i];
        for(var j=0;j<n.parents.length;j++){
            var pn=nodeMap[n.parents[j]];
            if(pn)edges.push({from:pn,to:n});
        }
    }
    // 跨区虚线边（research→upgrade），稍后在全局处理

    return{maxW:maxW,rowH:rowH,rows:rows,dkeys:dkeys};
}

function layoutAll(nodes,nodeMap){
    var groups={upgrade:[],gem:[],research:[]};
    for(var i=0;i<nodes.length;i++)groups[nodes[i].type].push(nodes[i]);

    var allChildren={};
    for(var i=0;i<nodes.length;i++){
        var n=nodes[i];
        for(var j=0;j<n.parents.length;j++){
            var p=n.parents[j];
            if(!allChildren[p])allChildren[p]=[];
            if(allChildren[p].indexOf(n.id)===-1)allChildren[p].push(n.id);
        }
    }

    // 先独立布局三组
    var gk=["upgrade","gem","research"];
    var gl=[];
    for(var gi=0;gi<3;gi++)gl.push(layoutGroup(groups[gk[gi]],nodeMap,allChildren));

    // 首尾相接计算各区域起始X
    var startX=[],cx=MARGIN;
    var gap=60; // 区域间距
    for(var gi=0;gi<3;gi++){startX[gi]=cx;cx+=gl[gi].maxW+gap;}

    // 分配各节点的最终 x,y
    var startY=ROOT_H+MARGIN+30;
    var edgeList=[],rootEdges=[];
    for(var gi=0;gi<3;gi++){
        var g=gl[gi],gnodes=groups[gk[gi]];
        for(var i=0;i<gnodes.length;i++){
            gnodes[i].x=startX[gi]+gnodes[i]._col;
            gnodes[i].y=startY+gnodes[i]._row*g.rowH+g.rowH/2;
        }
        // 组内边
        for(var i=0;i<gnodes.length;i++){
            var n=gnodes[i];
            for(var j=0;j<n.parents.length;j++){
                var pn=nodeMap[n.parents[j]];
                if(pn&&pn.type===n.type)edgeList.push({from:pn,to:n});
            }
        }
        // 跨区虚线边
        for(var i=0;i<gnodes.length;i++){
            var n=gnodes[i];
            if(n.reqResearch&&nodeMap[n.reqResearch])edgeList.push({from:nodeMap[n.reqResearch],to:n,dashed:true,cross:true});
        }
        // 根连线
        var dk=g.dkeys;
        if(dk.length>0){
            var fr=g.rows[dk[0]];
            for(var fi=0;fi<fr.length;fi++)rootEdges.push({gi:gi,to:fr[fi]});
        }
    }

    // 根节点
    var roots=[];
    var rootDefs=[
        {n:"⬆ 升级",i:"⚙️",bc:"#ffb300",bg:"rgba(255,180,0,.15)"},
        {n:"💎 宝石",i:"💎",bc:"#ab47bc",bg:"rgba(171,71,188,.15)"},
        {n:"🔬 研究",i:"📖",bc:"#42a5f5",bg:"rgba(66,165,245,.15)"}
    ];
    for(var ri=0;ri<3;ri++){
        var rw=gl[ri].maxW,rd=rootDefs[ri];
        roots.push({n:rd.n,i:rd.i,x:startX[ri]+rw/2,y:MARGIN+ROOT_H/2,w:Math.min(rw-20,120),h:ROOT_H,bc:rd.bc,bg:rd.bg});
    }

    var maxY=startY;
    for(var i=0;i<nodes.length;i++){if(nodes[i].y>maxY)maxY=nodes[i].y;}
    return{
        nodes:nodes,edges:edgeList,roots:roots,rootEdges:rootEdges,
        width:cx,height:maxY+CARD_H/2+MARGIN+40
    };
}

function assignState(nodes){
    for(var i=0;i<nodes.length;i++){
        var n=nodes[i];
        if(n.type==="upgrade"){
            n.owned=!!GS.upgrades[n.id];n.available=!n.owned&&GS.totalCoinsEarned>=(n.unlock||0);n.locked=!n.owned&&!n.available;
            if(!n.locked){for(var j=0;j<n.parents.length;j++){if(!GS.upgrades[n.parents[j]]){n.locked=true;n.available=false;break;}}}
            if(!n.locked&&n.reqResearch){if(!GS.research||!GS.research.completed||GS.research.completed.indexOf(n.reqResearch)===-1){n.locked=true;n.available=false;}}
        }else if(n.type==="gem"){
            n.owned=n.repeatable?false:!!GS.gemUpgrades[n.id];n.available=!n.owned&&GS.gems>=n.c;n.locked=!n.owned&&!n.available;
            if(!n.locked){for(var j=0;j<n.parents.length;j++){if(!GS.gemUpgrades[n.parents[j]]){n.locked=true;n.available=false;break;}}}
        }else if(n.type==="research"){
            n.owned=!!(GS.research&&GS.research.completed&&GS.research.completed.indexOf(n.id)!==-1);
            n.available=false;n._lockReason="";
            if(!n.owned&&n.resCost){
                n.available=true;var missing=[];
                for(var rk in n.resCost){if((GS.inventory[rk]||0)<n.resCost[rk]){n.available=false;missing.push(rk);}}
                if(missing.length>0)n._lockReason="资源不足:"+missing.join(",");
            }
            n.locked=!n.owned&&!n.available;
            if(!n.locked){for(var j=0;j<n.parents.length;j++){var rc=GS.research&&GS.research.completed;if(!rc||rc.indexOf(n.parents[j])===-1){n.locked=true;n.available=false;n._lockReason="前置:"+((DataRegistry.get("research",n.parents[j])||{}).n||n.parents[j]);break;}}}
        }
    }
}

function renderTechTree(){
    var panel=document.getElementById("ptechtree");
    if(!panel||(" "+panel.className+" ").indexOf(" ac ")===-1)return;

    var data=buildTechNodes();
    var L=layoutAll(data.nodes,data.nodeMap);
    assignState(L.nodes);

    var sw=Math.max(1200,L.width),sh=Math.max(700,L.height);
    var h='<div class="cd" style="overflow:auto;max-height:72vh"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h3 style="margin:0">🌳 科技树</h3><div style="display:flex;gap:4px"><button class="bt sm" onclick="window._ttZoom(-0.2)" title="缩小">🔍−</button><button class="bt sm" onclick="window._ttZoom(0.2)" title="放大">🔍+</button><button class="bt sm rd" onclick="window._ttZoom(0)" title="重置">↺</button></div></div>';
    h+='<div id="ttZoomContainer" style="transform:scale('+(window._ttZoomLevel||1)+');transform-origin:0 0;transition:transform .2s;width:'+sw+'px;height:'+sh+'px">';
    h+='<div style="position:relative;width:'+sw+'px;height:'+sh+'px;min-width:100%">';

    // SVG
    h+='<svg id="ttSvg" style="position:absolute;top:0;left:0;width:'+sw+'px;height:'+sh+'px;pointer-events:none;z-index:0">';
    h+='<defs><marker id="arrh" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0,0 5,2 0,4" fill="#8b5a2b"/></marker></defs>';
    for(var ei=0;ei<L.edges.length;ei++){
        var e=L.edges[ei],x1=e.from.x,y1=e.from.y+28,x2=e.to.x,y2=e.to.y-28;
        var cl=e.cross?"tt-dashed":"";
        var sw2=e.cross?1.5:2,st=e.cross?"#555":"#6b4a2a",ds=e.cross?"6,4":"none";
        h+='<line class="tt-edge '+cl+'" data-from="'+e.from.id+'" data-to="'+e.to.id+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+st+'" stroke-width="'+sw2+'" stroke-dasharray="'+ds+'"'+'/>';
    }
    // 根连线用箭头
    for(var ri=0;ri<L.rootEdges.length;ri++){
        var re=L.rootEdges[ri],root=L.roots[re.gi];
        h+='<line class="tt-edge tt-rootedge" data-to="'+re.to.id+'" x1="'+root.x+'" y1="'+(root.y+root.h/2)+'" x2="'+re.to.x+'" y2="'+(re.to.y-28)+'" stroke="#444" stroke-width="2" marker-end="url(#arrh)"/>';
    }
    h+='</svg>';

    // 根节点
    for(var ri=0;ri<L.roots.length;ri++){
        var r=L.roots[ri],rl=r.x-r.w/2,rt=r.y-r.h/2;
        h+='<div class="tt-root" style="position:absolute;left:'+rl+'px;top:'+rt+'px;width:'+r.w+'px;height:'+r.h+'px;'
            +'border:2px solid '+r.bc+';border-radius:12px;background:'+r.bg+';z-index:2;'
            +'display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:bold;color:#ddd;font-size:.85em">'
            +'<div style="font-size:1.5em">'+r.i+'</div><div>'+r.n+'</div></div>';
    }

    // 节点
    for(var ni=0;ni<L.nodes.length;ni++){
        var n=L.nodes[ni],left=n.x-CARD_W/2,top=n.y-CARD_H/2;
        var bc="#555",bg="rgba(0,0,0,.35)",op="1",cur="";
        if(n.owned){bc="#ffd700";bg="rgba(255,215,0,.14)";}
        else if(n.available){bc="#66bb6a";bg="rgba(102,187,106,.12)";cur="cursor:pointer";}
        else if(n.locked){op="0.45";}
        var cost="";
        if(n.type==="upgrade"&&!n.owned)cost=n.c+"💰";
        else if(n.type==="gem"&&!n.owned)cost=(n.repeatable?"每次":"")+n.c+"💎";
        else if(n.type==="research"&&!n.owned&&n.resCost){var p=[];for(var ck in n.resCost)p.push(n.resCost[ck]+" "+ck);cost=p.join(" ");}
        var extra="";
        if(n.type==="gem"&&n.repeatable)extra='<div style="color:#ab47bc;font-size:.62em">∞</div>';
        else if(n.owned)extra='<div style="color:#66bb6a;font-size:.62em">✓</div>';
        else if(n.available)extra='<div style="color:#ffd700;font-size:.62em;white-space:nowrap;overflow:hidden;max-width:130px">'+cost+'</div>';
        else if(n.locked&&n.type==="research"&&n._lockReason&&n._lockReason.indexOf("资源不足")===0)extra='<div style="color:#ff9800;font-size:.6em;white-space:nowrap;overflow:hidden;max-width:130px">'+cost+'</div>';
        else extra='<div style="color:#555;font-size:.62em">🔒</div>';
        h+='<div class="tt-node" id="ttn-'+n.id+'" data-node-id="'+n.id+'"'
            +' onclick="window._ttNav(\''+n.id+'\',\''+n.type+'\')"'
            +' style="position:absolute;left:'+left+'px;top:'+top+'px;width:'+CARD_W+'px;height:'+CARD_H+'px;'
            +'border:2px solid '+bc+';border-radius:8px;background:'+bg+';opacity:'+op+';'+cur
            +'z-index:1;text-align:center;padding:3px 2px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1px;font-size:.66em;transition:box-shadow .15s,transform .15s;overflow:hidden"'
            +' title="'+n.d+(n._lockReason?'\n'+n._lockReason:n.locked?'\n\u524d\u7f6e\u672a\u6ee1\u8db3':'')+'"'
            +'>';
        h+='<div style="font-size:1.3em;line-height:1">'+n.i+'</div>';
        h+='<div style="font-weight:bold;color:#ffcc80;line-height:1.1">'+n.n+'</div>';
        h+=extra+'</div>';
    }

    h+='</div></div></div>';  // close inner, zoom container, outer
    panel.innerHTML=h;
    setTimeout(attachHover,100);
    enableDragScroll(panel.querySelector(".cd"));
}

function attachHover(){
    var svg=document.getElementById("ttSvg");if(!svg)return;
    var edges=svg.querySelectorAll(".tt-edge"),nodes=document.querySelectorAll(".tt-node");
    var conn={};
    for(var i=0;i<edges.length;i++){
        var e=edges[i],f=e.getAttribute("data-from"),t=e.getAttribute("data-to");
        if(f){if(!conn[f])conn[f]=[];if(conn[f].indexOf(t)===-1)conn[f].push(t);}
        if(t&&f){if(!conn[t])conn[t]=[];if(conn[t].indexOf(f)===-1)conn[t].push(f);}
    }
    function hl(id){
        var r=[id];if(conn[id])r=r.concat(conn[id]);
        for(var i=0;i<edges.length;i++){
            var e=edges[i],f=e.getAttribute("data-from"),to=e.getAttribute("data-to");
            var m=f?(r.indexOf(f)!==-1&&r.indexOf(to)!==-1):(r.indexOf(to)!==-1);
            e.setAttribute("stroke",m?"#ffd700":"#6b4a2a");
            e.setAttribute("stroke-width",m?"3":"2");
        }
        for(var i=0;i<nodes.length;i++){
            var n=nodes[i],nid=n.getAttribute("data-node-id");
            if(r.indexOf(nid)!==-1){n.style.boxShadow="0 0 16px rgba(255,215,0,.7)";n.style.transform="scale(1.06)";n.style.zIndex="5";}
        }
    }
    function ul(){
        for(var i=0;i<edges.length;i++){var e=edges[i];e.setAttribute("stroke","#6b4a2a");e.setAttribute("stroke-width","2");}
        for(var i=0;i<nodes.length;i++){nodes[i].style.boxShadow="";nodes[i].style.transform="";nodes[i].style.zIndex="1";}
    }
    for(var i=0;i<nodes.length;i++){nodes[i].addEventListener("mouseenter",function(){hl(this.getAttribute("data-node-id"));});nodes[i].addEventListener("mouseleave",ul);}
}

function enableDragScroll(el){
    if(!el)return;
    var dragging=false,startX=0,startY=0,scrollX=0,scrollY=0;
    el.addEventListener("mousedown",function(e){
        // Only drag on empty space (not on node cards, buttons, titles)
        if(e.target.closest(".tt-node")||e.target.closest(".bt")||e.target.closest("h3"))return;
        dragging=true;
        startX=e.clientX;startY=e.clientY;
        scrollX=el.scrollLeft;scrollY=el.scrollTop;
        el.style.cursor="grabbing";
        el.style.userSelect="none";
        e.preventDefault();
    });
    document.addEventListener("mousemove",function(e){
        if(!dragging)return;
        var dx=e.clientX-startX,dy=e.clientY-startY;
        el.scrollLeft=scrollX-dx;el.scrollTop=scrollY-dy;
    });
    document.addEventListener("mouseup",function(){
        if(dragging){dragging=false;el.style.cursor="";el.style.userSelect="";}
    });
    // Set grab cursor
    el.style.cursor="grab";
    // Touch support
    el.addEventListener("touchstart",function(e){
        if(e.target.closest(".tt-node")||e.target.closest(".bt")||e.target.closest("h3"))return;
        if(e.touches.length!==1)return;
        dragging=true;
        startX=e.touches[0].clientX;startY=e.touches[0].clientY;
        scrollX=el.scrollLeft;scrollY=el.scrollTop;
    },{passive:false});
    el.addEventListener("touchmove",function(e){
        if(!dragging)return;
        var dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;
        el.scrollLeft=scrollX-dx;el.scrollTop=scrollY-dy;
    },{passive:false});
    el.addEventListener("touchend",function(){dragging=false;});
}

window._ttZoomLevel=window._ttZoomLevel||1;
window._ttZoom=function(delta){
    if(delta===0){window._ttZoomLevel=1;}
    else{window._ttZoomLevel=Math.max(.4,Math.min(2.5,window._ttZoomLevel+delta));}
    var el=document.getElementById("ttZoomContainer");
    if(el)el.style.transform="scale("+window._ttZoomLevel+")";
};
window._ttNav=function(id,type){
    var t;if(type==="upgrade")t="upgrades";else if(type==="gem")t="prestige";else if(type==="research")t="research";
    if(t){var b=document.querySelector('#tabs [data-pn="'+t+'"]');if(b)b.click();}
};

function addTab(){
    var tabs=document.getElementById("tabs");if(!tabs)return setTimeout(addTab,500);
    if(document.getElementById("tabTechTree"))return;
    var btn=document.createElement("button");btn.className="tb";btn.id="tabTechTree";btn.setAttribute("data-pn","techtree");btn.textContent="🌳 科技树";
    var ut=tabs.querySelector('[data-pn="upgrades"]');if(ut&&ut.nextSibling)tabs.insertBefore(btn,ut.nextSibling);else tabs.appendChild(btn);
    var p=document.createElement("div");p.className="pn";p.id="ptechtree";(document.getElementById("pf")?.parentNode||document.body).appendChild(p);
}
function init(){
    addTab();
    var _ra=window.renderAll||function(){};
    window.renderAll=function(){_ra();if(typeof renderTechTree==="function")renderTechTree();};
    var tabs=document.getElementById("tabs");
    if(tabs)tabs.addEventListener("click",function(){setTimeout(function(){
        var at=tabs.querySelector(".tb.ac");
        if(at&&at.getAttribute("data-pn")==="techtree"){
            var ap=document.querySelectorAll(".pn");for(var pi=0;pi<ap.length;pi++)ap[pi].classList.remove("ac");
            var tp=document.getElementById("ptechtree");if(tp)tp.classList.add("ac");renderTechTree();
        }
    },50);});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
// ========== 移动端手风琴模式 ==========
function renderTechTreeMobile(){
    var panel=document.getElementById("ptechtree");
    if(!panel||(" "+panel.className+" ").indexOf(" ac ")===-1)return;

    var data=buildTechNodes();
    assignState(data.nodes);

    var groups={upgrade:[],gem:[],research:[]};
    for(var i=0;i<data.nodes.length;i++){
        var n=data.nodes[i];
        if(groups[n.type])groups[n.type].push(n);
    }

    var groupNames={upgrade:"⬆ 升级科技",gem:"💎 宝石祭坛",research:"🔬 研究项目"};
    var ownedCount={upgrade:0,gem:0,research:0},totalCount={upgrade:0,gem:0,research:0};
    for(var gk in groups){
        totalCount[gk]=groups[gk].length;
        for(var i=0;i<groups[gk].length;i++){if(groups[gk][i].owned)ownedCount[gk]++;}
    }

    var h='<div class="cd"><h3>🌳 科技树</h3>';
    var gks=["upgrade","gem","research"];
    for(var gi=0;gi<gks.length;gi++){
        var gk=gks[gi],gnodes=groups[gk];
        var depthMap={};
        for(var i=0;i<gnodes.length;i++){
            var d=0,cur=gnodes[i];
            while(cur.parents&&cur.parents.length>0){
                var found=false;
                for(var j=0;j<gnodes.length;j++){if(gnodes[j].id===cur.parents[0]){cur=gnodes[j];d++;found=true;break;}}
                if(!found)break;
            }
            depthMap[gnodes[i].id]=d;
        }
        gnodes.sort(function(a,b){return (depthMap[a.id]||0)-(depthMap[b.id]||0);});

        h+='<div class="cd" style="margin:4px 0;cursor:pointer" onclick="var ul=this.nextElementSibling;ul.style.display=ul.style.display===\'none\'?\'\':\'none\';">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center">';
        h+='<strong>'+groupNames[gk]+'</strong>';
        h+='<span style="color:#888;font-size:.8em">'+ownedCount[gk]+'/'+totalCount[gk]+'</span>';
        h+='</div></div>';

        h+='<div style="padding:4px 0 4px 12px">';
        for(var i=0;i<gnodes.length;i++){
            var n=gnodes[i];
            var indent=depthMap[n.id]||0;
            var prefix="";
            for(var s=0;s<indent;s++)prefix+="|  ";
            if(indent>0)prefix+="|- ";

            var color="#888";
            if(n.owned)color="#66bb6a";
            else if(n.available)color="#ffd700";

            var cost="";
            if(!n.owned){
                if(n.type==="upgrade")cost=" "+n.c+"💰";
                else if(n.type==="gem")cost=" "+(n.repeatable?"每次":"")+n.c+"💎";
                else if(n.type==="research"&&n.resCost){var p=[];for(var ck in n.resCost)p.push(n.resCost[ck]+ck);cost=" "+p.join(" ");}
            }else{cost=" ✓";}

            h+='<div onclick="event.stopPropagation();window._ttNav(\''+n.id+'\',\''+n.type+'\')"'
                +' style="padding:5px 4px;font-size:.78em;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:6px;'
                +(n.available?'cursor:pointer':'')+';'+(n.locked?'opacity:.4':'')+'"'
                +'>';
            h+='<span style="font-family:monospace;color:#555;white-space:nowrap">'+prefix+'</span>';
            h+='<span>'+n.i+'</span><span style="color:'+color+'">'+n.n+'</span>';
            h+='<span style="margin-left:auto;font-size:.7em;color:'+color+'">'+cost+'</span>';
            h+='</div>';
        }
        h+='</div>';
    }
    h+='</div>';
    panel.innerHTML=h;
}

})();
