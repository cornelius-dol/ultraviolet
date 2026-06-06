// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * NumberUtil
  * ====================================================================================================================
  *
  * Number utility functions.
  *
  * <span class="status-stable">Module Status: </span>
  *
  *     None
  *
  * ###### Construction
  *
  *     new NumberUtil()
  */

function NumberUtil()
{
"use strict";                                                                                                           // must encapsulate in one function for strict to apply to all code
let exported=this || {};                                                                                                // allow invocation with or without new

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    }

// *********************************************************************************************************************
// METHODS
// *********************************************************************************************************************

/**
  * Compare two numbers after coercing both to number types.
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

    one=Number(one);
    two=Number(two);

    return (one<two) ? -1 : (one>two) ? 1 : 0;
    }

/**
  * Decrement a counter, optionally (and by default) wrapping to the specified maximum value when zero is reached. The
  * minimum and maximum value will be included in the counter's range. Input values out of range become the `max` value.
  *
  * **Arguments & Return:**
  *
  *     cnt             The counter.
  *     min             Optional minimum value for range; defaults to 0.
  *     max             Optional maximum value for range; defaults to Number.MAX_SAFE_INTEGER.
  *     wrp             Optional wrap flag; defaults to truw.
  *     =>              The decremented & wrapped counter value.
  */
exported.dec=dec;
function dec(cnt,min,max,wrp) {
    min ??= 0;
    max ??= Number.MAX_SAFE_INTEGER;
    wrp ??= true;
    return (cnt<min || cnt>max || cnt==null ? max : cnt>min ? cnt - 1 : wrp ? max : min);
    }

/**
  * Increment a counter, optionally (and by default) wrapping to zero when the specified maximum value is reached. The
  * minimum and maximum value will be included in the counter's range. Input values out of range become the `min` value.
  *
  * **Arguments & Return:**
  *
  *     cnt             The counter.
  *     min             Optional minimum value for range; defaults to 0.
  *     max             Optional maximum value for range; defaults to Number.MAX_SAFE_INTEGER.
  *     wrp             Optional wrap flag; defaults to truw.
  *     =>              The incremented & wrapped counter value.
  */
exported.inc=inc;
function inc(cnt,min,max) {
    min ??= 0;
    max ??= Number.MAX_SAFE_INTEGER;
    wrp ??= true;
    return (cnt<min || cnt>max || cnt==null ? min : cnt<max ? cnt + 1 : wrp ? min : max);
    }

/**
  * Test a relationship between two numbers after coercing both to number types as necessary.
  *
  * Non-numeric comparators **are not supported**.
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
  *      ZR             | Test `one` for zero (`two` is ignored);
  *      EQ             | Test for equals.
  *      GT             | Test for greater-than.
  *      GE             | Test for greater-or-equals.
  *      LT             | Test for less-than.
  *      LE             | Test for less-or-equals.
  *
  * Throws Error if the compare code is not one of the recognized values.
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
        case "ZR": return testZR(one);
        case "EQ": return testEQ(one,two);
        case "GT": return testGT(one,two);
        case "GE": return !testLT(one,two);
        case "LT": return testLT(one,two);
        case "LE": return !testGT(one,two);

        default  : throw new Error("CompareCode: Compare code '"+cmp+"' is not valid",{ compare: cmp });
        }
    }

/**
  * Test for `one` equals `two`.
  */
exported.testEQ=testEQ;
function testEQ(one,two) {
    if(one==null) { return (two==null); }
    if(two==null) { return false;       }

    one=Number(one);
    two=Number(two);
    return (one===two);
    }

/**
  * Test for `one` greater-than `two` (and `one` less-or-equal `two`).
  */
exported.testGT=testGT;
function testGT(one,two) {
    if(one==null) { return false;       }
    if(two==null) { return (one!=null); }

    one=Number(one);
    two=Number(two);
    return (one>two);
    }

/**
  * Test for `one` less-than `two` (and `one` greater-or-equal `two`).
  */
exported.testLT=testLT;
function testLT(one,two) {
    if(one==null) { return (two!=null); }
    if(two==null) { return false;       }

    one=Number(one);
    two=Number(two);
    return (one<two);
    }

/**
  * Test for is null, undefined, or zero.
  */
exported.testZR=testZR;
function testZR(one) {
    return (!one || one==0);
    }

// *********************************************************************************************************************
init();
return exported;
}
