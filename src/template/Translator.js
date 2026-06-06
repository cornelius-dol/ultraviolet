// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * Translator
  * ====================================================================================================================
  *
  * Translation support using EzTemplates.
  *
  * Allows flexible template based substitutions on a translated template. Given a template in the base language, this
  * will resolve the target language template and perform substitution returning a final string in the desired language.
  * Template details are entirely those of `EzTemplate`.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Example 1 (Typical):
  *
  *     let Tpt=new Translator(xltMapFromHost);                     // uses {{}}xxx}} substitutions
  *     ...
  *     let ntvlng=Tpt.xlt("InvoiceCancelled","{{}}INVOICETYPE}} invoice #{{}}INVOICENUMBERPREFIX}}{{}}NUMBER}} cancelled.",invrcd);
  *
  * ###### Example 2 (Venue360):
  *
  *     let Tpt=new Translator(xltMapFromHost,null,"$","$");        // uses $xxx$ substitutions
  *     ...
  *     let ntvlng=Tpt.xlt("$INVOICETYPE$ invoice #$INVOICENUMBERPREFIX$$NUMBER$ cancelled.",invrcd);
  *
  * ###### Dependencies:
  *
  *   * {{@core/Escape|Escape}}
  *   * {{@template/EzTemplate|EzTemplate}}
  *
  * ###### Throws:
  *
  *   * Exceptions from {{@core/Escape|Escape}}.
  *
  * ###### Construction
  *
  *     new Translator(templates)
  *     new Translator(templates,failsafe)
  *     new Translator(templates,failsafe,prefix,suffix)
  *     new Translator(templates,failsafe,prefix,suffix,transform)
  *
  * ###### Arguments:
  *
  *     templates           An array of translation template objects. Required.
  *     failsafe            A string or function resolution to use for a substitution when not found. The default
  *                         function generates "{{}}!xxx not found!}}".
  *     prefix              A string substitution marker prefix. Default "{{}}".
  *     suffix              A string substitution marker suffix. Default "}}".
  *     transform           A function which is permitted to transform each segment of the template.
  *
  * ###### Template:
  *
  *     key                 A key identifier or developer-language template. Required.
  *     value               A target-language template. Defaults to the key if omitted, null or blank.
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
  * template. Literal segments are transformed when the template is created, whereas substituted values are transformed
  * when template is resolved to a final string.
  *
  *     ctx                 The data substitution context map. Null for literal segments.
  *     key                 The data substitution context key. Null for literal segments.
  *     val                 The data substitution context key.
  *
  * See {{@template/EzTemplate|/template/EzTemplate}} for more details on how templates are handled.
  */

function Translator(templates,failsafe,prefix,suffix,transform)
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {                                                                                                       // self-contained initialization avoids leaking temp objects due to module closure
    let tpts={};

    for(let xa=0,len=templates.length; xa<len; xa++) {
        let tpt=templates[xa];
        let key=tpt.key   || tpt.Key;                                                                                   // resilient against lead-uppercase from host
        let val=tpt.value || tpt.Value;                                                                                 // resilient against lead-uppercase from host
        if(key && !tpts[key]) { tpts[key]=(val || key); }                                                               // duplicates are ignored; value defaults to key
        }
    templates=tpts;                                                                                                     // replace templates array with the templates map
    }

// *********************************************************************************************************************
// INSTANCE FUNCTIONS - PUBLIC
// *********************************************************************************************************************

/**
  * Perform subsitutions on the template identified by the supplied key, after resolving it via the templates with which
  * this object was constructed. If the key cannot be located, the specified fallback is used. If the specified fallback
  * is null or omitted, the key is the fallback.
  *
  * Substitution is done on the resolved template as by `EzTemplate.toString(ctx,fsf)`.
  *
  * Arguments & Return:
  *
  *     key             Template lookup key, used to find translation. May itself be a template string. Required.
  *     fbk (1)         Fallback template if key is not found. Defaults to key if `null` or `undefined`.
  *     ctx             Context object for resolving template substitution values. Defaults to an empty object.
  *     fsf             The failsafe string or function to be used if the context object does not contain a
  *                     substitution value. Defaults to the object's failsafe, which in turn defaults via EzTemplate.
  *     =>              The final resolved and substituted string.
  *
  * NOTE 1: The fallback argument can be omitted entirely if templates are being used as keys or if key is an object
  *         containing a `key` and `fallback` value (i.e. an object created by `xpt`).
  *
  * ###### Throws:
  *
  *   * Exceptions from {{@core/Escape|/core/Escape}} if the translation map does not contain the specified template and
  *     there is a syntatic problem with the supplied fallback.
  *
  */
