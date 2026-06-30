// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * GeneralUtil
  * ====================================================================================================================
  *
  * General utility functions.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Construction
  *
  *     new GeneralUtil()
  */

function GeneralUtil(cfg)
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

const   CTRNAM  = true
,       INSITU  = true
,       LOGPFX  = ((cfg && cfg.logPrefix) || "")+"[Whio]"
,       MERGE   = false
,       PATCH   = true

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    }

// *********************************************************************************************************************
// PUBLIC
// *********************************************************************************************************************

/**
  * Convert the JavaScript arguments object to an array. Note that this can be used to either prepend or append
  * additional arguments to a function's input arguments.
  *
  *     basargs         An arguments object.
  *     basofs          Offset into `basargs`. Optional; default=0.
  *     addargs         An additional array or arguments object. Optional.
  *     addofs          Offset into `addargs`. Optional; default=0.
  *     =>              An array containing the given arguments.
  */
exported.argsArray=argsArray;
function argsArray(basargs,basofs,addargs,addofs) {
    if(basargs && (!isArray(basargs) || basofs!=0)) { basargs=Array.prototype.slice.call(basargs,basofs || 0); }
    if(addargs && (!isArray(addargs) || addofs!=0)) { addargs=Array.prototype.slice.call(addargs,addofs || 0); }
    return (!addargs || addargs.length===0) ? (basargs || [])
    :      (!basargs || basargs.length===0) ?  addargs
    :                                          basargs.concat(addargs);
    }

/**
  * Return a function which binds predefined arguments for the supplied function.
  *
  *     fnc             The function to call.
  *     ...arg          Any arguments to bind before the arguments supplied by the caller.
  *
  * See also: {{@FpUtil.curry() | FpUtil#function curry}}
  *
  * Throws
  *
  *     Error           If the first argument was not a function.
  */
exported.bindArgs=bindArgs;
function bindArgs(fnc/*...args*/) {
    if(!isFunc(fnc)) { throw new Error("[IllegalArgument] The first argument for `bindArgs(fnc...)` must be a function"); }

    let fxdargs=argsArray(arguments,1);

    return function() {
        return fnc.apply(null,argsArray(fxdargs,0,arguments));
        };
    }

/**
  * Create a chain of function invocation chain. Any null arguments are first removed; if the resulting list is empty,
  * null is returned; if it is a single element, then that singular function is returned. Otherwise a function which
  * invokes all functions in the sequence given is returned.
  *
  *     ...fncs         Functions to chain together.
  *     =>              A function which will invoke each function in the chain using whatever arguments are given it.
  */
exported.chain=chain;
function chain(/*...fncs*/) {
    let fncs        = argsArray(arguments,0);

    for(let xa=0; xa<fncs.length; ++xa) {
        if(!fncs[xa]) { fncs.splice(xa,1); xa--; }
        }

    if     (fncs.length==0) { return null;    }
    else if(fncs.length==1) { return fncs[0]; }
    else {
        return function(){
            let args=argsArray(arguments,0);
            for(let xa=0,len=fncs.length; xa<len; ++xa) { fncs[xa].apply(null,args); }
            };
        }
    }

/**
  * Deep-clone the supplied ***data*** object or array.
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
  *     =>              Transformed object, or boolean flag for select/reject.
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
  * called on objects  *after* they have been recursed and processed.
  *
  * An optional copy-by-reference selector may be provided which identifies objects which are not deep cloned. If this
  * returns true, the object reference is simply assigned and no further processing is done. Therefore that object's
  * fields are not evaluated by the field selector or field transformer.
  */
exported.clone=clone;
function clone(obj,selfnc,xfmfnc,reffnc) {
    return (!isContainer(obj)                             ? obj
    :      (selfnc!=null || xfmfnc!=null || reffnc!=null) ? transformObj(obj, selfnc,xfmfnc,reffnc, !INSITU,"/")
    :                                                       copyOf(obj));
    }

