// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/// State
/// ====================================================================================================================
///
/// These functions provide a minimal, but capable, set of reactive primatives which work very well to store and work
/// with state for an application. It is particularly useful to make a UvDOM app reactive. Effectively, these functions
/// make explicit and obvious what other frontend systems try to hide with "magic" functionality.
///
/// <span class="status-stable">Module Status: </span>
///
/// ###### Construction
///
///     new UvState()
///
/// ###### Dependencies:
///
///     {{@util/GeneralUtil|GeneralUtil}}
///

function UvState(cfg)
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

const   gu              = new GeneralUtil()

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    }

// *********************************************************************************************************************
// PUBLIC
// *********************************************************************************************************************

/**
  * Create a property getter/setter function optionally with (a) an on-change callback, and (b) a local-storage property
  * name used to save/restore the last known value.
  *
  * <span class="status-stable">Status: </span>
  *
  * **Arguments & Return:**
  *
  *     curval          Optional initial value, used if local-storage value is not used or not set.
  *     chgcbk          Optional callback invoked when the property is changed.
  *     stgnam          Optional local-storage property name to persist the property.
  *     cbkini          Optional boolean flag to invoke callback when initializing value. Defaults to false.
  *     =>              A getter/setter function.
  *
  * If specified, the on-set callback will be invoked whenever the property is set to a value which is not strictly
  * equal to the current value unless the set explicitly suppresses the callback. This callback can return a value other
  * than undefined to override the value it was passed. This can veto the change (by returning old) or override (e.g.
  * for formatting, augmenting, etc) values as they are set.
  *
  * Note that as of version 8.06 the value and local store are set *before* the callback is invoked and then set again
  * if the callback overrides the supplied value. This is to permit invocation of other code that needs the new value to
  * be visible via the PGS value. Obviously, such code will not see the overriding value if one is returned. Previously
  * other code had to be deferred in order to see the updated value.
  *
  * The local-storage property name is used to to persist/recall the value in local storage whenever it changes.
  *
  * If the `cbkini` flag is `true`, the callback will be immediately invoked inline, with the `curval` specified and
  * the `oldval` set to `undefined`.
  *
  * The returned function has the property `isPGS` set to true. In the rare event that this PGS should not be treated
  * as one by generic processing functions like {{#comparator | function comparator}} and {{#pgsUnwrap | function
  * pgsWrap}}, this may be set to false.
  *
  * ###### Getter/Setter: `function(setval,skpcbk)`
  *
  *     setval          Optional value to set.
  *     skpcbk          Optional boolean flag to skip callback invocation when setting value.
  *     =>              The current property value.
  *
  * ###### Callback: `function(newval,oldval)`
  *
  *     newval          New property value.
x  *     oldval          Old property value.
  *     =>              Optional overriding value; if defined the property is set to that returned.
  *
  * ###### Getter/Setter API
  *
  *     pgs()           Get the property value.
  *     pgs(val)        Set the property value to `val`.
  *     pgs(val,true)   Set the property value to `val` skipping the change-callback.
  *     pgs.isPGS       A boolean flag to identify this as a PGS function.
  *     pgs.chainVal()  Specifies a value to be returned when the value is set; the default is the new value. This allows
  *                     for call-chaining on the model containing the PGS. This function itself returns the PGS so it
  *                     can be called inline when creating the PGS, e.g. `let myProp = gu.pgs(1).chainVal(EXPORTED);`.
  *     pgs.toJSON()    Extract the (unencoded) value for `JSON.stringify()`. Note, this somewhat misleading name is
  *                     dictated by the `stringify` function.
  *     pgs.toString()  Return the PGS value as a string.
  */
