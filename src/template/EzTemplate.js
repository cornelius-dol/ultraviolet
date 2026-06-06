// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * EzTemplate
  * ====================================================================================================================
  *
  * Simple, flexible, template support.
  *
  * Allows flexible template based substitutions on a string. Given a string with {{}}abc}} the value matching `abc`
  * will be substituted from a context object. The matching value may be a function, in which case the return value of
  * the function will be substituted.
  *
  * An empty substitution causes the supplied prefix to be substituted.
  *
  * The detail value for all Escape exceptions is the template text.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Dependencies:
  *
  *   * {{@core/Escape|Escape}}
  *
  * ###### Throws:
  *
  *   * Escape.Substitution Template contains a substitution with a name that does not comprise of A-Z, a-z, 0-9, `_` or `.`.
  *                         Detail contains offset, substitution and value.
  *   * Escape.Template     Template contains a substitution marker which is not closed.
  *                         Detail contains offset and value.
  *
  * ###### Construction
  *
  *     new EzTemplate(template)
  *     new EzTemplate(template,failsafe)
  *     new EzTemplate(template,failsafe,prefix,suffix)
  *     new EzTemplate(template,failsafe,prefix,suffix,transform)
  *
  * ###### Arguments:
  *
  *     template            A string template. Required.
  *     failsafe            A string or function resolution to use for a substitution when not found. The default
  *                         function generates "{{}}!xxx not found!}}".
  *     prefix              A string substitution marker prefix. Default "{{}}".
  *     suffix              A string substitution marker suffix. Default "}}".
  *     transform           A function which is permitted to transform each segment of the template.
  *
  * If the default is be a function, it will be invoked as any function provided in the substitution context to the
  * {{}}#exec|`exec`}} method.
  *
  * ###### Failsafe Function: failsafe(ctx,key)
  *
  * If a given substitution (including the failsafe) is a function, it is invoked with the subsitution context and key
  * name as its two arguments.
  *
  *     ctx                 The data substitution context map.
  *     key                 The data substitution context key.
  *
  * ###### Transform Function: transform(ctx,key,val)
  *
  * If a transform function is provided, either in the module constructor it is invoked for each component value of the
  * template. Literal segments can be transformed when the template is created or during resolution, whereas
  * substituted values are transformed when only template is resolved to a final string.
  *
  *     ctx                 The data substitution context map. Null for text segments during creation.
  *     key                 The data substitution context key. Null for text segments during creation and resolution.
  *     val                 The data substitution context key.
  *
  * Examples:
  *
  *     // Encode all segments for HTML
  *     function transform(ctx,key,val) {
  *         return htmlEncode(val);
  *         }
  *
  *     // Encode only substituted values for HTML
  *     function transform(ctx,key,val) {
  *         return (key!=null ? htmlEncode(val) : val);
  *         }
  *
  *     // Treat substitutions from the HTML substructure as HTML tags, inserted verbatim.
  *     function transform(ctx,key,val) {
  *         return (key!=null && !key.startsWith("HTML.") ? htmlEncode(val) : val);
  *         }
  *
  *     // Encode all substitution segments; encode text segments unless the context indicates HTML tags are desired.
  *     function transform(ctx,key,val) {
  *         return (ctx!=null && (!ctx.is_html || key!=null) ? htmlEncode(val) : val);
  *         }
  */

function EzTemplate(template,failsafe,prefix,suffix,transform)
{
"use strict";
let exported=this || {};                                                                            // allow invocation with or without new

let sections;

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    template            =template  || "";
    failsafe            =(failsafe!=null ? failsafe : failsafeDefault);                             // failsafe can legitimately be an empty string; can't use failsafe || failsafeDefault
    prefix              =prefix    || "{{";
    suffix              =suffix    || "}}";
    transform           =transform || transformDefault;

    // INITIALISE SECTIONS
    let tgt=[];
    let pln=prefix.length, sln=suffix.length;
    let vld=/^[A-Za-z0-9_.]*$/;
    let opn, cls, ofs, sbs, pth;
    for(ofs=0; ofs<template.length; ofs=cls+sln) {
        opn=template.indexOf(prefix,ofs);
        if(opn<0) { break; }
        cls=template.indexOf(suffix,opn+pln);
        if(cls<0) {
            throw new Escape("Template","The template contains a substitution marker which is not closed at offset "+opn+" (Template="+template+")",{ offset: opn, value: template });
            }
        tgt.push(transform(null,null,template.substring(ofs,opn)));                                 // text
        sbs=template.substring(opn+pln,cls).trim();                                                 // substitution
        sbs=sbs.replace(/\[(\w+)\]/g,'.$1');                                                        // convert indexes to properties
        if(!vld.test(sbs)) {
            throw new Escape("Substitution","The value '"+sbs+"' is not a valid identifier at offset "+opn+" (Template="+template+")",{ offset: opn, substitution: sbs, value: template});
            }
        pth=sbs.split('.');
        if     (pth.length>1) { sbs={ key: sbs, path: pth }; }                                      // convert to object with name and path
        else if(sbs.length>1) { sbs={ key: sbs            }; }                                      // convert to object with name
        else                  { sbs=prefix;                  }                                      // convert empty substitution to text marker prefix
        tgt.push(sbs);                                                                              // even if empty must push something to maintain the alternation
        }
    if(ofs<template.length) { tgt.push(transform(null,null,template.substring(ofs,template.length))); } // only push the final string if not blank
    if(tgt.length>0 && tgt[0           ].length==0) { tgt.shift(); }                                // delete leading  blank text
    if(tgt.length>0 && tgt[tgt.length-1].length==0) { tgt.pop();   }                                // delete trailing blank text
    sections=tgt;
    }

