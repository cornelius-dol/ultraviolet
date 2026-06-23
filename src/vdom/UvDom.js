// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/// Ultraviolet vDOM API
/// ====================================================================================================================
///
/// A virtual DOM engine which is minimalist, self-contained, and fail-fast for common mistakes.
///
/// Strictly speaking, the only APIs which are necessary to write Ultraviolet applications and components are
/// {{#define|function-define-tag-atr-chn}} and {{#update|function-update-vew-nod}}. For an in-depth understanding of
/// Ultraviolet usage please refer to the {{@Ultraviolet Programmer Guide|2.Ultraviolet Programmer Guide}}.
///
/// <span class="status-stable">Module Status: </span>
///
/// Functions:
///
///   - {{#define   | function-define-tag-atr-chn}}
///   - {{#island   | function-island-vew-tgt}}
///   - {{#update   | function-update-vew-nod}}
///   - {{#render   | function-render-vew-nod}}
///   - {{#dataOf   | function-dataof-obj-anc}}
///   - {{#insights | function-insights-val}}
///
/// ###### Module Construction
///
/// ````
/// const uvDom     = new UvDom({ name: "Examples" })
/// ````
///
/// ###### Module Config
///
/// All config values are optional.
///
/// Property        | Type          | Description
/// ----------------|---------------|-----------------------------------------------------------------------------------
/// name            | String        | The name of the UI being rendered for errors and debugging.
/// document        | Object        | The document for which DOM nodes will be created. Defaults to global `document`.
/// log             | function      | A function to use for logging. Defaults to `console.log` with a bound prefix.
/// debounce        | Number        | Update debounce time in ms; must be > 0, defaults to 8ms.
/// printNode       | function      | A function to use for printing a node for logging and debugging.
///
/// <span class="since">1.00</span>

