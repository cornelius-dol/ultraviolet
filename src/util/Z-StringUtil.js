// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

import { BddEnv } from "/bdd/BddEnv.js";
import { Litmus } from "/bdd/Litmus.js";

const env           = new BddEnv()
,     test          = new Litmus({ diag: false, failFast: true, outputPass: false })
,     undef         = undefined
,     log           = console.log

const strU          = env.createModule("./StringUtil.js");

test.batch("Compare two values, case-insensitively, locale-sensitively.", {
    "for equality": {
        "'A'  =  'a'"                                                       : () => test.valEQ(0                        , strU.compare("A" ,"A" )),
        "'A'  =  'A'"                                                       : () => test.valEQ(0                        , strU.compare("A" ,"a" )),
        "10   =  '10'"                                                      : () => test.valEQ(0                        , strU.compare(10  ,"10")),
        "'Â'  =  'â'"                                                       : () => test.valEQ(0                        , strU.compare("Â" ,"â" )),
        },
    "for less than": {
        "'A'  <  'B'"                                                       : () => test.valLT(0                        , strU.compare("A" ,"B" )),
        "'A'  <  'b'"                                                       : () => test.valLT(0                        , strU.compare("A" ,"b" )),
        "'A'  <  'A '"                                                      : () => test.valLT(0                        , strU.compare("A" ,"A ")),
        "10   <  '2'"                                                       : () => test.valLT(0                        , strU.compare("10",2   )),
        "'A'  <  'â'"                                                       : () => test.valLT(0                        , strU.compare("A" ,"â" )),
        },
    "for greater than": {
        "'B'  >  'A'"                                                       : () => test.valGT(0                        , strU.compare("B" ,"A" )),
        "'b'  >  'A'"                                                       : () => test.valGT(0                        , strU.compare("b" ,"A" )),
        "'A ' >  'A'"                                                       : () => test.valGT(0                        , strU.compare("A ","A" )),
        "2    >  '10'"                                                      : () => test.valGT(0                        , strU.compare(2   ,"10")),
        "'Â'  >  'a'"                                                       : () => test.valGT(0                        , strU.compare("Â" ,"a" )),
        },
    "special treatment for `null` ": {
        "null =  null"                                                      : () => test.valEQ(0                        , strU.compare(null,null)),
        "''   <  null"                                                      : () => test.valLT(0                        , strU.compare(''  ,null)),
        "null >  ''"                                                        : () => test.valGT(0                        , strU.compare(null,''  )),
        },
    });

test.batch("Joining strings.", {
    "using default tranformer": {
        "blank separator"                                                   : () => test.valEQ("ABC"                    , strU.join("" ,["A","B","C"])                          ),
        "comma separator"                                                   : () => test.valEQ("A,B,C"                  , strU.join(",",["A","B","C"])                          ),
        "with blanks"                                                       : () => test.valEQ("A,B"                    , strU.join(",",["A","",null,undefined,"B"])            ),
        "with arguments"                                                    : () => test.valEQ("A,B"                    , strU.join(",","A","",null,undefined,"B")              ),
        },
    "using no tranformation": {
        "blank separator"                                                   : () => test.valEQ("ABC"                    , strU.join("" ,null,["A","B","C"])                     ),
        "comma separator"                                                   : () => test.valEQ("A,B,C"                  , strU.join(",",null,["A","B","C"])                     ),
        "with blanks"                                                       : () => test.valEQ("A,,B"                   , strU.join(",",null,["A","",null,undefined,"B"])       ),
        "with arguments"                                                    : () => test.valEQ("A,,B"                   , strU.join(",",null,"A","",null,undefined,"B")         ),
        },
    "using custom transformer": {
        "blank separator"                                                   : () => test.valEQ("abc"                    , strU.join("" ,toLowerCase,["A","B","C"])              ),
        "comma separator"                                                   : () => test.valEQ("a,b,c"                  , strU.join(",",toLowerCase,["A","B","C"])              ),
        "with blanks"                                                       : () => test.valEQ("a,,null,undefined,b"    , strU.join(",",toLowerCase,["A","",null,undefined,"B"])),
        "with arguments"                                                    : () => test.valEQ("a,,null,undefined,b"    , strU.join(",",toLowerCase, "A","",null,undefined,"B" )),
        },
    });