/**
  * Create an object comparator specifying the properties for comparing. String values are compared case-insensitively.
  *
  *     prps            Properties to use, in order. May be an array of strings or a CSV string.
  *     dft             Function to use if all property values test as equal. Default is to consider the objects equal.
  *     =>              Comparator function.
  *
  * ###### Comparator Arguments & Return
  *
  *     obj1            A left-value object to compare.
  *     obj2            A right-value object to compare.
  *     =>              A value `x` such that `x < 0` for less-than, `x > 0` for greater-than, or `x = 0` for equal.
  *
  * The comparator returned is used anywhere a standard comparator is needed, e.g. `[...].sort(compareObjects)`.
  *
  * Property names can be marked with `!` to sort descending and with `#` to coerce their values to numbers. If both are
  * used they **must** be in the order `!#`.
  *
  * Null/undefined values sort as equal to each and **greater than** all other values. This is handy for eliminating
  * such values by placing them at the end of a sorted array. Post sorting, one can iterate until `val==null`.
  *
  * Note that {{#PGS properties | function pgs}} are compared using the values they hold.
  */
exported.comparator=comparator;
function comparator(prps,dft) {
    let cmpfnc,cmpfncs,dftfnc=makeComparator(dft);

    if(!isArray(prps)) { prps=prps.split(","); }

    if(prps.length==0) {                                                                                                // no props? okay then.
        return dftfnc;
        }
    else if(prps.length==1) {                                                                                           // optimize for a single properties
        prps=prps[0];
        cmpfnc=makeComparator(prps);
        return function comparator(onercd,tworcd) {
            let cmpres=cmpfnc(onercd,tworcd);
            if(cmpres==0) { cmpres=dftfnc(onercd,tworcd); }
            return cmpres;
            };
        }
    else {
        cmpfncs=prps.map(function(key) { return makeComparator(key); });
        return function comparator(onercd,tworcd) {
            let cmpres=0;
            for(let xa=0,len=cmpfncs.length; xa<len && cmpres==0; ++xa) { cmpres=cmpfncs[xa](onercd,tworcd); }
            if(cmpres==0) { cmpres=dftfnc(onercd,tworcd); }
            return cmpres;
            };
        }

    function strCompare(one,two) {
        one=one.toString().toLocaleLowerCase();
        two=two.toString().toLocaleLowerCase();
        return (one<two ? -1 : one>two ? 1 : 0);
        }

    function makeComparator(key) {
        if(!key) {
            return function(/*one,two*/) { return 0; };
            }
        key=key.trim();

        let asc=!key.startsWith("!");
        if(!asc) { key=key.substring(1).trim(); }

        let nbr=key.startsWith("#");
        if(nbr) { key=key.substring(1).trim(); }

        return function(onercd,tworcd) {
            let oneval=onercd[key];
            let twoval=tworcd[key];

            if(isFunc(oneval) && oneval.isPGS) { oneval=oneval(); }                                                     // unwrap PGS
            if(isFunc(twoval) && twoval.isPGS) { twoval=twoval(); }                                                     // unwrap PGS

            if     (oneval==null && twoval==null) { return 0;             }
            else if(oneval==null                ) { return asc ?  1 : -1; }
            else if(                twoval==null) { return asc ? -1 :  1; }

            if(nbr && !isNumber(oneval)) { oneval=Number(oneval); }
            if(nbr && !isNumber(twoval)) { twoval=Number(twoval); }

            if(nbr) { return asc ? oneval-twoval             : twoval-oneval            ; }
            else    { return asc ? strCompare(oneval,twoval) : strCompare(twoval,oneval); }
            };
        }
    }

/**
  * Freeze a container object and all of it's subcontainers (as defined by {{#isContainer | function isContainer}}).
  * In keeping with Object.freeze(), this operates on the given object, in-situ, and returns the *same* object.
  *
  * **Arguments & Return:**
  *
  *     obj             The object to be frozen.
  *     skpfnc          An optional function to select object/array members to skip.
  *     =>              The same object supplied in `obj`.
  *
  * ###### Selector & Reference Arguments:
  *
  *     pth             Path leading to this member, assembled from "/" by appending keys with "/" separators.
  *     key             Object key.
  *     val             Object or array value.
  *
  * JavaScript class objects are not frozen.
  *
  * Examples:
  *
  *     deepFreeze(obj);
  *     obj=deepFreeze({ ... });
  */
