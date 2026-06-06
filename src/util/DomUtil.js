// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * DomUtil
  * ====================================================================================================================
  *
  * Very simple wrappers around HTML5 DOM methods to streamline their use.
  *
  * This module is **not** intended to grow to be a replacement of things like jQuery. Rather it is intended to make
  * searching and locating things in the DOM trivially easy. This is primarily a complimentary technology to a vDOM
  * library, which innate minimizes the interactions with the DOM by its nature.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Dependencies:
  *
  *     None
  *
  * ###### Throws:
  *
  *     None
  *
  * ###### Construction
  *
  *     new DomUtil()
  */

function DomUtil()
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {                                                                                                        // self-contained init avoids leaking temp objects into module closure
    }

// *********************************************************************************************************************
// MODULE FUNCTIONS - DOM SELECTION & MONKEY PATCHES
// *********************************************************************************************************************

/**
  * Find a DOM element matching a selector. If the result of the query is an array, the first element is returned.
  *
  * Arguments & Return:
  *
  *     sel             Selector string.
  *     nod             Node. Optional; defaults to `document`.
  *     =>              An `Element` or null if no element was found.
  *
  * This maps the selector to the matching native function:
  *
  * ----------------|---------------------------------------------------------------------------------------------------
  * `#id`           | Find element using `getElementById`.
  * `.class-list`   | Find element using `getElementsByClassName`.
  * `=tag-name`     | Find element using `getElementsByTagName`.
  * `?selector`     | Find element using `querySelector`.
  * `*selector`     | Find element using `querySelectorAll`.
  */
exported.find=find;
function find(sel,nod) {
    let ret=findAll(sel,nod);
    return (ret.length > 0 ? ret[0] : null);                                                                            // null or element
    }

/**
  * Find all DOM elements matching a selector.
  *
  * Arguments & Return:
  *
  *     sel             Selector string.
  *     nod             Node. Optional; defaults to `document`.
  *     =>              An `Element[]`.
  *
  * This maps the selector to the matching native function:
  *
  * ----------------|---------------------------------------------------------------------------------------------------
  * `#id`           | Find elements using `getElementById`. Always returns a single element in an array.
  * `.class-list`   | Find elements using `getElementsByClassName`.
  * `=tag-name`     | Find elements using `getElementsByTagName`.
  * `?selector`     | Find elements using `querySelector`.
  * `*selector`     | Find elements using `querySelectorAll`.
  */
exported.findAll=findAll;
function findAll(sel,nod) {
    let fnc={
        "#": "getElementById",
        ".": "getElementsByClassName",
        "=": "getElementsByTagName",
        "?": "querySelector",
        "*": "querySelectorAll",
        }[sel[0]];
    let obj=(sel[0]!="#" && nod!=null ?  nod : document);
    let ret=obj[fnc](sel.slice(1).trim());
    if(ret instanceof HTMLCollection || ret instanceof NodeList) {
        let arr=[];
        for(let xa=0,len=ret.length; xa<len; ++xa) { arr[xa]=ret[xa]; }
        ret=arr;
        }
    return ((ret instanceof Array) ? ret : ret!=null ? [ret] : []);                                                     // always an array and never null
    }

/**
  * Find nearest parent matching a search term.
  *
  * Arguments & Return:
  *
  *     sel             Selector string.
  *     nod             Node. Optional; defaults to `document`.
  *     =>              An Element or null.
  *
  * This maps the selector to the matching native function:
  *
  * ----------------|---------------------------------------------------------------------------------------------------
  * `#id`           | Find elements using `getElementById`. Always returns a single element in an array.
  * `.class-list`   | Find elements using `getElementsByClassName`.
  * `=tag-name`     | Find elements using `getElementsByTagName`.
  */
exported.findParent=findParent;
function findParent(sel,nod) {
    let typ = sel[0]
    ,   cmp = sel.slice(1).trim()
    ,   fnd;

    typ==="=" && (cmp=cmp.toLowerCase());                                                                               // html is uppercase and insensitive
    for(nod = nod?.parentElement; nod; nod = nod.parentElement) {
        switch(typ) {
            case "#": { fnd = (nod.id === cmp                 ); } break;
            case ".": { fnd = (nod.classList?.contains(cmp)   ); } break;
            case "=": { fnd = (nod.tagName.toLowerCase()===cmp); } break;                                               // case-insensitive matching for html and xml
            default: throw new Error("[BadArg] Selector must start with `#`, `.`, or `=`.");
            }
        if(fnd) { break; }
        }
    return nod;
    }

/**
  * Monkey patch `Element` and `Document` with `find`, `findAll`, and `findParent` functions from this module. Returns
  * this module to allow chaining. For example: `domU=new DomUtil().mpFind();`. The resulting function searches with the
  * second argument (`nod`) set to the node on which it's invoked.
  *
  * Use the monkey patched functions like so:
  *
  *     document.find("#id").findAll(".inside");        // searches `document`
  *     element.find("#id").findAll(".inside");         // searches `element`
  */
exported.mpFind=mpFind;
function mpFind() {
    let fnc;

    fnc=function(sel) { return find(sel, this); };
    globalThis.Document.prototype.find = fnc;
    globalThis.Element .prototype.find = fnc;

    fnc=function(sel) { return findAll(sel, this); };
    globalThis.Document.prototype.findAll = fnc;
    globalThis.Element .prototype.findAll = fnc;

    fnc=function(sel) { return findParent(sel, this); };
    globalThis.Document.prototype.findParent = fnc;
    globalThis.Element .prototype.findParent = fnc;

    return exported;
    }

// *********************************************************************************************************************
init();
return exported;
}