function UvDom(cfg)
{ "use strict"; const EXPORTED={}; function exported(v,n){EXPORTED[n]=v;}
//**********************************************************************************************************************

const   doc         = cfg?.document  ?? document
,       idn         = Math.random().toString(36).slice(2,12)
,       log         = cfg?.log       ?? console.log.bind(console,"["+(cfg?.name ?? "UVDOM-" + idn)+"]")
,       dom         = cfg?.printNode ?? (obj=>obj)
,       dbn         = cfg?.debounce  ?? 8

//**********************************************************************************************************************

// ALIASES FOR CODE BREVITY
const   keys        = Object.keys
,       B           = ""
,       F           = false
,       N           = null
,       T           = true
,       U           = undefined
// RENDER ACTIONS / INSIGHT KEYS
,       ATC         = "attach"
,       CRT         = "create"
,       INS         = "insert"
,       RMV         = "remove"
,       RND         = "render"
,       RTN         = "retain"
// SPECIAL UV CONSTANTS
,       HTM         = "http://www.w3.org/1999/xhtml"                                                                    // HTML5 namespace
,       MSN         = Number.MAX_SAFE_INTEGER                                                                           // max serial number for components; rollover to 1 after this
,       NLA         = "\n  =>"                                                                                          // newline + arrow for logging
,       PRP         = new Set(["checked","selected","value"])                                                           // attributes which need to be set as properties
,       SPC         = new Set([CRT,INS,RMV,RND,"debug","data"])                                                         // special uv attributes
// NODE CREATORS
,       cNode       = node("Comment")
,       eNode       = node("ElementNS")
,       tNode       = node("TextNode");

let     dio         = N                                                                                                 // debugging insight object (testing/debugging only)
,       srl         = 0;                                                                                                // component serial number

//**********************************************************************************************************************
// DESCRIBE
//**********************************************************************************************************************

/// Define a vDOM element.
///
/// **Arguments & Return:**
///
///     tag (string)        The DOM element tag name (e.g. div, span, p, ...).
///     atr (object)        An object containing the attributes of this vDOM element..
///     chn                 A value or array of children of this element.
///     =>                  A vDOM structure describing this element.
///
/// An element vDOM is a relatively simple structure that declaratively represents what the browser DOM should look
/// like. Ultraviolet makes no changes to the returned structure while rendering (though the `$uv` property is directly
/// transferred to the DOM element) so they can be frozen, memoized, and reused.
///
/// The tag name can be used to specify an `id` and `class` value using CSS-style notation of `tag#id.class.class2...`.
/// If specified, the ID must immediately follow the tag. If an ID is also specified as an attribute the attribute will
/// override that specified in the tag. If a class value is also specified as an attribute it will be appended to any
/// classes specified in the tag.
///
/// Attributes with names starting '`$`' are transferred to the `$uv` structure in the generated vDOM. Any `onxxx` event
/// handlers are transferred to `$uv.onx` and when the vDOM is rendered an event listener will be added to invoke the
/// supplied handler.
///
/// The `class` attribute value can be specified using CSS-style notation as in the tag, which is useful if adopted for
/// the entire code base as it allows searching for `.class-name` and finding all occurrences in both CSS and code.
///
/// Styles can be specified as either a string or an object; the properties of the object are "kebab-cased" at the
/// location of any uppercase letters, and the entire name will be converted to lowercase — for example, the mixed case
/// `zIndex` value will be changed to `z-index`.
///
/// Event handlers are specified as a specially formed object using `{ f: function, a: argument(s) }`. If no arguments
/// are required then the value can just be the function reference without using an object.
///
/// Sanity checks are made for common programming errors to detect malformed views early, before rendering.
///
/// The returned structure should not be modified, and doing so *will* result in code that is brittle in the face of
/// future updates to this library. Do so at your own risk; while not prohibited, it is discouraged and should be done
/// as a solution of last resort.
///
/// **WARNING**: For the sake of efficiency, Ultraviolet marks a difference between attributes which are absent and
/// those which are present but null. The set of attributes present in the vDOM contribute to the element's signature
/// and a change in the set of present attributes will cause a re-creation of the DOM element. This means that to remove
/// an attribute from the rendered element without replacing the element, it must be set to `null` in the vDOM, not
/// omitted or specified as `undefined`.
///
/// **WARNING**: Attribute values of `true` and `false` are special-cased to mean presence with a blank value, and
/// absence, with a null value. This is to support boolean attributes such as `disabled`, `checked`, and `selected`
/// which are represented in HTML by their presence or absence. To explicitly set an attribute to the string values
/// `"true"` or `"false"`, use those string values, as is required for enumerated attributes such as `aria-checked` or
/// `draggable`.
///
/// <span class="since">1.00</span>
exported(define,"define");
function define(tag,atr,chn) {
    if(chn===U && !stc(atr)) { chn = atr; atr =   {}; }                                                                 // allow attributes to be omitted
    else                     {            atr ??= {}; }

    type(str(tag),"tag",tag);                                                                                           // check type of tag
    type(stc(atr),"atr",atr);                                                                                           // check type of attributes
    chn = (chn===U ? [] : !arr(chn) ? [chn] : chn);                                                                     // coerce children to an array

    let $uv = { nid  : "" }                                                                                             // want the nid to consistently show first when debugging
    ,   tmp = { class: U  }
    ,   idx;

    if((idx = tag.indexOf("."))!=-1) { tmp.class = dCls(tag.slice(idx+1)); tag = tag.slice(0,idx); }
    if((idx = tag.indexOf("#"))!=-1) { tmp.id    = tag.slice(idx+1);       tag = tag.slice(0,idx); }

    tag ||= "div";
    atr = dAtr(atr,tmp,$uv);                                                                                            // including adding atr keys to nid
    chn = dChn(chn,[] ,$uv);
    $uv.nid = tag + ":" + (atr.id||B) + ":class" + (atr.id ? ",id" : B) + $uv.nid;
    return { tag, atr, chn, $uv };
    }

function dAtr(src,tgt,$uv) {
    let key, k0, val;

    for(key of keys(src)) {
        k0  = key[0];
        val = src[key];
        if(k0==="$") {
            if(!SPC.has(key.slice(1))) { throw new Error(`Unsupported attr '${key}'`); }
            tgt[key] = val;
            }
        else if(k0==="o" && key[1]==="n") {
            if(val!==U) {
                type(val===N || fnc(val) || fnc(val?.f),"Event handler",val);
                tgt[key] = val;
                }
            }
        else if((val = dVal(val))!==U) {
            tgt[key] = val===N || val===F ? N
            :          val===T            ? B
            :          key==="class"      ? dCls(val,tgt.class)                                                         // tgt.class is the current value, extracted from tag
            :          key==="style"      ? dSty(val)
            :                               ""+val;
            }
        val!==U && ($uv.nid += "," + key);                                                                              // attribute keys included because rerender will not remove attributes from prior rendering
        }
    return tgt;
    }

function dChn(src,tgt,$uv) {
    for(let chl of src) {
        if(arr(chl)) {
            dChn(chl,tgt,$uv);                                                                                          // transparently flatten nested arrays
            }
        else {
            type(!fnc(chl),"View Child",chl);
            chl = dVal(chl,T);
            type(!stc(chl),"View Child",chl);
            chl!==U && tgt.push(chl);                                                                                   // drop undef children, keep NULL
            }
        }
    return tgt;
    }

function dCls(val,cur) {
    val = (""+val).replaceAll("."," ").trim();
    return (cur ? (cur + " " + val) : val) || U;
    }

function dSty(sty) {
    if(stc(sty)) {
        let txt = B;
        for(let key of keys(sty)) {
            let val = dVal(sty[key]);
            val!=N && (txt += kebab(key) + ":" + val + ";");
            }
        sty = txt;
        }
    return sty;
    }

function dVal(val,chl) {
    return ( chl && fnc(val?.$dom?.$s) ? val.$dom.$s
        :    fnc(val?.valueOf)         ? val.valueOf()
        :                                val);
    }

//**********************************************************************************************************************
// UPDATE
//**********************************************************************************************************************

/// Create an asynchronous, coalescing, view-update function, given a view generator function.
///
/// **Arguments & Return:**
///
/// -------|------------|-----------------------------------------------------------------------------------------------
/// vew    | function   | A virtual-DOM generator function which returns a structure describing some DOM.
/// nod    | Element    | An existing DOM element to replace — shortcut for `update(vew).mount(nod)`. Optional.
/// =>     | function   | A view-updater which manages updating a DOM node based on view; called to update the DOM with a view.
///
/// If the optional DOM node is supplied, the updater replaces that node on first render. If omitted, the updater
/// renders into a detached node on first call; use `.mount()` to attach it to the DOM later.
///
/// ###### Node Identity
///
/// Every DOM node created by Ultraviolet is stamped with the identity of the updater that created it. During
/// reconciliation, an updater will only reuse nodes bearing its own stamp — preventing cross-updater node theft.
/// Each updater receives a unique identity at creation time.
///
///   - A **root** updater (via `update(vew,nod)` or `.mount()`) replaces a DOM node and renders immediately.
///   - An **island** updater (via `island(vew,tgt)`) stamps the target object for use as a composable child.
///   - A **patch** updater (via `.patch()`) adopts the identity of the node it patches.
///
/// The view-updater defers update to the system event queue via setTimeout(). Multiple calls to the view-updater made
/// between event processing will result in a single update being queued, so hundreds of state updates can individually
/// request an update in rapid succession without spamming the event queue. This also debounces the updates at 8ms, and
/// when the tab is not visible, updates may be throttled or paused altogether. The custom render subfunction allows any
/// queuing mechanism be used. This throttling is by design; Ultraviolet is intended to drive UIs, not animations.
///
/// <span class="since">1.00</span>
///
/// ###### Updater API:
///
/// Updater API functions are properties of the returned updater function.
///
/// **custom(fnc)**
///
/// Triggers a custom update.
///
/// <span class="since">1.00</span>
///
/// --------------------|-----------------------------------------------------------------------------------------------
/// fnc                 | The supplied function. If omitted no action is taken.
/// =>                  | Whether a custom update is pending.
///
/// This allows an application supplied function to invoke the update according to some arbitrary rule. The supplied
/// function will be immediately invoked with a single argument, being an internal function to render the DOM. When
/// *that* function is invoked, the DOM will be updated. Usually the supplied function will be `requestAnimationFrame`,
/// resulting in an expedited update. A simple immediate update can be achieved with `(f)=>f()`. The queued function
/// will ignore any arguments and return `undefined`.
///
/// **mount(nod)**
///
/// Mounts the view as a root, replacing the given DOM node and rendering immediately. Can be called again to
/// retarget the updater to a different node; pass `null` to dismount.
///
/// --------------------|-----------------------------------------------------------------------------------------------
/// nod                 | The DOM node to replace.
/// =>                  | The updater function.
///
/// The shortcut `update(vew, nod)` is equivalent to `update(vew).mount(nod)`.
///
/// <span class="since">1.00</span>
///
/// **patch(nod)**
///
/// Binds the updater as a guest patcher of an existing UV node. The updater adopts the node's identity so that
/// subsequent renders patch in place without conflicting with the parent's reconciliation. This is directly usable
/// as a `$create` or `$insert` action handler.
///
/// --------------------|-----------------------------------------------------------------------------------------------
/// nod                 | An existing *UV-rendered* DOM node.
/// =>                  | The updater function.
///
/// A patch updater can only be bound once — the updater must not already have a node.
///
/// Usage:
///
///     vw("section.status", { $create: updateUI.patch }, [...])
///
/// <span class="since">1.00</span>
exported(update,"update");
function update(vew,nod) {
    let $q  = (/* ignore args and return undef; so usable as a PGS callback */) => {                                    // queue update
            if(!rip) { rip = T; setTimeout($r,dbn) }
            }
    ,   $r  = (/* ignore args and return undef so usable by setTimeout/requestAnimationFrame/queueMicrotask. */) => {   // expedited rendering
            $s(nod?.parentNode);
            }
    ,   $s  = (p) => {                                                                                                  // subview function for normal rendering
            if(!nod || rip) { nod = rNod(cbkV(vew),p,nod,rdi) }
            crq = rip = F;
            return nod;                                                                                                 // never NULL!
            }
    ,   rdi = idn + "-" + (srl = (srl%MSN) + 1)                                                                         // unique identity for isolation
    ,   crq = F                                                                                                         // custom render queued
    ,   rip = F;                                                                                                        // render is pending

    $q.mount = (n) => {
        if(n!==nod) {
            rAcn(RMV,nod,nod?.parentNode);
            nod?.remove();                                                                                              // remove existing view node from DOM
            nod = n;
            nod && (rip = T, $r());                                                                                     // render onto tgt immediately
            }
        return $q;
        };
    $q.patch = (n) => {                                                                                                 // make this a patcher; directly usable as action handler
        if(nod)          { throw Error("Already patching")  }
        if(!n?.$uv?.rdi) { throw Error("Requires UV node"); }
        nod = n;
        rdi = n.$uv.rdi;                                                                                                // adopt host's identity
        return $q;
        };
    $q.custom = (q) => {
        if(q && !crq) { crq = rip = T; q($r) }
        return crq;
        };
    $q.$s = $s;
    return $q;
    }

/// Create an asynchronous, coalescing, view-update function which makes the target object a composable island. Once
/// called, the target object can be directly provided as a child to any view and will be rendered as an isolated
/// component. This is the primary way to create reusable, self-managing view components.
///
/// Islands manage their own rendering independently of the parent that includes them. The parent cannot descend into
/// an island's subtree, and re-rendering the parent leaves the island's content untouched.
///
/// **Arguments & Return:**
///
/// -------|------------|-----------------------------------------------------------------------------------------------
/// vew    | function   | A virtual-DOM generator function which returns a structure describing some DOM.
/// tgt    | object     | The target object to stamp (usually the component's EXPORTED object).
/// =>     | function   | A view-updater; refer to {{#update|function-update-vew-nod}}.
///
/// <span class="since">1.00</span>
exported(island,"island");
function island(vew,tgt) { return (tgt.$dom = update(vew)); }

//**********************************************************************************************************************
// RENDER
//**********************************************************************************************************************

/// Materialize a vDOM structure into a DOM node tree. Returns the root node directly.
///
/// This is a low-level diagnostic function. Most applications should use {{#update|function-update-vew-nod}} which
/// provides lifecycle management, coalesced rendering, and composable islands. This function is useful for:
///
///   - Unit testing view functions without updater ceremony.
///   - Inspecting the DOM output of a vDOM structure during debugging.
///   - Generating detached DOM fragments for use outside the Ultraviolet lifecycle.
///
/// When a target node is provided, reconciliation occurs identically to an updater render — this can be used to
/// verify reconciliation behavior in tests.
///
/// **Arguments & Return:**
///
/// --------|-----------|-----------------------------------------------------------------------------------------------
/// vew     | object    | A virtual-dom structure describing some DOM.
///  "      | function  | A virtual-dom producer which returns a structure describing some DOM.
/// nod     | Element   | An existing DOM element to reconcile against. Optional.
/// =>      | Element   | A DOM node tree.
///
/// <span class="since">1.00</span>
exported(render,"render");
function render(vew,nod) {
    return rNod(cbkV(vew),nod?.parentNode,nod,nod?.$uv?.rdi ?? idn);
    }

function rNod(vdm,par,ond,rdi,dbg) {
    let $uv = vdm?.$uv
    ,   sid = ond?.$uv?.rdi===rdi                                                                                       // same id?
    ,   nod = sid ? ond : U                                                                                             // must not reuse nod from another renderer!!
    ,   opa = ond?.parentNode
    ,   cpt, isg, nsp;

    try {
        if(dbg ||= vdm?.atr?.$debug) {                                                                                  // activate debugs (assignment intentional)
            insights((isg = insights()) || {});                                                                         // inherit parent's insights (assignment intentional)
            logD(dbg,"RND",NLA,"VDM:",vdm,NLA,"Par:",dom(par),NLA,"OPa:",dom(opa),NLA,"ONd:",dom(ond));
            }

        // CREATE/UPDATE NODE ******************************************************************************************

        if(vdm==N) {                                                                                                    // comment placeholder (catches undefined as well, from component root)
            if(nod?.nodeType!==doc.COMMENT_NODE) {
                nod = cNode(rdi,B);
                }
            }
        else if(cpt = fnc(vdm)) {                                                                                       // component (assignment intentional)
            nod = vdm();                                                                                                // return NULL not permitted
            nod.$uv ??= {};                                                                                             // mark node from foreign component
            }
        else if($uv) {                                                                                                  // element vdom
            // NB: Cannot assign nod.$uv yet because `nod` might be the same as `ond`, and we need the old $uv for
            // removing event handlers.
            $uv = { ...$uv, rdi };                                                                                      // always copy $uv structure for the DOM node
            (nsp = vdm.atr.xmlns)===U && (nsp = par && par.namespaceURI!==U ? par.namespaceURI : HTM);                  // default to HTML5 namespace
            if(!nod || nod.namespaceURI!==nsp || nod.$uv?.nid!==$uv.nid || nod.$uv?.rdi!==rdi) {
                nod = eNode(rdi,nsp,vdm.tag);                                                                           // create replacement element
                }
            rAtr(nod,sid ? ond : U,vdm.atr,$uv,dbg);
            rChn(nod,sid ? ond : U,vdm.chn,rdi,dbg);
            nod.$uv = $uv;                                                                                              // must assign nod.$uv after rAtr which needs the old $uv
            nod!==ond && rAcn(CRT,nod,par,dbg,T);                                                                       // create action (only for elements, the only nodes than can have handlers)
            }
        else if(nod?.nodeType!==doc.TEXT_NODE) {                                                                        // new text node
            nod = tNode(rdi,vdm);
            }
        else if(nod.data!==vdm) {                                                                                       // existing text node
            nod.data = vdm;                                                                                             // NB: do not confuse the text node data with $uv.data from $data
            }

        // DOM MANIPULATIONS *******************************************************************************************
        //
        // NB: The rAcn triggers are important because application code uses them to know when nodes are inserted and
        // removed from the DOM tree. They will then take actions based upon that to potentially add/remove listeners,
        // observers, etc.
        //
        // NB: I can find no documented way to move a node from one DOM child slot to another without implicitly
        // removing it from the old slot, with all that entails, and reinserting to the new slot. If we could, we'd be
        // able to avoid calling the rendering-actions when a node is moved, and that would be well worthwhile.
        //
        // NB: Only Element has replaceNode(withNode), so we use par.replaceChild() due to comment and text nodes.

        if(par) {                                                                                                       // parent may be NULL for a page or component root node
            if(par!==opa || !ond) {                                                                                     // new parent, and/or new child
                ond && rAcn(RMV,ond,opa,dbg);                                                                           // old node either dropped or about to be moved to new parent
                par.appendChild(nod);
                rAcn(INS,nod,par,dbg);
                }
            else if(nod!==ond) {                                                                                        // same parent, new child; updated in place
                if(nod.parentNode===par) {                                                                              // already a (later) child of this parent
                    let cmt = cNode(rdi,B);
                    rAcn(RMV,nod,par,dbg);
                    par.replaceChild(cmt,nod);                                                                          // replace with comment to maintain DOM structure
                    rAcn(INS,cmt,par,dbg);
                    }
                rAcn(RMV,ond,opa,dbg);                                                                                  // old node will be implicitly removed
                par.replaceChild(nod,ond);                                                                              // NB only Element has replaceNode(withNode);
                rAcn(INS,nod,par,dbg);                                                                                  // node (re)inserted
                }
            }

        // RENDERING COMPLETE ******************************************************************************************

        !cpt && rAcn(RND,nod,par,dbg,T);                                                                                // after children also rendered (don't count subcomponent root nodes twice)

        if(dbg) {
            logD(dbg,"OPS",JSON.stringify(insights()));
            !isg && insights(N);
            }
        return nod;
        }
    catch(err) {
        logE(err,"RND",{vdm,nod,par,ond,opa});
        return N;
        }
    }

// NB: Cannot measure any benefit in any browser to justify explicitly removing event handlers on acn=RMV
function rAcn(acn,nod,par,dbg,frc) {
    if(nod && (frc || nod.isConnected)) {                                                                               // frc=false, true for INS/RMV and recursion
        logD(dbg,"Node",acn,dom(nod),"Parent:",dom(par),"Owner:",nod.ownerDocument);
        acn!==CRT && note("dom",acn);                                                                                   // creations tallied separately in node(typ)
        if(nod.nodeType===doc.ELEMENT_NODE) {
            let hdl = nod.$uv?.[acn];
            if(hdl) {
                logD(dbg,"DOH",acn,NLA,"Nod:",dom(nod),NLA,"Par:",dom(par),NLA,"Fnc:",hdl.name);
                note("hnd",acn);
                cbkH(hdl,nod,par);
                }
            if(!frc || acn===INS || acn===RMV) for(let chl = nod.firstChild; chl; chl = chl.nextSibling) {              // recursively invoke $insert/$remove on children
                if(chl.$uv) { rAcn(acn,chl,nod,dbg,T); }
                }
            }
        }
    }

function rAtr(nod,ond,atr,$uv,dbg) {
    let htm = nod.namespaceURI===HTM                                                                                    // for HTML5 namespace may be null/undefined
    ,   sam = nod===ond                                                                                                 // same node as previously rendered
    ,   oox = ond?.$uv?.onx                                                                                             // old onxxx
    ,   key, k0, val, tmp;

    if(oox) {
        let oeh = ond?.$uv?.event;
        for(key of keys(oox)) {
            if(oox[key] && (!sam || !atr[key] || oeh!==cbkE)) {
                ond.removeEventListener(key.slice(2),oeh);
                note("evt",RMV);
                logD(dbg,"EVH",RMV,key,"=>",oox[key].name);
                oox[key] = N;                                                                                           // so we don't have to recheck oeh below when adding listener
                }
            }
        }

    for(key of keys(atr)) {
        k0  = key[0];
        val = atr[key] ?? N;                                                                                            // ensure null or non-null, never undefined per spec for getAttribute()
        logD(dbg,"ATR",key,"=",val);
        if(k0==="$") {
            $uv[key.slice(1)] = val;
            }
        else if(k0==="o" && key[1]==="n") {
            if(val) {
                if(!sam || !oox?.[key]) {
                    nod.addEventListener(key.slice(2),cbkE);
                    tmp = ATC;
                    }
                else {
                    tmp = RTN;
                    }
                ($uv.onx ??= {})[key] = val;
                note("evt",tmp);
                logD(dbg,"EVH",tmp,key,"=>",(val.f?.name ?? val.name));
                }
            }
        else {
            htm && (key = kebab(key));                                                                                  // kebab-case for HTML attributes
            if(val!==nod.getAttribute(key)) {                                                                           // strict check correct; any difference signals to set attribute.
                if(val===N) {                                                                                           // val never undefined; see above
                    nod.removeAttribute(key);
                    note("atr",RMV);
                    }
                else {
                    key==="style" ? (nod.style.cssText = val) : nod.setAttribute(key,val);
                    note("atr",CRT);
                    }
                }
            if(htm && PRP.has(key)) {                                                                                   // special handling for some HTML attributes
                tmp = nod[key];
                val = is(tmp,Boolean) ? (val!==N && val!==F) : (val ?? B);                                              // normalize for boolean or text
                if(tmp!==val) {
                    let sel;
                    if(key==="value") try {
                        // The spec requires that reading nod.selectionStart/selectionEnd will throw DOMException for
                        // inputs that don't support text selection try/catch needed to avoid throwing.
                        sel = nod.selectionStart;
                        }
                    catch {
                        // Silent catch & discard appropriate because:
                        //   1. The only expected exception is well-documented.
                        //   2. Any other exception would indicate a state where the selection API is broken.
                        //   3. Value of sel is already undefined.
                        }
                    nod[key] = val;
                    sel!=N && (nod.selectionStart = nod.selectionEnd = sel);                                            // prevent cursor jumping to the end of the field when value is updated
                    note("atr","property");
                    }
                }
            }
        }
    $uv.onx && ($uv.event = cbkE);                                                                                      // event function needed for removing event listeners
    }

function rChn(par,opa,chn,rdi,dbg) {
    let ond = opa?.firstChild ?? N
    ,   nxt;

    if(!chn.length && ond?.$uv?.rdi!==rdi) { return; }                                                                 // foreign-owned container; skip reconciliation

    for(let vdm of chn) {
        logD(dbg,"CHL",vdm,"DOM:",dom(ond));
        par!==opa && (nxt = ond?.nextSibling ?? N);                                                                     // must get next child before making dom changes
        let nod = rNod(vdm,par,ond,rdi,dbg);
        ond     = !nxt ? (nod?.nextSibling ?? N) : nxt;                                                                 // for same parent nod is always prior to the desired next node to update
        }

    while(ond) {
        nxt = ond.nextSibling ?? N;                                                                                     // must get next child before any dom changes
        rAcn(RMV,ond,opa,dbg);                                                                                          // must be before disconnecting from dom
        opa.removeChild(ond);
        ond = nxt;
        }
    }

//**********************************************************************************************************************
// MISCELLANEOUS
//**********************************************************************************************************************

/// Get the data attached to a DOM node.
///
/// **Arguments & Return:**
///
///     obj (object)        A DOM node or vDOM object.
///     anc (boolean)       Optional flag to search for nearest ancestor with data attached. Valid only for DOM nodes.
///     =>                  The data, or `undefined` if no data was found.
///
/// This allows the arbitrary data which was attached to a node when the view was defined to be extracted from the
/// element without exposing Ultraviolet internals which are subject to change in future versions.
///
/// <span class="since">1.00</span>
exported(dataOf,"dataOf");
function dataOf(obj,anc) {
    // OK to ignore the possibility of a node loop since these will always be DOM or vDOM nodes.
    if(anc) while(obj && obj.$uv?.data===U) { obj = obj.parentNode; }
    return obj?.$uv?.data ?? obj?.atr?.$data ?? U;
    }

/// Get or set the current degugging insights collector.
///
/// **Arguments & Return:**
///
///     val (object)        An insight collector object. Usually a empty object literal, or NULL to disable insights.
///     =>                  The current insight collector.
///
/// **NB:** This is a developer diagnostic aid, and the counters are subject to revision — it *MUST NEVER* be depended
/// upon by application logic.
///
/// Debugging insights track how many times specific operations are invoked. They can be used during development to
/// detect aberrant vDOM definitions that result in unstable DOM or excessive DOM manipulations. An insight collector is
/// automatically installed and reported to the console by any elements which have their debug flag set.
///
/// <span class="since">1.00</span>
exported(insights,"insights");
function insights(val) {
    if(val!==U) {
        if(val!==N) for(let key of [ "atr","dom","hnd","nod","evt" ]) { val[key] ??= {}; }
        dio = val;
        }
    return dio;
    }

//**********************************************************************************************************************
// PRIVATE - TYPE CHECKING -- HEAVILY USED; MUST BE AS EFFICIENT AS POSSIBLE
//**********************************************************************************************************************

function is(val,ctr) { return val?.constructor===ctr; }
function arr(val)    { return is(val,Array   );                          }
function fnc(val)    { return is(val,Function);                          }
function stc(val)    { return is(val,Object  ) && !val.$uv && !val.$dom; }
function str(val)    { return is(val,String  );                          }

//**********************************************************************************************************************
// PRIVATE - UTILITY
//**********************************************************************************************************************

function cbkE(evt) {
    let hdl = evt.currentTarget.$uv.onx["on" + evt.type];                                                               // OK to throw if hdl not assigned
    cbkH(hdl,evt);
    }

function cbkH(hdl,...args) {
    try { fnc(hdl) ? hdl(...args) : arr(hdl.a) ? hdl.f(...args,...hdl.a) : hdl.f(...args,hdl.a); }
    catch(err) {
        logE(err,"CBK",{hdl,args});
        }
    }

function cbkV(vew) {
    return fnc(vew) ? vew() : vew;
    }

function kebab(val) {
    return val.replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase();
    }

function logD(dbg,lbl,...dtls) {
    dbg && log((str(dbg) ? dbg + " >> " : B) + lbl + (dtls.length>0 ? ":" : B), ...dtls);
    }

function logE(err,whr,dtl) {
    log(whr,"error =>",err,dtl);
    }

function node(typ) {
    let c = doc[CRT+typ].bind(doc);
    typ = typ.replace(/(NS|Node)$/,B).toLowerCase();                                                                    // for insights
    return (rdi,...a) => {
        let nod = c(...a);
        nod.$uv = { rdi };                                                                                              // always mark our nodes with DOM identity
        note("nod",typ);
        return nod;
        }
    }

function note(grp,nam) {
    dio && ((grp = dio[grp])[nam] = (grp[nam] ?? 0) + 1);
    }

function type(chk,dsc,val,dtl) {
    if(!chk) throw new TypeError(dsc+" bad type '"+typeof val+"'");
    }

//**********************************************************************************************************************
return EXPORTED;
}