exported.deepFreeze=deepFreeze;
function deepFreeze(obj,skpfnc) {
    function xfmfnc(pth,key,val) {
        return (isContainer(val) ? Object.freeze(val) : val);
        }

    if(!obj) {
        return obj;
        }
    else if(skpfnc) {
        transformObj(obj,null,xfmfnc,skpfnc,INSITU,"/");
        }
    else {
        for(let key of Object.keys(obj)) {
            let val=obj[key];
            if(isContainer(val)) { deepFreeze(val); }
            }
        }
    return Object.freeze(obj);
    }

/**
  * Resolve the nested value in `obj` using a dot-separated compound key name, or an array of key names. Using an array
  * is more efficient as the dot-separated key needs to be split every time. Most of the time the difference is not
  * relevant. Note that this works similar to optional chaining, which should be preferred, but is useful if the key(s)
  * are dynamically defined.
  *
  * **Arguments & Return:**
  *
  *     obj             The object containing the desired property.
  *     keys            A dot-separated string or array of strings represting the nested property keys.
  *     dft             Value to return if property is not found. Optional. Defaults to `null`.
  *     =>              The value or default.
  *
  * Examples:
  *
  *     let idx=evt?.node?.data?.optionIdx; // using optional chaining
  *     let idx=deepRef(evt,"target.node.data.optionIdx"); // clearest and easiest
  *     let idx=deepRef(evt,["target","node","data","optionIdx"]); // for a hotspot
  */
exported.deepRef=deepRef;
function deepRef(obj,keys,dft) {
    if(isString(keys) ) { keys=keys.split("."); }
    if(dft===undefined) { dft=null;             }
    let val=(obj!=null && keys.reduce(function(val,key) { return (val!=null ? val[key] : null); },obj));
    return (val!=null ? val : dft);
    }

/**
  * Return the first defined default for the supplied value if it is null. The first non-null default value is used.
  *
  * **Arguments & Return:**
  *
  *     val             The value to be defaulted.
  *     ...dft          One or more default values to set if the supplied value is `undefined`.
  *     =>              The value or its default.
  */
exported.defaultValue=defaultValue;
function defaultValue(val/*,dfts*/) {                                                                                   //CHGME: use rest ...args once Venue360 is updated to ECMA2015+
    if(val!==undefined) { return val; }
    let dfts = argsArray(arguments,1);
    for(let xa=0; xa<dfts.length; xa+=1) {
        let dft = dfts[xa];
        if(dft!==undefined) { return dft; }
        }
    return undefined;
    }

/**
  * Ensure the supplied object is an array. If `null` or `undefined` an empty array is returned, otherwise if `val` is
  * not an array it is wrapped in one and returned.
  */
exported.ensureArray=ensureArray;
function ensureArray(val) {
    return (val==null ? [] : isArray(val) ? val : [ val ]);
    }

/**
  * Ensure the supplied object contains the named key. If not, the key is added with the supplied default value.
  * The first default value is used.
  *
  * **Arguments & Return:**
  *
  *     obj             The object which must contain the desired property.
  *     key             The property key.
  *     ...dft          One or more default values to use if the supplied value is `undefined`.
  *     =>              The object arguemnt.
  */
exported.ensureProp=ensureProp;
function ensureProp(obj,key/*,dft*/) {
    if(obj[key]===undefined) {
        let args=argsArray(arguments,2);
        args.unshift(undefined);
        obj[key]=defaultValue.apply(null,args);
        }
    return obj;
    }

/**
  * Find the first object where `cmp(arr[xa],key)===0` is returned. If no match is found, `undefined` is returned.
  *
  * If any of the arguments is `null` or `undefined`, then `undefined` is returned.
  */
