// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/// Ultraviolet vDOM API
/// ====================================================================================================================
///
/// A virtual DOM engine which is minimalist, self-contained, and fail-fast for common mistakes.
///
/// Strictly speaking, the only APIs which are necessary to write Ultraviolet applications and components are
/// {{#define|function-define-tag-atr-chn}}, {{#update|function-update-vew-nod}}, and
/// {{#island|function-island-vew-tgt}}. For an in-depth understanding of Ultraviolet usage please refer to the
/// {{@Ultraviolet Programmer Guide|2.Ultraviolet Programmer Guide}}.
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
/// printNode       | function      | A function to use for printing a node for logging and debugging.

function UvDom(cfg)
{ "use strict"; const EXPORTED={}; function exported(v,n){EXPORTED[n]=v;}
//**********************************************************************************************************************

const   doc         = cfg?.document  ?? document
,       idn         = Math.floor(Math.random() * 900_000_000) + 100_000_000
,       log         = cfg?.log       ?? console.log.bind(console,"["+(cfg?.name ?? "UVDOM-" + idn)+"]")
,       dom         = cfg?.printNode ?? (obj=>obj)

//**********************************************************************************************************************

// ALIASES FOR CODE BREVITY
const   keys        = Object.keys
,       B           = ""                                                                                                // minimize frequently used literal
,       F           = false                                                                                             // minimize frequently used literal
,       N           = null                                                                                              // minimize frequently used literal
,       T           = true                                                                                              // minimize frequently used literal
,       U           = undefined                                                                                         // minimize frequently used literal
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
exported(define,"define");
function define(tag,atr,chn) {
    if(chn===U && !stc(atr)) { chn = atr; atr =   {}; }                                                                 // allow attributes to be omitted
    else                     {            atr ??= {}; }

    type(str(tag),"tag",tag);                                                                                           // check type of tag
    type(stc(atr),"atr",atr);                                                                                           // check type of attributes
    chn = (chn===U ? [] : !arr(chn) ? [chn] : chn);                                                                     // coerce children to an array

    let $uv = { nid  : U }                                                                                              // want the nid to consistently show first when debugging
    ,   tmp = { class: U }                                                                                              // consider all nodes to have a class
    ,   idx;

    if((idx = tag.indexOf("."))!=-1) { tmp.class = dCls(tag.slice(idx+1)); tag = tag.slice(0,idx); }
    if((idx = tag.indexOf("#"))!=-1) { tmp.id    = tag.slice(idx+1);       tag = tag.slice(0,idx); }

    tag ||= "div";
    atr = dAtr(atr,tmp);
    chn = dChn(chn,[],$uv);
    $uv.nid = tag + ":" + (atr.id||B) + "[" + keys(atr).join(",") + "]";                                                // attributes included because rerender will not remove attributes from prior rendering
    return { tag, atr, chn, $uv };
    }

function dAtr(src,tgt) {
    let key, k0, val;

    for(key of keys(src)) {
        k0  = key[0];
        val = src[key];
        if(k0==="$") {
            if(!SPC.has(key.slice(1))) { throw new Error(`Unsupported prop '${key}'`); }
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
/// nod    | Element    | An existing DOM element to replace. Optional.
/// =>     | function   | A view-updater which manages updating a DOM node based on view; called to update the DOM with a view.
///
/// If the optional DOM node is supplied, that node is the mount-point which this view will (momentarily) replace; this
/// is a convenient way to mount a root view into the DOM. If not, then the view must be mounted into the DOM as a
/// component of another view, or by using the `mount()` function, above.
///
/// The view-updater defers update to the system event queue via setTimeout(). Multiple calls to the view-updater made
/// between event processing will result in a single update being queued, so hundreds of state updates can individually
/// request an update in rapid succession without spamming the event queue. This also gates the updates at about 4ms,
/// and when the tab is not visible, updates may be throttled or paused altogether. The custom render subfunction allows
/// any queuing mechanism be used. This is by design; Ultraviolet is not intended to drive animations, but rather UIs.
///
/// ###### Updater API:
///
/// Updater API functions are properies of the returned updater function.
///
/// **mount(nod)**
///
/// Mounts or remounts the view immediately. Since 4.00.
///
/// --------------------|-----------------------------------------------------------------------------------------------
/// nod                 | The node to replace, if any; otherwise the view is left dismounted.
/// =>                  | `undefined`
///
/// **custom(fnc)**
///
/// Triggers a custom update. Since 4.01.
///
/// --------------------|-----------------------------------------------------------------------------------------------
/// fnc                 | The supplied function. If omitted no action is taken.
/// =>                  | Whether a custom update is pending.
///
/// This allows an application supplied function to invoke the update according to some arbitrary rule. The supplied
/// function will be immediately invoked with a single argument, being an internal function to render the DOM. The when
/// *that* function is invoked, the DOM will be updated. Usually the supplied function will be `requestAnimationFrame`,
/// resulting in an expedited update. A simple immediate update can be achieved with `(f)=>f()`. The queued function
/// will ignore any arguments and return `undefined`.
exported(update,"update");
function update(vew,nod) {
    let csn = idn + "-" + (srl = (srl%MSN) + 1)                                                                         // component serial number
    ,   crq = F                                                                                                         // custom render queued
    ,   rip = F                                                                                                         // render is pending
    ,   $q = (/* ignore args and return undef; so usable as a PGS callback */) => {                                     // queue update.
            if(!rip) { rip = T; setTimeout($r) }                                                                        // dont use setTimeout return; may return 0
            }
    ,   $r = (/* ignore args and return undef so usable by setTimeout/requestAnimationFrame/queueMicrotask. */) => {    // expedited rendering
            $s(nod?.parentNode);
            }
    ,   $s = (p) => {                                                                                                   // subview function for normal rendering
            if(!nod || rip) { nod = rNod(cbkV(vew),p,nod,csn) }
            crq = rip = F;
            return nod;                                                                                                 // never NULL!
            };

    $q.mount = (t) => {
        if(t!==nod) {
            rAcn(RMV,nod,nod?.parentNode);
            nod?.remove();                                                                                              // remove existing view node from DOM
            nod = t;
            }
        rip = T; $r();                                                                                                  // render onto tgt immediately
        return $q;
        };
    $q.custom = (q) => {
        if(q && !crq) { crq = rip = T; q($r) }
        return crq;
        };
    $q.$s = $s;
    return $q;
    }

/// Create an asynchronous, coalescing, view-update function, given a view generator function, and add it to the target
/// object. This makes the target a rendering "island" which can be directly provided to another view. This is usually
/// done by the target object itself to make it usable as an isolated component.
///
/// Islands manage their own rendering independently of the parent that includes them. They should depend entirely and
/// only on their internal state. External state should be explicitly injected into an island whenever it changes. Care
/// should be taken that the view of an island does not incorporate state which it is not managing (and for which,
/// therefore, it is unaware of changes).
///
/// **Arguments & Return:**
///
/// -------|------------|-----------------------------------------------------------------------------------------------
/// vew    | function   | A virtual-DOM generator function which returns a structure describing some DOM.
/// tgt    | object     | The target object which is to become an island (usually the exports of the module calling this function).
/// =>     | function   | A view-updater which manages updating the DOM for this component.
///
/// Refer also to {{#update|function-update-vew-nod}}.
///
/// Since: 4.00
exported(island,"island");
function island(vew,tgt) {
    return (tgt.$dom = update(vew));
    }

//**********************************************************************************************************************
// RENDER
//**********************************************************************************************************************

/// Render a vDOM structure produced by calls to {{#define() | function-define-tag-atr-chn}} into DOM nodes.
///
/// This API is rarely, if ever, needed by an application, though it may be useful in debugging and testing. Most apps
/// will, instead, simply use an updater function produced by {{#update|function-update-vew-nod}} or
/// {{#island|function-island-vew-tgt}}.
///
/// **Arguments & Return:**
///
/// --------|-----------|-----------------------------------------------------------------------------------------------
/// vew     | object    | A virtual-dom structure describing some DOM.
///  "      | function  | A virtual-dom producer which returns a structure describing some DOM.
/// nod     | Element   | An existing DOM element to update. Optional.
/// =>      | Element   | A DOM node tree.
///
/// If the target node is omitted, a new DOM structure is returned. If the a node is provided, it is updated as
/// minimally as possible to represent the same structure described by the vDOM. If the node is already present in the
/// browser's DOM it is replaced in the parent.
///
/// No magical changes happen to the DOM after rendering; in order to update the DOM tree, it must be rendered again by
/// calling this function with an updated description. The {{#update|function-update-vew-nod}} and
/// {{#island|function-island-vew-tgt}} functions provide ready-made implementations for doing this with a single call,
/// allowing vDOM updates to be easily wired into state changes (for example, as the change callback of a PGS
/// state-value function).
exported(render,"render");
function render(vew,nod) {
    return rNod(cbkV(vew),nod?.parentNode,nod);
    }

function rNod(vdm,par,ond,csn,dbg) {
    let $uv = vdm?.$uv
    ,   smc = ond?.$uv?.csn===csn                                                                                       // ensure same component
    ,   nod = smc ? ond : U                                                                                             // must not reuse nod from another component!!
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
                nod = cNode(csn,B);
                }
            }
        else if(cpt = fnc(vdm)) {                                                                                       // component (assignment intentional)
            nod = vdm();                                                                                                // return NULL not permitted
            nod.$uv ??= {};                                                                                             // mark node from foreign component
            }
        else if($uv) {                                                                                                  // element vdom
            // NB: Cannot assign nod.$uv yet because `nod` might be the same as `ond`, and we need the old $uv for
            // removing event handlers.
            $uv = { ...$uv, csn };                                                                                      // always copy $uv structure for the DOM node
            (nsp = vdm.atr.xmlns)===U && (nsp = par && par.namespaceURI!==U ? par.namespaceURI : HTM);                  // default to HTML5 namespace
            if(!nod || nod.namespaceURI!==nsp || nod.$uv?.nid!==$uv.nid || nod.$uv?.csn!==csn) {
                nod = eNode(csn,nsp,vdm.tag);                                                                           // create replacement element
                }
            rAtr(nod,smc ? ond : U,vdm.atr,$uv,dbg);
            rChn(nod,smc ? ond : U,vdm.chn,csn,dbg);
            nod.$uv = $uv;                                                                                              // must assign nod.$uv after rAtr which needs the old $uv
            nod!==ond && rAcn(CRT,nod,par,dbg,T);                                                                       // create action (only for elements, the only nodes than can have handlers)
            }
        else if(nod?.nodeType!==doc.TEXT_NODE) {                                                                        // new text node
            nod = tNode(csn,vdm);
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
                    let cmt = cNode(csn,B);
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
            if(!frc || acn===INS || acn===RMV) for(let chl = next(nod.firstChild); chl; chl = next(chl.nextSibling)) {  // recursively invoke $insert/$remove on children
                rAcn(acn,chl,nod,dbg,T);
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

function rChn(par,opa,chn,csn,dbg) {
    let ond = next(opa?.firstChild)                                                                                     // first UV child
    ,   nxt;

    for(let vdm of chn) {
        logD(dbg,"CHL",vdm,"DOM:",dom(ond));
        par!==opa && (nxt = next(ond?.nextSibling));                                                                    // must get next UV child before making dom changes
        let nod = rNod(vdm,par,ond,csn,dbg);
        ond     = !nxt ? next(nod?.nextSibling) : nxt;                                                                  // for same parent nod is always prior to the desired next node to update
        }

    while(ond) {
        nxt = next(ond.nextSibling);                                                                                    // must get next UV child  before any dom changes
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

function next(nod) {
    while(nod && !nod.$uv) { nod = nod.nextSibling; }                                                                   // skip foreign nodes
    return nod ?? N;                                                                                                    // must be specifically NULL for correct dom insertion behavior
    }

function node(typ) {
    let c = doc[CRT+typ].bind(doc);
    typ = typ.replace(/(NS|Node)$/,B).toLowerCase();                                                                    // for insights
    return (csn,...a) => {
        let nod = c(...a);
        nod.$uv = { csn };                                                                                              // always mark our nodes with component serial number
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
