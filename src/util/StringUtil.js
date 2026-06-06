// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * StringUtil
  * ====================================================================================================================
  *
  * String utility functions.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Construction
  *
  *     new StringUtil()
  */

function StringUtil()
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    }

// *********************************************************************************************************************
// COMPARE && TEST
// *********************************************************************************************************************

/**
  * Compare two strings case-insensitively.
  *
  * **Arguments & Return:**
  *
  *     one             The first (left) value.
  *     two             The second (right) value.
  *     =>              Either -1, 0 or 1 as `one` is less than, equal to or greater than `two`.
  */
exported.compare=compare;
function compare(one,two) {
    if(one==null) { return (two==null ?  0 :  1 ); }
    if(two==null) { return -1;                     }
    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return (one<two ? -1 : one>two ? 1 : 0);
    }

/**
  * Join the strings of `arr` after applying a formatting function to each, with `sep` between the appended values.
  *
  * If a value (after any formatting) is `undefined`, or `null`, the element is dropped. If the formatter omitted, then
  * a default formatter is used, which will null any blank strings, causing them to be dropped. If the formatter is
  * null, this step is skipped.
  *
  * **Arguments & Return:**
  *
  *     septxt          Separator text to use between elements.
  *     xfmfnc          Optional function to use to transform each value.
  *     joival          Array or the first of multiple arguments join.
  *     =>              Joined result.
  *
  * Valid Argument Combinations:
  *
  *     septxt,joival
  *     septxt,null  ,joival
  *     septxt,xfmfnc,joival
  */
exported.join=join;
function join(septxt,xfmfnc,joival) {
    if((typeof xfmfnc)==="function") {
        joival=(Array.isArray(joival) ? joival : Array.prototype.slice.call(arguments,2));
        }
    else if(xfmfnc==null) {
        joival=(Array.isArray(joival) ? joival : Array.prototype.slice.call(arguments,2));
        }
    else {
        joival=(Array.isArray(xfmfnc) ? xfmfnc : Array.prototype.slice.call(arguments,1));
        xfmfnc=function(val) { return (val!=null && (val=String(val))=="" ? null : val); }
        }
    if(xfmfnc!=null) { joival=joival.map(xfmfnc); }
    return joival.filter(notNullOrUndef).join(septxt);
    }


/**
  * <span class="status-deprecated"></span> -- Use {{#`testEG_Values(val)`|testEG_Values}} instead.
  */
exported.normalizeEG=testEG_Values;

/**
  * Pluralize a string for English for the numeric value `nbrval`.
  *
  * **Arguments & Return:**
  *
  *     nbrval      Value to transform to a pluralized string.
  *     sngtxt      Concat string if value is singular.
  *     plutxt      Concat string if value is plural. Defaults to `sngtxt + "s"`.
  *     zrotxt      Return string if value is zero. Defaults `"no " + plutxt`.
  *     incnbr      Whether to include `nbrval`. If false only the `sngtxt`, `plutxt` or `zrotxt` is returned. Defaults to true.
  *
  * Examples:
  *
  *     pluralize( 0,"record"); // returns "no records" (even though incnbr=true, because "no" represents 0)
  *     pluralize( 1,"record"); // returns "1 record"
  *     pluralize(23,"record"); // returns "23 records"
  *     pluralize(xx,"one record",xx+" records","no records",false); // returns "one records", "xx records" or "no records"
  */
exported.pluralize=pluralize;
function pluralize(nbrval,sngtxt,plutxt,zrotxt,incnbr) {
    if(incnbr==null) { incnbr=true; }
    if(nbrval==1 || nbrval==-1  ) { return (incnbr ? nbrval+" "+sngtxt : sngtxt); }
    if(nbrval==0 && zrotxt!=null) { return zrotxt;                                }
    if(plutxt==null) { plutxt=sngtxt+"s"; }
    if(nbrval==0                ) { return (incnbr ? "no "     +plutxt : plutxt); }
    else                          { return (incnbr ? nbrval+" "+plutxt : plutxt); }
    }