exported.findObject=findObject;
function findObject(arr,key,cmp) {
    if(arr && key && cmp) {
        for(let xa=0, len=arr.length; xa<len; ++xa) {
            if(cmp(arr[xa],key)===0) { return arr[xa]; }
            }
        }
    return undefined;
    }

/**
Generates a cryptographically random ID of arbitrary length and composition.

###### Arguments and Return

     len: The number of characters needed. Default: 50.
     cpn: The composition characters. Default: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~_".
     => The ID string.

The default composition is chosen to be the maximum base which is an exact divisor of 256, eliminating the bias from
wrapping the composition character set, and to be URL and cuss safe.

Other suggested character sets:

  - Hex     : "0123456789ABCDEF". URL safe, cuss safe.
  - Base 32 : "BCDFGHJKLMNPQRSTVWXYZ0123456789_". URL safe, cuss safe.
  - Base 48 : "CDFGHJKMNPQRSTVWXYZcdfghjkmnpqrstvwxyz0123456789". URL safe, cuss safe, unabiguous glyphs.
  - Base 50 : "CDFGHJKLMNPQRSTVWXYZbcdfghjkmnpqrstvwxyz0123456789". URL safe, cuss safe, unabiguous glyphs, very slight bias for "CDFGHJ".
  - Base 64 : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~_". URL safe.

**/
exported.generateId=generateId;
function generateId(len,cpn) {
    len ??= 50;
    cpn ??= "CDFGHJKMNPQRSTVWXYZcdfghjkmnpqrstvwxyz0123456789";

    let byt = new Uint8Array(len);
    let txt = "";

    crypto.getRandomValues(byt);
    for(let xa=0; xa<len; xa+=1) { txt += cpn[byt[xa]%cpn.length]; }
    return txt;
    }

/**
  * Returns whether the value is an array.
  */
exported.isArray=isArray;
function isArray(val) {
    return valType(val)==="array";
    }

/**
  * Returns whether the value is "blank", including null/undefined.
  * Strings containing only whitespace are considered blank; but they are not considered {{#isEmpty | function isEmpty}}.
  */
exported.isBlank=isBlank;
function isBlank(obj) {
    return (isEmpty(obj) || (isString(obj) && obj.trim().length==0));
    }

/**
  * Returns whether the value is a boolean.
  */
exported.isBoolean=isBoolean;
function isBoolean(val) {
    return valType(val)==="boolean";
    }

/**
  * Returns whether the value is a simple container, that is, an array or struct.
  */
exported.isContainer=isContainer;
function isContainer(val) {
    let typ=valType(val);
    return typ==="array" || typ==="struct";
    }

/**
  * Returns whether the value is "empty", including null/undefined.
  *
  * Strings containing only whitespace are NOT considered empty; but they are considered {{#isBlank | function isBlank}}.
  */
exported.isEmpty=isEmpty;
function isEmpty(obj) {
    if(obj==null) { return true; }
    if(isArray(obj) || isString(obj)) { return obj.length === 0; }
    return Object.keys(obj).length==0;
    }

/**
  * Returns whether the value is a function.
  */
exported.isFunc=isFunc;
function isFunc(val) {
    return valType(val)==="function";
    }

/**
  * Returns whether the value is an explicit number type (built-in constant or Number).
  */
exported.isNumber=isNumber;
function isNumber(val) {
    return valType(val)==="number";
    }

/**
  * Returns whether the value is an object (but not null or an array), excluding the types listed in the second argument.
  */
exported.isObject=isObject;
function isObject(val,exctyps) {
    if(exctyps) for(let xa=0,len=exctyps.length; xa<len; ++xa) {
        if(val instanceof exctyps[xa]) { return false; }
        }
    let typ=valType(val,!CTRNAM);
    return typ==="object" || typ==="struct";
    }

/**
  * Returns whether the value is a string.
  */
exported.isString=isString;
function isString(val) {
    return valType(val)==="string";
    }

/**
  * Returns whether the value is a dictionary structure (plain JS object, that is, one who's prototype is `Object` or `null`).
  */