test.batch("Pluralization provides simplistic one/not-one phrase creation.", {
    "Simple zero-case"                                                      : () => test.valEQ("no items"               , strU.pluralize(0,"item")                           ),
    "Simple one-case"                                                       : () => test.valEQ("1 item"                 , strU.pluralize(1,"item")                           ),
    "Simple many-case"                                                      : () => test.valEQ("2 items"                , strU.pluralize(2,"item")                           ),
    "Custom plural value"                                                   : () => test.valEQ("2 items"                , strU.pluralize(2,"unused","items")                 ),
    "Custom zero text value"                                                : () => test.valEQ("none for you!"          , strU.pluralize(0,"unused","unused","none for you!")),
    "Zero without number"                                                   : () => test.valEQ("items"                  , strU.pluralize(0,"item",null,null,false)           ),
    "One without number"                                                    : () => test.valEQ("item"                   , strU.pluralize(1,"item",null,null,false)           ),
    "Many without number"                                                   : () => test.valEQ("items"                  , strU.pluralize(2,"item",null,null,false)           ),
    });

test.batch("Comparing strings with a comparator code, case-insensitively (these also exercise the indiviual `testXX` functions).", {
    "Check with same case": {
        "'' is blank"                                                       : () => test.valEQ(true                     , strU.test(""   ,"BL"       )),
        "'A' is defined"                                                    : () => test.valEQ(true                     , strU.test("A"  ,"DF"       )),
        "'0' is zero"                                                       : () => test.valEQ(true                     , strU.test("0"  ,"ZR"       )),
        "'A' is equal to 'A'"                                               : () => test.valEQ(true                     , strU.test("A"  ,"EQ" ,"A"  )),
        "'B' is greater than 'A'"                                           : () => test.valEQ(true                     , strU.test("B"  ,"GT" ,"A"  )),
        "'A' is greater than or equal to 'A'"                               : () => test.valEQ(true                     , strU.test("A"  ,"GE" ,"A"  )),
        "'B' is greater than or equal to 'A'"                               : () => test.valEQ(true                     , strU.test("B"  ,"GE" ,"A"  )),
        "'A' is less than 'B'"                                              : () => test.valEQ(true                     , strU.test("A"  ,"LT" ,"B"  )),
        "'A' is less than or equal to 'A'"                                  : () => test.valEQ(true                     , strU.test("A"  ,"LE" ,"A"  )),
        "'A' is less than or equal to  'C'"                                 : () => test.valEQ(true                     , strU.test("A"  ,"LE" ,"C"  )),
        "'ABC' contains 'A'"                                                : () => test.valEQ(true                     , strU.test("ABC","CT" ,"A"  )),
        "'ABC' equals the generic value 'CA*'"                              : () => test.valEQ(true                     , strU.test("ABC","EG" ,"AB*")),
        "'ABC' equals the generic value '*AB'"                              : () => test.valEQ(true                     , strU.test("ABC","EG" ,"*BC")),
        "'ABC' equals the generic value '*A*'"                              : () => test.valEQ(true                     , strU.test("ABC","EG" ,"*A*")),
        "'ABC' equals the generic value '*B*'"                              : () => test.valEQ(true                     , strU.test("ABC","EG" ,"*B*")),
        "'ABC' equals the generic value '*C*'"                              : () => test.valEQ(true                     , strU.test("ABC","EG" ,"*C*")),
        "'ABC' ends with 'BC'"                                              : () => test.valEQ(true                     , strU.test("ABC","EW" ,"BC" )),
        "'ABC' starts with 'AB'"                                            : () => test.valEQ(true                     , strU.test("ABC","SW" ,"AB" )),
        },

    "Check with different case": {
        "'a' is equal to 'A'"                                               : () => test.valEQ(true                     , strU.test("a"  ,"EQ" ,"A"  )),
        "'b' is greater than 'A'"                                           : () => test.valEQ(true                     , strU.test("b"  ,"GT" ,"A"  )),
        "'a' is greater than or equal to 'A'"                               : () => test.valEQ(true                     , strU.test("a"  ,"GE" ,"A"  )),
        "'b' is greater than or equal to 'A'"                               : () => test.valEQ(true                     , strU.test("b"  ,"GE" ,"A"  )),
        "'a' is less than 'B'"                                              : () => test.valEQ(true                     , strU.test("a"  ,"LT" ,"B"  )),
        "'a' is less than or equal to 'A'"                                  : () => test.valEQ(true                     , strU.test("a"  ,"LE" ,"A"  )),
        "'a' is less than or equal to  'C'"                                 : () => test.valEQ(true                     , strU.test("a"  ,"LE" ,"C"  )),
        "'abc' contains 'A'"                                                : () => test.valEQ(true                     , strU.test("abc","CT" ,"A"  )),
        "'abc' equals the generic value 'AB*'"                              : () => test.valEQ(true                     , strU.test("abc","EG" ,"AB*")),
        "'abc' equals the generic value '*BC'"                              : () => test.valEQ(true                     , strU.test("abc","EG" ,"*BC")),
        "'abc' equals the generic value '*A*'"                              : () => test.valEQ(true                     , strU.test("abc","EG" ,"*A*")),
        "'abc' equals the generic value '*B*'"                              : () => test.valEQ(true                     , strU.test("abc","EG" ,"*B*")),
        "'abc' equals the generic value '*C*'"                              : () => test.valEQ(true                     , strU.test("abc","EG" ,"*C*")),
        "'abc' ends with 'BC'"                                              : () => test.valEQ(true                     , strU.test("abc","EW" ,"BC" )),
        "'abc' starts with 'AB'"                                            : () => test.valEQ(true                     , strU.test("abc","SW" ,"AB" )),
        },

    "Ensure that values that shouldn't pass, don't": {
        "'A is not blank"                                                   : () => test.valEQ(false                    , strU.test("A"  ,"BL"       )),
        "'A' is not defined"                                                : () => test.valEQ(false                    , strU.test(undefined,"DF"   )),
        "'1' is not zero"                                                   : () => test.valEQ(false                    , strU.test("1"  ,"ZR"       )),
        "'!' is not equal to 'A'"                                           : () => test.valEQ(false                    , strU.test("!"  ,"EQ" ,"A"  )),
        "'A' is not greater than 'A'"                                       : () => test.valEQ(false                    , strU.test("A"  ,"GT" ,"A"  )),
        "'!' is not greater than or equal to 'A'"                           : () => test.valEQ(false                    , strU.test("!"  ,"GE" ,"A"  )),
        "'B' is not less than 'B'"                                          : () => test.valEQ(false                    , strU.test("B"  ,"LT" ,"B"  )),
        "'C' is not less than or equal to 'A'"                              : () => test.valEQ(false                    , strU.test("C"  ,"LE" ,"A"  )),
        "'DEF' does not contain 'A'"                                        : () => test.valEQ(false                    , strU.test("DEF","CT" ,"A"  )),
        "'DEF' does not equal the generic value 'CA*'"                      : () => test.valEQ(false                    , strU.test("DEF","EG" ,"AB*")),
        "'DEF' does not equal the generic value '*AB'"                      : () => test.valEQ(false                    , strU.test("DEF","EG" ,"*BC")),
        "'DEF' does not equal the generic value '*A*'"                      : () => test.valEQ(false                    , strU.test("DEF","EG" ,"*A*")),
        "'DEF' does not equal the generic value '*B*'"                      : () => test.valEQ(false                    , strU.test("DEF","EG" ,"*B*")),
        "'DEF' does not equal the generic value '*C*'"                      : () => test.valEQ(false                    , strU.test("DEF","EG" ,"*C*")),
        "'DEF' does not end with 'AB'"                                      : () => test.valEQ(false                    , strU.test("DEF","EW" ,"AB" )),
        "'DEF' does not start with 'CA'"                                    : () => test.valEQ(false                    , strU.test("DEF","SW" ,"CA" )),
        },

    "Verify Exceptions": {
        "'XX' is not supported"                                             : () => test.fails("Error"                  , strU.test,0,"XX"),
        },

    "Optimize a generic value to get the corresponding compare code and simple value.": {
        "No asterisk"                                                       : () => test.objEQ({ compare: "EQ", fnc: strU.testEQ, value: "abc" }, strU.testEG_Values("abc"  )),
        "Leading asterisk"                                                  : () => test.objEQ({ compare: "EW", fnc: strU.testEW, value: "abc" }, strU.testEG_Values("*abc" )),
        "Trailing asterisk"                                                 : () => test.objEQ({ compare: "SW", fnc: strU.testSW, value: "abc" }, strU.testEG_Values("abc*" )),
        "Leading & Trailing asterisk"                                       : () => test.objEQ({ compare: "CT", fnc: strU.testCT, value: "abc" }, strU.testEG_Values("*abc*")),
        },
    });

