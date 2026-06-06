// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

import { BddEnv } from "/bdd/BddEnv.js";
import { Litmus } from "/bdd/Litmus.js";

const env           = new BddEnv()
,     test          = new Litmus()
,     MAXINT        = Number.MAX_SAFE_INTEGER;

const nbrU          = env.createModule("./NumberUtil.js");

test.batch("NumberUtil can compare values...",{
    "for equality": {
        " 1  =   1"                                                     : () => test.valEQ(0            , nbrU.compare(1   ,1   ) ),
        "-1  =  -1"                                                     : () => test.valEQ(0            , nbrU.compare(-1  ,-1  ) ),
        "'1' =   1"                                                     : () => test.valEQ(0            , nbrU.compare("1" ,1   ) ),
        },
    "for less than": {
        "-1  <     0"                                                   : () => test.valLT(0            , nbrU.compare(-1 ,   0 )),
        " 0  <     1"                                                   : () => test.valLT(0            , nbrU.compare(0  ,   1 )),
        " 2  <   100"                                                   : () => test.valLT(0            , nbrU.compare(2  , 100 )),
        "'2' <  '100'"                                                  : () => test.valLT(0            , nbrU.compare("2","100")),
        },
    "for greater than": {
        "-1  >     0"                                                   : () => test.valLT(0            , nbrU.compare(-1 ,   0 )),
        " 0  >     1"                                                   : () => test.valLT(0            , nbrU.compare(0  ,   1 )),
        " 2  >   100"                                                   : () => test.valLT(0            , nbrU.compare(2  , 100 )),
        "'2' >  '100'"                                                  : () => test.valLT(0            , nbrU.compare("2","100")),
        },
    "special treatment for `null` ": {
        "null =  null"                                                  : () => test.valEQ(0            , nbrU.compare(null,null)),
        "0    <  null"                                                  : () => test.valLT(0            , nbrU.compare(0   ,null)),
        "null >  0"                                                     : () => test.valGT(0            , nbrU.compare(null,0   )),
        },
    });

test.batch("Compare values with a comparator code (these also exercise the indiviual `testXX` functions)...",{
    "Ensure invalid comparators fail": {
        "'BL' is not supported"                                         : () => test.fails("Error"      , nbrU.test,0    ,"BL"       ),
        "'DF' is not supported"                                         : () => test.fails("Error"      , nbrU.test,"ABC","DF"       ),
        "'CT' is not supported"                                         : () => test.fails("Error"      , nbrU.test,"ABC","CT" ,"A"  ),
        "'EG' is not supported"                                         : () => test.fails("Error"      , nbrU.test,"ABC","EG" ,"AB*"),
        "'EW' is not supported"                                         : () => test.fails("Error"      , nbrU.test,"ABC","EW" ,"BC" ),
        "'SW' is not supported"                                         : () => test.fails("Error"      , nbrU.test,"ABC","SW" ,"AB" ),
        },

    "Test true results": {
        "0 is zero"                                                     : () => test.valEQ(true         , nbrU.test(0    ,"ZR"      )),
        "'0' is zero"                                                   : () => test.valEQ(true         , nbrU.test("0"  ,"ZR"      )),
        "123 is equal to 123"                                           : () => test.valEQ(true         , nbrU.test(123  ,"EQ" ,123 )),
        "124 is greater than 123"                                       : () => test.valEQ(true         , nbrU.test(124  ,"GT" ,123 )),
        "123 is greater than or equal to 123"                           : () => test.valEQ(true         , nbrU.test(123  ,"GE" ,123 )),
        "124 is greater than or equal to 123"                           : () => test.valEQ(true         , nbrU.test(124  ,"GE" ,123 )),
        "123 is less than 124"                                          : () => test.valEQ(true         , nbrU.test(123  ,"LT" ,124 )),
        "123 is less than or equal to 123"                              : () => test.valEQ(true         , nbrU.test(123  ,"LE" ,123 )),
        "123 is less than or equal to 124"                              : () => test.valEQ(true         , nbrU.test(123  ,"LE" ,124 )),
        },

    "Test for false results": {
        "10 is not zero"                                                : () => test.valEQ(false        , nbrU.test(10   ,"ZR"      )),
        "'01' is not zero"                                              : () => test.valEQ(false        , nbrU.test("01" ,"ZR"      )),
        "123 is not equal to 1213"                                      : () => test.valEQ(false        , nbrU.test(123  ,"EQ" ,1213)),
        "123 is not greater than 1214"                                  : () => test.valEQ(false        , nbrU.test(123  ,"GT" ,1214)),
        "123 is not greater than or equal to 1213"                      : () => test.valEQ(false        , nbrU.test(123  ,"GE" ,1213)),
        "123 is not greater than or equal to 1214"                      : () => test.valEQ(false        , nbrU.test(123  ,"GE" ,1214)),
        "1213 is not less than 124"                                     : () => test.valEQ(false        , nbrU.test(1213 ,"LT" ,124 )),
        "1213 is not less than or equal to 123"                         : () => test.valEQ(false        , nbrU.test(1213 ,"LE" ,123 )),
        "1213 is not less than or equal to 124"                         : () => test.valEQ(false        , nbrU.test(1213 ,"LE" ,124 )),
        },
    });

test.batch("Increment/Decrement",{
    "Decrement numbers within wrapped bounds": {
        "Decrement reduces value by one"                                    : () => { test.valEQ(0          , nbrU.dec(1)           ); },
        "Decrement at default min wraps to Number.MAX_SAFE_INTEGER"         : () => { test.valEQ(MAXINT     , nbrU.dec(0)           ); },
        "Decrement at specified min wraps to specified max"                 : () => { test.valEQ( 20        , nbrU.dec(   10,10, 20)); },
        "Decrement value > max forces max"                                  : () => { test.valEQ(999        , nbrU.dec(10000, 0,999)); },
        "Decrement value < min forces max"                                  : () => { test.valEQ(999        , nbrU.dec(   -1, 0,999)); },
        },

    "Increment numbers within wrapped bounds": {
        "Increment increases value by one"                                  : () => { test.valEQ( 2         , nbrU.inc(1           )); },
        "Increment at default max wraps to 0"                               : () => { test.valEQ( 0         , nbrU.inc(MAXINT      )); },
        "Increment at specified max wraps to specified min"                 : () => { test.valEQ(10         , nbrU.inc(   20,10, 10)); },
        "Increment value > max forces min"                                  : () => { test.valEQ( 0         , nbrU.inc(10000, 0,999)); },
        "Increment value < min forces min"                                  : () => { test.valEQ( 0         , nbrU.inc(   -1, 0,999)); },
        },
    });

env.exitEngine(test.totalFailed());