exported.isStruct=isStruct;
function isStruct(val) {
    return valType(val)==="struct";
    }

/**
  * Returns whether the value is a primitive value wrapper.
  */
exported.isWrapper=isWrapper;
function isWrapper(val) {
    return (val instanceof Boolean|| val instanceof Number || val instanceof String);
    }

/**
  * Get a date in local ISO format (`YYYY-MM-DD`). Dates in the BC era are suffixed with ` BC`.
  *
  * **Arguments & Return:**
  *
  *     dat             A Date object; defaults to now if null/undefined.
  *     (return)        A string in the format `YYYY-MM-DD` (or `YYYY-MM-DD BC` for negative years).
  */
exported.isoDate=isoDate;
function isoDate(dat) {
    dat ??= new Date();
    let yr = dat.getFullYear()
    ,   mm = String(dat.getMonth()+1).padStart(2,"0")
    ,   dd = String(dat.getDate()   ).padStart(2,"0");
    return (Math.abs(yr) + "-" + mm + "-" + dd + (yr<0 ? " BC" : ""));
    }

/**
  * Get a time in local ISO format (`HH:MM:SS`), using 24-hour clock.
  *
  * **Arguments & Return:**
  *
  *     dat             A Date object; defaults to now if null/undefined.
  *     (return)        A string in the format `HH:MM:SS`.
  */
exported.isoTime=isoTime;
function isoTime(dat) {
    dat ??= new Date();
    let hh = String(dat.getHours()  ).padStart(2,"0")
    ,   mi = String(dat.getMinutes()).padStart(2,"0")
    ,   ss = String(dat.getSeconds()).padStart(2,"0");
    return (hh + ":" + mi + ":" + ss);
    }

/**
  * Get a date and time in local ISO format (`YYYY-MM-DD HH:MM:SS`), using a space separator instead of `T`.
  *
  * **Arguments & Return:**
  *
  *     dat             A Date object; defaults to now if null/undefined.
  *     (return)        A string in the format `YYYY-MM-DD HH:MM:SS`.
  */
exported.isoDateTime=isoDateTime;
function isoDateTime(dat) {
    dat ??= new Date();
    return (isoDate(dat) + " " + isoTime(dat));
    }

/**
  * Deep merge the supplied ***data structure*** objects into the specified target object
  *
  * **Arguments & Return:**
  *
  *     tgt             The object or array to merge into.
  *     src...          One or more source objects to merge into `tgt`.
  *     =>              The object passed as `tgt`.
  *
  * Arguments which are not simple subclasses of `Object` or arrays are ignored.
  *
  * Explicitly `undefined` values cause the target member to be deleted, otherwise duplicate members in each successive
  * source object overwrite any property of the same name in the target. Objects are always new references if the target
  * does not already have an object of that name. Only objects are merged; that is, a source array, function, `null`,
  * `undefined` or primitive value always replaces the same-named value in the target. Arrays are **not merged**, they
  * are replaced, though with a new array not the same reference. Primitive wrappers are treated as simple values.
  *
  * This can be used to merge two or more objects into a brand new object like this:
  *
  *     let newobj=merge({},existing1,existing2);
  *
  * **NOTE:** This should not be used on javascript class objects, but on data structures such as those from
  * deserializing json data. It does not work correctly on subclassed objects.
  *
  * See also: {{#patch | function patch}}
  */
exported.merge=merge;
function merge(tgt,src) {
    for(let xa=1,len=arguments.length; xa<len; ++xa ) {
        src=arguments[xa];
        if(isContainer(src)) { tgt=mergeOrPatchObject(tgt,src,MERGE); }
        }
    return tgt;
    }

/**
  * Shallow merge the supplied ***data structure*** objects or arrays into the specified target.
  *
  * **Arguments & Return:**
  *
  *     tgt             The target object or array to copy members into.
  *     src             The first of multiple source objects or arrays to copy members from.
  *     =>              The target object supplied in `tgt`.
  *
  * This is useful for updating a record from a remote source into a local collection element after fetching an updated
  * record.
  *
  * Any keys already in the target object are replaced.
  *
  * This should not be used on JavaScript class objects, but on data structures such as those from deserializing JSON
  * data. It does not work correctly on subclassed objects.
  */