exported.xlt=xlt;
function xlt(key,fbk,ctx,fsf) {
    let                 ezt;

    if(typeof(fbk)!=="string") { fsf=ctx; ctx=fbk; fbk=key; }                                                           // allow fallback to be omitted entirely

    if(key instanceof EzTemplate) { ezt=key;          }
    else                          { ezt=xpt(key,fbk); }

    if(ctx===undefined) { ctx=null; }
    return ezt.toString(ctx,fsf);
    }

/**
  * Resolve a translation into it's underlying translated template. This is used primarily to ensure consistency when
  * the same transplate is used in multiple places when pure keys are being used (i.e, when the key is a simple string
  * and separate from the fallback translations). It may also be used just to centralize all, or groups of related
  * translations in the code.
  *
  * Arguments & Return:
  *
  *     key             Template lookup key, used to find translation. May itself be a template string. Required.
  *     fbk             Fallback template if key is not found. Defaults to key if `null` or `undefined`.
  *     =>              A translated template.
  */
exported.xpt=xpt;
function xpt(key,fbk) {
    let                 ezt;

    if(key instanceof String) { key=String(fbk); }

    ezt=templates[key];
    if(!ezt) {
        if(fbk instanceof String ) { fbk=String(fbk); }
        if(typeof(fbk)!=="string") { fbk=key;         }                                                                 // allow fallback to be omitted entirely
        if(!fbk) { fbk=key; }
        ezt=templates[key]=createTpt(key,fbk);
        }
    return ezt;
    }

/**
  * Resolves translation templates internally to create the supporting template objects. Can be used to detect errors in
  * templates upfront instead of waiting until the faulty one is used. This function does not fail; rather it logs an
  * error and changes the template to escape the starting characters for the placeholders.
  *
  * The keys themselves may optionally be resolved as well for early detection of errors in the source-language template.
  *
  * Arguments & Return:
  *
  *     vdtkey          A boolean flag indicating that keys should be validated.
  *     errfnc          A function invoked if a template is invalid.
  *     =>              The translator so it can be used with an inline assignment.
  *
  * Arguments & Return for `dupfnc`:
  *
  *     cod             Error code: `Template` or `Substitution`.
  *     msg             Error message.
  *     key             The key of the failing template.
  *     val             The value of the failing template.
  *     =>              none.
  *
  * Template Error Codes
  *
  *     Template        The template was invalid due to an unclosed substitution placeholder.
  *     Substitution    A substitution placeholder was not comprised of the characters A-Z, a-z, 0-9, `.` or `_`.
  */
exported.resolveAll=resolveAll;
function resolveAll(vdtkey,errfnc) {
    for(let key of Object.keys(templates)) {
        if(!(templates[key] instanceof EzTemplate)) {
            if(vdtkey) { createTpt(key,key,errfnc); }                                                                   // just to validate it
            templates[key]=createTpt(key,templates[key],errfnc);
            }
        }
    return exported;
    }

// *********************************************************************************************************************
// INSTANCE FUNCTIONS - PRIVATE
// *********************************************************************************************************************

function createTpt(key,val,errfnc) {
    try {
        return new EzTemplate(val,failsafe,prefix,suffix,transform);
        }
    catch(exc) {
        if(errfnc) { errfnc(exc.getCode(),exc.getText(),key,templates[key]); }
        else       { console.error("XLT: Invalid template: "+exc);           }
        val=val.split(prefix).join(prefix+suffix);                                                                      // only way in JS to replace *all* without a regex.
        return new EzTemplate(val,null    ,prefix,suffix,transform);                                                    // don't use failsafe; want, e.g. "blah blah {{ABC}} blah {{DEF}} blah" as final output
        }
    }

// *********************************************************************************************************************
init();
return exported;
}
