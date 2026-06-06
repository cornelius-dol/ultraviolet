// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * PromiseUtil
  * ====================================================================================================================
  *
  * Functions to build promises for callback-based APIs.
  *
  * <p><span class="status-unstable">Status: </span>
  * <p><span class="since">1.00</span>
  *
  * ###### Construction
  *
  *     new PromiseUtil(config)
  *
  * ###### Arguments:
  *
  *     config          Configuration parameters.
  *
  * ###### Config:
  *
  *     None
  *
  * ###### Dependencies:
  *
  *     None
  */

function PromiseUtil(config)
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {                                                                                                       // self-contained init avoids leaking temp objects into module closure
    config=config||{};
    }

// *********************************************************************************************************************
// PUBLIC FUNCTIONS
// *********************************************************************************************************************

/**
Return a promise that resolves to `val` after the specified number of milliseconds.

Arguments & Return:

    ms              Milliseconds to delay.
    val             The (optional) value to resolve after the timeout.
    =>              Promise

<p><span class="status-experimental">Status: </span>
<p><span class="since">1.00</span>
**/
exported.delay=delay;
function delay(ms,val) {
    return new Promise(function(res) {
        setTimeout(function() { res(val); },ms);
        });
    }

/**
Return a function which takes a value and returns a promise that will resolve to the value after the specified number of
milliseconds. This is useable directly in a promise chain to cause a delay and pass on the resolution value.

Arguments & Return:

     ms              Milliseconds to delay.
     =>              A function for a `then` on-resolve argument.

<p><span class="status-experimental">Status: </span>
<p><span class="since">1.00</span>
**/
exported.delayChain=delayChain;
function delayChain(ms) {
    return function(val) {
        return delay(ms,val);
        };
    }

// *********************************************************************************************************************
init();
return exported;
}