exported.pgs=pgs;
function pgs(curval,chgcbk,stgnam,cbkini) {
    let setrtn;

    if(gu.isString(chgcbk) || gu.isBoolean(chgcbk)) { cbkini=stgnam; stgnam=chgcbk; chgcbk=undefined; }                  // chgcbk omitted
    if(                       gu.isBoolean(stgnam)) { cbkini=stgnam; stgnam=undefined;                }                  // stgnam omitted

    if(typeof(localStorage)==="undefined") { stgnam=null; }                                                             // ignore if LS not supported

    stgnam && (curval = tryLocalStore(stgnam)?.value ?? curval);                                                        // ignore default value and restore last saved value if present and valid

    if(cbkini && chgcbk) {                                                                                              // invoke change callback for initial value
        let val = curval;
        curval = undefined;
        prp(val);
        }

    function prp(setval,skpcbk) {
        if(setval!==undefined) {
            if(setval!==curval) {
                let oldval = curval;
                curval = setval;
                stgnam && tryLocalStore(stgnam,{ value: curval });
                if(chgcbk && !skpcbk) {
                    setval = chgcbk(curval,oldval);
                    if(setval!==undefined && setval!==curval) {
                        curval = setval;                                                                                // override value with callback response
                        stgnam && tryLocalStore(stgnam,{ value: curval });
                        }
                    }
                }
            if(setrtn!==undefined) { return setrtn; }
            }
        return curval;
        }
    prp.chainVal     = function(val)     { setrtn = val; return prp; };
    prp.isPGS        = true;
    prp.toJSON       = function(key$idx) { return curval; };
    prp.toString     = function()        { return String(curval); };
    return prp;
    }

/**
  * Convert a `PGS` to read-only getter, optionally throwing Error on write.
  *
  * <span class="status-stable">Status: </span>
  *
  * **Arguments & Return:**
  *
  *     prp             Property to wrap.
  *     err             Error text to throw if write is attempted. Optional. Recommended format `"[SomeCode] Description..."`.
  *     =>              A getter function.
  *
  * If no error is supplied, writes attempts are silently ignored, otherwise invoking the getter with parameters throws
  * an error.
  */
exported.pgsGet=pgsGet;
function pgsGet(prp,err) {
    return function get(val) {
        if(err && val) { throw new Error(err); }
        return prp();
        };
    }

/**
  * PGS property selector for clone, pgsWrap, etc. The properties are specified by path from the object
  * root.
  *
  * **Arguments & Return:**
  *
  *     pths (string[]) The property or properties to select.
  *     =>              A property selector with signature `selector(pth,key,val)`.
  *
  */
exported.pgsPathSelector=pgsPathSelector;
function pgsPathSelector(pths) {
    let             map={};

    if(!gu.isArray(pths)) { pths=[ pths ]; }
    for(let xa=0,len=pths.length; xa<len; ++xa) {
        let pth=pths[xa];
        let spl=pth.lastIndexOf("/");
        let par,lea;
        if(spl==-1) { par="/";                    lea=pth;                  }
        else        { par=pth.substring(0,spl+1); lea=pth.substring(spl+1); }
        if(!map[par]) { map[par]={}; }
        map[par][lea]=true;
        }

    return function(pth,key/*,val*/) {
        let lea=map[pth];
        return lea && lea[key];
        };
    }

/**
  * Toggle a boolen PGS property.
  *
  * <span class="status-stable">Status: </span>
  *
  * **Arguments & Return:**
  *
  *     pgs (pgs)       The PGS property to toggle.
  *     =>              The new value.
  *
  */
exported.pgsToggle=pgsToggle;
function pgsToggle(pgs) {
    return pgs(!pgs());
    }