exported.mergeShallow=mergeShallow;
function mergeShallow(tgt,src) {
    for(let xa=1,len=arguments.length; xa<len; ++xa) {
        src=arguments[xa];
        for(let keys=Object.keys(src), xb=0; xb<keys.length; xb++) { let key=keys[xb]; tgt[key]=src[key]; }
        }
    return tgt;
    }

/**
  * No-op function. Does nothing except return it's argument. Useful for when a callback or implementation needs to be stubbed.
  *
  *     retval          The return value for the function. Optional. Defaults to `undefined`.
  *     =>              `retval`.
  */
exported.noop=noop;
function noop(retval) {
    return retval;
    }

/**
  * Deep patch the supplied ***data structure*** objects into the specified target object
  *
  * **Arguments & Return:**
  *
  *     tgt             The object or array to patch into.
  *     src...          One or more objects to patch into `tgt`.
  *     =>              The target object passed as `tgt`.
  *
  * Arguments which are not simple subclasses of `Object` or arrays are ignored.
  *
  * Explicitly `undefined` values cause the target member to be deleted, otherwise duplicate members in each successive
  * source object overwrite any property of the same name in the target. Objects are always new references if the target
  * does not already have an object of that name. Only objects are patchd; that is, a source array, function, `null`,
  * `undefined` or primitive value always replaces the same-named value in the target. Arrays are **not patched**, they
  * are replaced, though with a new array not the same reference. Primitive wrappers are treated as simple values.
  *
  * This function differs from {{#merge | function merge}} in the treatment of objects which are missing from the
  * target. In such cases the source object is simply assigned into the target instead of being cloned. This allows
  * object references to be retained for later object equality tests and for retaining references to program models.
  *
  * This can be used to patch two or more objects into a brand new object like this:
  *
  *     let newobj=patch({},existing1,existing2);
  *
  * **NOTE:** This should not be used on javascript class objects, but on data structures such as those from
  * deserializing json data. It does not work correctly on subclassed objects.
  *
  * See also: {{#merge | function merge}}
  */
exported.patch=patch;
function patch(tgt,src) {
    for(let xa=1,len=arguments.length; xa<len; ++xa ) {
        src=arguments[xa];
        if(isContainer(src)) { tgt=mergeOrPatchObject(tgt,src,PATCH); }
        }
    return tgt;
    }

/**
  * Repeatedly invoke the supplied function with the supplied arguments.
  *
  * If the `cnt` is "falsy", it is treated as zero and undefined is returned.
  *
  * **Arguments & Return:**
  *
  *     cnt             Repetition count; either a number or a function returning true to repeat, false to stop.
  *     fnc             The function to call.
  *     arg...          Any arguments to bind after the current repeat index.
  *
  * ###### Function Arguments:
  *
  *     cnt             Current count.
  *     arg...          Arguments from the repeat call.
  *
  * Returns whatever the last invocation returns.
  *
  * Throws
  *
  *     Error           If the first argument was not a function.
  */
exported.repeat=repeat;
function repeat(cnt,fnc/*,arg*/) {
    if(!fnc) { throw new Error("[IllegalArgument] The function argument for `repeat(cnt,fnc,...)` cannot be null"); }

    let ret;

    if(cnt) {
        let args=argsArray(arguments,1);                                                                                // include `fnc` which will become the current count

        if(!isFunc(cnt)) {
            let lmt=cnt;
            cnt=function(cur) { return cur<lmt; };
            }
        for(let xa=0; cnt(xa); ++xa) {
            args[0]=xa;
            ret=fnc.apply(null,args);
            }
        }
    return ret;
    }

/**
  * Shuffle an array, producing a new array. The input array is not changed.
  *
  * **Arguments & Return:**
  *
  *     arr             Array to shuffle.
  *     rnd             Function which produces random values such that 0 <= val < 1. Default: `Match.random`.
  *     =>              A new array with shuffled elements.
  */