/**
  * Test a relationship between two strings case insensitively.
  *
  * Generic comparison supports `*xxx*`, `*xxx`, `xxx*` and `xxx`, equivalent to `CT`, `EW`, `SW` and `EQ` respectively.
  * A generic value may be normalized to one of these specific tests for more efficient repeated comparisons using
  * {{#normalizeEG(val)}}.
  *
  * **Arguments & Return:**
  *
  *     one             The first (left) value.
  *     cmp             Comparator. May be inverted using a leading `!`.
  *     two             The second (right) value.
  *     =>              Either -1, 0 or 1 as one is less than, equal to or greater than two.
  *
  * Comparator          | Description
  * --------------------|-----------------------------------------------------------------------------------------------
  *     BL              | Test `one` for blank (`two` is ignored).
  *     DF              | Test `one` for defined (`two` is ignored);
  *     ZR              | Test `one` for zero (`two` is ignored);
  *     &nbsp;          | &nbsp;
  *     EQ              | Test for equals.
  *     GT              | Test for greater-than.
  *     GE              | Test for greater-or-equals.
  *     LT              | Test for less-than.
  *     LE              | Test for less-or-equals.
  *     &nbsp;          | &nbsp;
  *     CT              | Test for `one` contains `two`;
  *     EG              | Test for `one` equals-generic `two`;
  *     EW              | Test for `one` ends-with `two`;
  *     SW              | Test for `one` starts-with `two`;
  *
  * Throws Error if a compare code is not one of the recognized values.
  */
exported.test=test;
function test(one,cmp,two) {
    let inv=(cmp && cmp.charAt(0)=="!");
    let res;

    if(inv) { cmp=cmp.substring(1); }
    cmp=cmp.toUpperCase();
    res=_test(one,cmp,two);
    return (inv ? !res : res);
    }

function _test(one,cmp,two) {
    switch(cmp) {
        case "BL": return  testBL(one);
        case "DF": return  testDF(one);
        case "ZR": return  testZR(one);

        case "EQ": return  testEQ(one,two);
        case "GT": return  testGT(one,two);
        case "GE": return !testLT(one,two);
        case "LT": return  testLT(one,two);
        case "LE": return !testGT(one,two);

        case "CT": return  testCT(one,two);
        case "EG": return  testEG(one,two);
        case "EW": return  testEW(one,two);
        case "SW": return  testSW(one,two);

        default  : throw new Error("CompareCode: Compare code '"+cmp+"' is not valid",{ compare: cmp });
        }
    }

/**
  * Test for `one` is blank.
  */
exported.testBL=testBL;
function testBL(one) {
    return (one==null || one=="");
    }

/**
  * Test for `one` contains `two`.
  */
exported.testCT=testCT;
function testCT(one,two) {
    if(one==null) { return false; }
    if(two==null) { return false; }

    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return (one.indexOf(two)!==-1);
    }

/**
  * Test for `one` is defined.
  */
exported.testDF=testDF;
function testDF(one) {
    return (one!==undefined);
    }

/**
  * Test for `one` equals-generic `two`.
  */
exported.testEG=testEG;
function testEG(one,two) {
    if(one==null) { return (two==null); }
    if(two==null) { return false;       }

    let opt=testEG_Values(two);
    return opt.fnc(one,opt.value);
    }

/**
  * Get a replacement comparator, function, and value from a generic value as `{ compare: "xx", fnc: testXX, value: "modified-val" }` pair.
  * This is valuable when processing a large number of comparisons to avoid repeated doing the same substring operations on `val`.
  */
exported.testEG_Values=testEG_Values;
function testEG_Values(val) {
    if     (val==null                               ) { return { compare: "EQ", fnc: testEQ, value: null }; }
    else if(val.startsWith("*") && val.endsWith("*")) { return { compare: "CT", fnc: testCT, value: val.substring(1,val.length-1) }; }
    else if(val.startsWith("*")                     ) { return { compare: "EW", fnc: testEW, value: val.substring(1)              }; }
    else if(                       val.endsWith("*")) { return { compare: "SW", fnc: testSW, value: val.substring(0,val.length-1) }; }
    else                                              { return { compare: "EQ", fnc: testEQ, value: val                           }; }
    }