function failsafeDefault(ctx,key) {
    return prefix+key+suffix;
    }

function transformDefault(ctx,key,val) {
    return val;
    }

// *********************************************************************************************************************
// ACCESSORS
// *********************************************************************************************************************

/**
  * Return an array of the substitution keys in this template.
  */
exported.getKeys=getKeys;
function getKeys() {
    let keys=[];
    for(let xa=0, ln=sections.length; xa<ln; xa++) {
        let val=sections[xa];
        if((typeof val)==="object" && val.key.length>0) { keys.push(val.key); }
        }
    return keys;
    }

/**
 * Return whether the template has a particular substitution key.
 */
exported.hasKey=hasKey;
function hasKey(key) {
    for(let xa=0, ln=sections.length; xa<ln; xa++) {
        if((typeof sections[xa])==="object" && sections[xa].key==key) { return true; }
        }
    return false;
    }

// *********************************************************************************************************************
// TEMPLATE PROCESSING
// *********************************************************************************************************************

/**
  * Resolve the string value of this template using substitutions taken from the provided context map.
  *
  * The substitution context may provide a function for any substitution, which will be invoked with a single string
  * argument, that being the trimmed text provided between the substitution markers in the template.
  *
  * If any value is not found in the context, the default value provided as an argument will be used, or the default
  * supplied to the constructor will be used. If *that* value is a function then it will be invoked as above.  This
  * allows very flexible substitution resolution without overly complicating the mechanism.
  *
  * If invoked with no arguments a string representation of the template object itself is returned.
  *
  * ###### Arguments:
  *
  *     ctx             The context object from which substitution values will be resolved.
  *     fsf             The failsafe string or function to be used if the context object does not contain the
  *                     substitution value.
  */
exported.toString=toString;
function toString(ctx,fsf) {
    if(ctx===undefined) {
        let keys=getKeys();
        if(keys.length==0) { keys="(none)"; }
        return ("EzTemplate[Template="+toString(null,keyToString)+", Keys="+keys+"]"); // self-calls with arguments
        }

    if(sections.length==0                                  ) { return "";          }
    if(sections.length==1 && (typeof sections[0])=="string") { return sections[0]; }

    let out=[sections.length];

    ctx=ctx || {};
    fsf=(fsf!==null && fsf!==undefined) ? fsf : failsafe;

    for(let xa=0, ln=sections.length; xa<ln; xa++) {
        let val=sections[xa];
        if((typeof val)==="string") {
            out[xa]=transform(ctx,null,val);
            }
        else {
            let sbs;
            if(val.path) { sbs=pathToValue(ctx,val.path); }
            else         { sbs=ctx[val.key];              }
            if(sbs==null) { sbs=fsf; }
            if((typeof sbs)==="function") {
                sbs=sbs(ctx,val.key);
                }
            out[xa]=(sbs==null ? "" : transform(ctx,val.key,sbs));
            }
        }

    return out.join("");
    }

/**
  * Return the original template string.
  */
exported.getTemplate=getTemplate;
function getTemplate() {
    return template;
    }

function keyToString(nam) {
    return (prefix+nam+suffix);
    }

function pathToValue(obj,pth) {
    let val=obj;
    for(let xa=0,ln=pth.length; val!=null && xa<ln; xa++) {
        let nam=pth[xa];
        val=((nam in val) ? val[nam] : null);
        }
    return val;
    }

// *********************************************************************************************************************
init();
return exported;
}