exported.shuffle=shuffle;
function shuffle(arr, rnd = Math.random) {
    arr   = [ ...arr ];
    for(let top = arr.length; --top; ) {
        let oth = Math.floor(rnd() * (top + 1))
        ,   tmp = arr[top];
        arr[top] = arr[oth];
        arr[oth] = tmp;
        }
    return arr;
    }

/**
  * Deep-transform the supplied ***data*** object or array.
  *
  * **Arguments & Return:**
  *
  *     obj             The object or array to transform.
  *     selfnc          An optional function to select members to transform.
  *     xfmfnc          An optional transformer function.
  *     =>              The transformd object, which is the original `obj` passed in.
  *
  * ###### Selector & Transformer Arguments:
  *
  *     pth             Path leading to this member, assembled from "/" by appending keys with "/" separators.
  *     key             Object key.
  *     val             Object or array value.
  *
  * Traversal order is depth-first, with key order defined by JavaScript.
  *
  * JavaScript class objects are always transformed by reference.
  *
  * An optional field selector may be provided and which conditionally selects object properties to be transformed.
  *
  * An optional field transformer may be provided which alters property values after they are copied. The transformer is
  * called on objects *after* they have been recursed and processed.
  *
  * Keys and array elements which are `undefined` are skipped. Unless excluded by the selector Boolean, Number and
  * String objects are converted to their primitive counterparts. They are then passed to the transform function, if
  * supplied.
  */
exported.transform=transform;
function transform(obj,selfnc,xfmfnc,reffnc) {
    return (!isContainer(obj)) ? obj : transformObj(obj, selfnc,xfmfnc,reffnc, INSITU,"/");
    }

/**
  * Get a string representation of a value in a format that makes the type apparent. Primarily used for debugging and
  * dumping.
  *
  *     val             Value for which type is wanted.
  *     =>              A string representing the detailed type.
  */
exported.valString=valString;
function valString(val) {
    let ptp,txt;

    return (val===null                            ? "null"
    :       val===undefined                       ? "undefined"
    :       isFunc     (val)                      ? (val.name ? val.name : "<lamda>")+"()"
    :       isString   (val)                      ? '"'+val+'"'
    :       isContainer(val)                      ? objString(val)
    :       (txt=String(val))==="[object Object]" ? "<object "+((ptp && ptp.constructor.name) || "unknown object")+">"
    :                                               txt);
    }

/**
  * Get the type name of a value in more detail than `typeof`. Getting the name of the type matching `instanceof` for
  * objects is optional.
  *
  *     val             Value for which type is wanted.
  *     dtl             Boolean flag for the name of the constructor for class-objects.
  *     =>              A string representing the detailed type.
  *
  * Returned types:
  *
  *   - `array`
  *   - `boolean`
  *   - `function`
  *   - `number`
  *   - `object`
  *   - `string`
  *   - `struct` (an object with a constructor of `null` or `Object`; i.e. a simple structure)
  *   - `null`
  *   - `undefined`
  *   - *name of constructor function*
  */
exported.valType=valType;
function valType(val,dtl) {
    let typ     = typeof(val),ptp;

    return (typ!=="object"                         ? typ
    :       val===null                             ? "null"
    :       val instanceof Array                   ? "array"
    :       val instanceof Boolean                 ? "boolean"
    :       val instanceof Number                  ? "number"
    :       val instanceof String                  ? "string"
    :       (ptp=Object.getPrototypeOf(val))==null ? "struct"
    :       ptp.constructor===null                 ? "struct"
    :       ptp.constructor===Object               ? "struct"
    :       (dtl!==false && ptp.constructor.name)  ? ptp.constructor.name
    :                                                "object");
    }