/**
  * Deep-clone an object or array, turning each field value into a plain value from a `pgs()` getter/setter.
  *
  * <span class="status-stable">Status: </span>
  *
  * **Arguments & Return:**
  *
  *     obj             The object or array to clone.
  *     selfnc          An optional function to select members to copy.
  *     xfmfnc          An optional transformer function.
  *     reffnc          An optional function to select objects to copy by reference.
  *     =>              The cloned object.
  *
  * ###### Selector & Transformer Arguments:
  *
  *     pth             Path leading to this member, assembled from "/" by appending keys with "/" separators.
  *     key             Object key or aray index.
  *     val             Object or array value.
  *
  * Traversal order is depth-first, with key order defined by JavaScript.
  *
  * Keys and array elements which are `undefined` are dropped. Unless excluded by the selector Boolean, Number and
  * String objects are converted to their primitive counterparts. They are then passed to the transform function, if
  * supplied.
  *
  * JavaScript class objects are always copied by reference.
  *
  * An optional field selector may be provided and which conditionally selects object properties to be copied.
  *
  * An optional field transformer may be provided which alters property values after they are copied. The transformer is
  * called on objects *after* they have been recursed and processed.
  *
  * An optional copy-by-reference selector may be provided which identifies objects which are not deep cloned. If this
  * returns true, the object reference is simply assigned and no further processing is done. Therefore that object's
  * fields are not evaluated by the field selector or field transformer.
  */
exported.pgsUnwrap=pgsUnwrap;
function pgsUnwrap(obj,selfnc,xfmfnc,reffnc) {
    function xfmwrp(pth,key,val) {
        val=(gu.isFunc(val) && val.isPGS ? val() : val);
        if(xfmfnc) { val=xfmfnc(pth,key,val); }
        return val;
        }

    return (!gu.isContainer(obj)) ? obj : gu.clone(obj, selfnc,xfmwrp,reffnc);
    }

/**
  * Deep-clone an object or array, turning each simple field value into a `pgs()` getter/setter.
  *
  * <span class="status-stable">Status: </span>
  *
  * **Arguments & Return:**
  *
  *     obj             The object or array to clone.
  *     selfnc          An optional function to select members to copy.
  *     xfmfnc          An optional transformer function.
  *     reffnc          An optional function to select objects to copy by reference.
  *     =>              The cloned object.
  *
  * ###### Selector & Transformer Arguments:
  *
  *     pth             Path leading to this member, assembled from "/" by appending keys with "/" separators.
  *     key             Object key or array index.
  *     val             Object or array value.
  *
  * Traversal order is depth-first, with key order defined by JavaScript.
  *
  * Keys and array elements which are `undefined` are dropped. Unless excluded by the selector Boolean, Number and
  * String objects are converted to their primitive counterparts. They are then passed to the transform function, if
  * supplied.
  *
  * JavaScript class objects are always copied by reference.
  *
  * **NOTE:** Objects (structures) are not turned into properties, only member values.
  *
  * An optional field selector may be provided and which conditionally selects object properties to be copied.
  *
  * An optional field transformer may be provided which alters property values after they are copied. The transformer is
  * called on objects  *after* they have been recursed and processed.
  *
  * An optional copy-by-reference selector may be provided which identifies objects which are not deep cloned. If this
  * returns true, the object reference is simply assigned and no further processing is done. Therefore that object's
  * fields are not evaluated by the field selector or field transformer.
  */
exported.pgsWrap=pgsWrap;
function pgsWrap(obj,selfnc,xfmfnc,reffnc) {
    function xfmwrp(pth,key,val) {
        if(xfmfnc) { val=xfmfnc(pth,key,val); }
        val=(val==null || typeof(val)!=='object' ? pgs(val) : val);
        return val;
        }

    return (!gu.isContainer(obj)) ? obj : gu.clone(obj, selfnc,xfmwrp,reffnc);
    }

// *********************************************************************************************************************
// PRIVATE
// *********************************************************************************************************************

function tryLocalStore(nam,obj) {
    if(obj===undefined) {
        try { obj = JSON.parse(localStorage.getItem(nam)); } catch(err) {/*ignore*/}
        }
    else {
        localStorage.setItem(nam,JSON.stringify(obj));
        }
    return obj;
    }

// *********************************************************************************************************************
init();
return exported;
}
