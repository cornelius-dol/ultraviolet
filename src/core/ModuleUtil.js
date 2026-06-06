// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * ModuleUtil
  * ====================================================================================================================
  *
  * Utility methods for module extension and inheritance.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Construction
  *
  *     new ModuleUtil()
  */

function ModuleUtil()
{
"use strict";
let exported=this || {};                                                                            // allow invocation with or without new

function init() {
    }

/**
  * Test whether `mod` exposes the interface specified named `ifc`, as defined by `mod`.
  *
  * **Arguments & Return:**
  *
  *     mod         The source module.
  *     ifc         The name of the interface which must be exposed (used for error messages).
  *     mbrs        The members of the interface as an array or string, comma-separated string, or an object mapping names to types.
  *     =>          The `mod` supplied (allowing inline assignment by the caller).
  *
  * ###### Types:
  *
  *     any         Any type is permitted. The caller is expected to know how to use this member.
  *     array       Property must be an array.
  *     boolean     Property must be a boolean.
  *     function    Property must be a function.
  *     number      Property must be a number.
  *     object      Property must be an object.
  *     string      Property must be a string.
  *     struct      Property must be an object whose prototype is `Object`.
  *
  * An example interface declaration:
  *
  *     const ComInterface={
  *         close               : "function",
  *         dspData             : "function",
  *         stsData             : "function",
  *         toJson              : "function",
  *         submit              : "function",
  *         sessionActivity     : "function",
  *         sessionSwitch       : "function",
  *         }
  *
  * ###### Throws Error:
  *
  *     If `mod` does not have a member specified by `mbrs` or if the type of a member is incorrect.
  */
exported.exposes=exposes;
function exposes(mod,ifc,mbrs) {
    let e1="InterfaceIncorrect - Object member '",e2="' is not type ",e3="' is not defined",e4="; required by interface '"; // to reduce size of module

    if(typeof(mbrs)==="string" || (mbrs instanceof String)) {
        mbrs=mbrs.replace(/\s/g,"").split(",");
        }
    if(mbrs instanceof Array) {
        mbrs.forEach(function(mbr) {
            if(mod[mbr]==null) { throw new Error(e1+mbr+e3+e4+ifc+"'"); }
            });
        }
    else {
        Object.keys(mbrs).forEach(function(mbr) {
            let val=mod[mbr];
            if(val==null) { throw new Error(e1+mbr+e3+e4+ifc+"'"); }
            switch(mbrs[mbr].toLowerCase()) {
                case "array"    : if(!(val instanceof Array)                              ) { throw new Error(e1+mbr+e2+"'array'"   +e4+ifc+"'"); } break;
                case "boolean"  : if(!(typeof(val)==="boolean" || val instanceof Boolean) ) { throw new Error(e1+mbr+e2+"'boolean'" +e4+ifc+"'"); } break;
                case "function" : if(!(val instanceof Function)                           ) { throw new Error(e1+mbr+e2+"'function'"+e4+ifc+"'"); } break;
                case "number"   : if(!(typeof(val)==="number"  || (val instanceof Number))) { throw new Error(e1+mbr+e2+"'number'"  +e4+ifc+"'"); } break;
                case "object"   : if(!(typeof(val)==="object"  && !(val instanceof Array))) { throw new Error(e1+mbr+e2+"'object'"  +e4+ifc+"'"); } break;
                case "string"   : if(!(typeof(val)==="string"  || (val instanceof String))) { throw new Error(e1+mbr+e2+"'string'"  +e4+ifc+"'"); } break;
                case "struct"   : if(!(typeof(val)==="object"  && val.prototype===Object) ) { throw new Error(e1+mbr+e2+"'struct'"  +e4+ifc+"'"); } break;
                }
            });
        }
    return mod;
    }

/**
  * Copy the immediate members of `src` into `tgt`. The inherited members may be limited using `mbrs` which, if not
  * supplied, defaults to the keys of `src`. Only members of `src` which do not already exist in `tgt` will be copied.
  *
  * ***NOTE:*** Any inherited members also inherit the private context of the *source* module. This is usually correct,
  * but has obvious implications if the same module is used as the parent for multiple derived modules. This will most
  * likely cause problems if modules are used to function as an OOP instance.
  *
  * **Arguments & Return:**
  *
  *     src         The source module.
  *     tgt         The target module.
  *     mbrs        The members of the interface as an array or string, comma-separated string, or an object mapping names to types.
  *     =>          The `src` module supplied (allowing inline assignment by the caller so the src can be used to inherit functionality and state).
  *
  * Throws Error:
  *
  *     If `src` is null or undefined.
  *     If `tgt` is null or undefined.
  */
exported.inherit=inherit;
function inherit(src,tgt,mbrs) {
    if     (mbrs==null              ) { mbrs=Object.keys(src);                  }
    else if(typeof(mbrs)=="string"  ) { mbrs=mbrs.replace(/\s/g,"").split(','); }
    else if(!(mbrs instanceof Array)) { mbrs=Object.keys(mbrs);                 }

    mbrs.forEach(function(mbr) {
        let sm=src[mbr],tm=tgt[mbr];
        if(sm!=null && tm==null) { tgt[mbr]=sm; }
        });
    return src;
    }

// *********************************************************************************************************************
init();
return exported;
}