/**
  * Test for `one` equals `two`.
  */
exported.testEQ=testEQ;
function testEQ(one,two) {
    if(one==null) { return (two==null); }
    if(two==null) { return false;       }

    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return (one===two);
    }

/**
  * Test for `one` ends-with `two`.
  */
exported.testEW=testEW;
function testEW(one,two) {
    if(one==null) { return false; }
    if(two==null) { return false; }

    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return one.endsWith(two);
    }

/**
  * Test for `one` greater-than `two` (and `one` less-or-equal `two`).
  */
exported.testGT=testGT;
function testGT(one,two) {
    if(one==null) { return false;       }
    if(two==null) { return (one!=null); }

    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return (one>two);
    }

/**
  * Test for `one` less-than `two` (and `one` greater-or-equal `two`).
  */
exported.testLT=testLT;
function testLT(one,two) {
    if(one==null) { return (two!=null); }
    if(two==null) { return false;       }

    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return (one<two);
    }

/**
  * Test for `one` starts-with `two`.
  */
exported.testSW=testSW;
function testSW(one,two) {
    if(one==null) { return false; }
    if(two==null) { return false; }

    one=one.toString().toLocaleLowerCase();
    two=two.toString().toLocaleLowerCase();
    return one.startsWith(two);
    }

/**
  * Test for `one` is null, undefined, blank or zero.
  */
exported.testZR=testZR;
function testZR(one) {
    return (!one || one=="0");
    }

// *********************************************************************************************************************
// FORMAT
// *********************************************************************************************************************

/**
  * Pad text on the left (align right).
  *
  * **Arguments & Return:**
  *
  *     val             The value to pad.
  *     wid             The width of the result. Defaults to 0.
  *     pad             The character to pad with. Defaults to " ". Only the first character is used.
  *     =>              The value, as a string, left-padded with `pad`.
  */
exported.padL=padL;
function padL(val,wid,pad) {
    val = String(val);
    wid = Number(wid);                                                                                                  // produces 0 for null, undefined.
    pad = String(pad || pad===0 ? pad : " ")[0];
    return (wid<=val.length ? val : pad.repeat(wid - val.length)+val);
    }

/**
  * Pad text on the right (align left).
  *
  * **Arguments & Return:**
  *
  *     val             The value to pad.
  *     wid             The width of the result. Defaults to 0.
  *     pad             The character to pad with. Defaults to " ". Only the first character is used.
  *     =>              The value, as a string, right-padded with `pad`.
  */
exported.padR=padR;
function padR(val,wid,pad) {
    val = String(val);
    wid = Number(wid);                                                                                                  // produces 0 for null, undefined.
    pad = String(pad || pad===0 ? pad : " ")[0];
    return (wid<=val.length ? val : val+pad.repeat(wid - val.length));
    }

// *********************************************************************************************************************
// PUBLIC DEPRECATED
// *********************************************************************************************************************

function $deprecated(old,alt,fnc) {
    let log     = (console ? console.log : null)
    ,   oldnam  = old.split(".")[1];

    exported[oldnam]=function $deprecated() {
        if( log) { log("[Whio]",old,"is deprecated; use ",alt); log=null;                                 }             // only logs once, but null log in case function reference is extracted!
        if(!fnc) { throw new Error("[WhioDeprecation] Cannot use "+old+" because "+alt+" was not found"); }             // defer error until use
        exported[oldnam]=fnc;                                                                                           // remove deprecation wrapper after first use
        return fnc.apply(null,arguments);
        };
    }

$deprecated("StringUtil.joinNB", "StringUtil.join", function joinNB(arr,sep) { return join(sep,arr); });

// *********************************************************************************************************************
// PRIVATE
// *********************************************************************************************************************

function notNullOrUndef(val) {
    return val!=null;
    }

// *********************************************************************************************************************
init();
return exported;
}