test.batch("Padding.", {
    "Left Padding...": {
        "an empty string to a liength of 0 => empty string"                 : () => test.valEQ(""                       , strU.padL("",0)          ),
        "a non-empty string to a shorter length => same string"             : () => test.valEQ("ABC"                    , strU.padL("ABC",0)       ),
        "a non-empty string to a negative length => same string"            : () => test.valEQ("ABC"                    , strU.padL("ABC",-10)     ),
        "a non-empty string its length => same string"                      : () => test.valEQ("ABC"                    , strU.padL("ABC",3)       ),
        "to a longer length with a single char fills to left"               : () => test.valEQ("       ABC"             , strU.padL("ABC",10)      ),
        "to a longer length with surplus chars fills with first"            : () => test.valEQ("PPPPPPPABC"             , strU.padL("ABC",10,"PAD")),
        "to a longer length with empty string fills with space"             : () => test.valEQ("       ABC"             , strU.padL("ABC",10,"")   ),
        "to a longer length with no fill string fills with space"           : () => test.valEQ("       ABC"             , strU.padL("ABC",10)      ),
        "to a longer length with integer 0 fills with '0'"                  : () => test.valEQ("0000000ABC"             , strU.padL("ABC",10,0)    ),
        "to a longer length with single int digit fills with digit"         : () => test.valEQ("7777777ABC"             , strU.padL("ABC",10,7)    ),
        "to a longer length with multiple int digits fills with digit"      : () => test.valEQ("7777777ABC"             , strU.padL("ABC",10,789)  ),
        "to a longer length with negative int fills with '-'"               : () => test.valEQ("-------ABC"             , strU.padL("ABC",10,-1)   ),
        "a non-string using string representation"                          : () => test.valEQ("0000000123"             , strU.padL(123,10,0)      ),
        },
    "Right Padding....": {
        "an empty string to a liength of 0 => empty string"                 : () => test.valEQ(""                       , strU.padR("",0)          ),
        "a non-empty string to a shorter length => same string"             : () => test.valEQ("ABC"                    , strU.padR("ABC",0)       ),
        "a non-empty string to a negative length => same string"            : () => test.valEQ("ABC"                    , strU.padR("ABC",-10)     ),
        "a non-empty string its length => same string"                      : () => test.valEQ("ABC"                    , strU.padR("ABC",3)       ),
        "to a longer length with a single char fills to left"               : () => test.valEQ("ABC       "             , strU.padR("ABC",10)      ),
        "to a longer length with surplus chars fills with first"            : () => test.valEQ("ABCPPPPPPP"             , strU.padR("ABC",10,"PAD")),
        "to a longer length with empty string fills with space"             : () => test.valEQ("ABC       "             , strU.padR("ABC",10,"")   ),
        "to a longer length with no fill string fills with space"           : () => test.valEQ("ABC       "             , strU.padR("ABC",10)      ),
        "to a longer length with integer 0 fills with '0'"                  : () => test.valEQ("ABC0000000"             , strU.padR("ABC",10,0)    ),
        "to a longer length with single int digit fills with digit"         : () => test.valEQ("ABC7777777"             , strU.padR("ABC",10,7)    ),
        "to a longer length with multiple int digits fills with digit"      : () => test.valEQ("ABC7777777"             , strU.padR("ABC",10,789)  ),
        "to a longer length with negative int fills with '-'"               : () => test.valEQ("ABC-------"             , strU.padR("ABC",10,-1)   ),
        "a non-string using string representation"                          : () => test.valEQ("1230000000"             , strU.padR(123,10,0)      ),
        },
    });

test.batch("Test deprecated functions can be invoked", {
    "Deprecated: joinNB"                                                    : () => test.valEQ("A,B,C"                  , strU.joinNB(["A","B","C"],",")                        ),
    });

function deprecationTest(cmp,rtn,fncnam,...args) {
    return () => {
        let fnc=genU[fncnam];
        cmp(rtn,fnc(...args));                                                                                          // ensure deprecated wrapper function works
        genU[fncnam](rtn,fnc(...args));                                                                                 // ensure function return consistent
        test.valEQ(true,fnc!==genU[fncnam]);                                                                            // ensure exported function is updated
        };
    }

function toLowerCase(val) {
    return String(val).toLocaleLowerCase();
    }

test.logTotals();
env.exitEngine(test.totalFailed());