/**
  * Visit each property of the supplied ***data*** object or array, calling the supplied function on each one.
  *
  * **Arguments & Return:**
  *
  *     obj             The object or array to transform.
  *     fnc             A function to call for each member.
  *     =>              Whether all nodes were visited.
  *
  * ###### Visitor Arguments:
  *
  *     pth             Path leading to this member, assembled from "/" by appending keys with "/" separators.
  *     key             Object key.
  *     val             Object or array value.
  *     =>              `false` to stop processing; anything else to continue.
  *
  * Traversal order is depth-first, with key order defined by JavaScript.
  */
exported.visit=visit;
function visit(obj,fnc) {
    return visitAll(obj,fnc,"/");
    }

// *********************************************************************************************************************
// PRIVATE
// *********************************************************************************************************************

function copyOf(obj) {
    let arr     = isArray(obj)
    ,   tgt     = (arr ? [] : {});

    for(let key of Object.keys(obj)) {
        let val=obj[key];
        if(isContainer(val)) { val=copyOf(val); }
        tgt[key]=val;
        }
    return tgt;
    }

function mergeOrPatchObject(tgtobj,srcobj,pch) {
    if(isArray(srcobj)) {
        tgtobj=[];                                                                                                      // arrays are replaced as values, not merged or concatenated
        for(let xa=0,len=srcobj.length; xa<len; ++xa) {
            let srcval=srcobj[xa];
            if(srcval===undefined) {
                // explicitly undefined values skipped (effectively deleting the member in the target array consistent with object behavior)
                }
            else if(typeof(srcval)==='object') {
                tgtobj[xa]=mergeOrPatchObject(tgtobj[xa],srcval,pch);
                }
            else {
                tgtobj[xa]=srcval;
                }
            }
        return tgtobj;
        }
    else if(isStruct(srcobj)) {
        if(!isStruct(tgtobj)) {
            if(pch) { return srcobj; }
            tgtobj={};
            }
        for(let key of Object.keys(srcobj)) {
            let srcval=srcobj[key];
            if(srcval===undefined) {                                                                                    // explicitly undefined values delete target members
                delete tgtobj[key];
                }
            else if(isContainer(srcval)) {
                tgtobj[key]=mergeOrPatchObject(tgtobj[key],srcval,pch);
                }
            else {
                tgtobj[key]=srcval;
                }
            }
        return tgtobj;
        }
    else {
        return srcobj;
        }
    }

function objString(obj) {
    let arr     = isArray(obj)
    ,   tgt     = (arr ? "[" : "{");

    for(let key of Object.keys(obj)) {
        let val=obj[key];
        if(tgt.length>1) { tgt+=",";    }
        if(!arr        ) { tgt+=key+":"; }
        tgt+=(isContainer(val) ? objString(val) : valString(val));
        }
    return tgt+(arr ? "]" : "}");
    }

function transformObj(obj,selfnc,xfmfnc,reffnc,insitu,pth) {
    let arr     = isArray(obj)
    ,   tgt     = (insitu ? obj : arr ? [] : {});

    for(let key of Object.keys(obj)) {
        let val = obj[key];

        if(selfnc && !selfnc(pth,key,val)) {
            continue;
            }
        if(!reffnc || !reffnc(pth,key,val)) {
            if(isContainer(val)) { val=transformObj(val,selfnc,xfmfnc,reffnc,insitu,pth+key+"/"); }
            if(xfmfnc          ) { val=xfmfnc(pth,key,val);                                       }
            }
        if(val===undefined) {
            if(insitu) { delete tgt[key];}
            }
        else if(val!==tgt[key] || !insitu) {
            tgt[key]=val;
            }
        }
    if(xfmfnc && pth==="/") { tgt=xfmfnc(pth,"",tgt); }                                                                 // finally, transform the root object
    return tgt;
    }

function visitAll(obj,fnc,pth) {
    for(let key of Object.keys(obj)) {
        let val = obj[key];

        if(fnc(pth,key,val)===false) {
            return false;
            }
        else if(isContainer(val) && !visitAll(val,fnc,pth+key+"/")) {
            return false;
            }
        }
    return true;
    }

// *********************************************************************************************************************
init();
return exported;
}
