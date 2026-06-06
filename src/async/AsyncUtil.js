// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * AsyncUtil
  * ====================================================================================================================
  *
  * Aynchronous utility functions.
  *
  * <span class="status-stable">Module Status: </span>
  */

function AsyncUtil(cfg)
{
"use strict";
const exported=this || {};                                                                                              // allow invocation with or without new

const   raf     = (typeof(requestAnimationFrame)=="function" ? requestAnimationFrame : function(fnc) { setTimeout(fnc,0); })
//      idleCbk = (typeof(requestIdleCallback  )=="function" ? requestIdleCallback   : function(fnc) { setTimeout(fnc,0); })
//      idleCan = (typeof(cancelIdleCallback   )=="function" ? cancelIdleCallback    : function(idn) { clearTimeout(idn); })
,       LOGPFX  = ((cfg && cfg.logPrefix) || "")+"[Whio]";

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    }

// *********************************************************************************************************************
// PUBLIC
// *********************************************************************************************************************

/**
  * Creates a debounced function which only executes after the specified delay and at most once per event-loop.
  * Similar to {{#throttle}}, this wrapper differs in that the delay is imposed from the last call of the debouncing
  * wrapper function. Debouncing should be thought of as deferring an action until idle for the specified time.
  *
  * The debounced function executes with the arguments bound in this call plus those passed in the most recent call.
  *
  * The debounced function has a `cancel` function which will clear any pending invocation.
  *
  * Use like this:
  *
  *     let windowResized=debounce(250,function(evt) {
  *         // All the taxing stuff you do when windows is resized (evt is from the event listener invocation)
  *         });
  *     globalThis.addEventListener('resize', windowResized);
  *
  * **Arguments & Return:**
  *
  *     dly             The number of milliseconds to delay execution. Defaults to 333.
  *     fnc             The function to call (arguments will be passed on after any bound arguments).
  *     fxdargs...      The fixed arguments to pass to the returned function before any supplied when it is invoked.
  *     =>              A new function which debounces the given function.
  */
exported.debounce=debounce;
function debounce(dly,fnc,fxdargs) {
    let invargs
    ,   tmridn=null;

    if(isFunc(dly)) { fxdargs=argsArray(arguments,1); fnc=dly; dly=333; }
    else            { fxdargs=argsArray(arguments,2);                   }

    function debouncedInv() {
        if(tmridn) {
            let allargs=argsArray(fxdargs,0,invargs);
            tmridn=null;
            invargs=null;
            fnc.apply(null,allargs);
            }
        }

    function debouncedFnc() {
        invargs=arguments;                                                                                              // always use the most recent args
        if(tmridn) { clearTimeout(tmridn); }
        tmridn=setTimeout(debouncedInv,dly);
        }

    debouncedFnc.cancel=function() {
        tmridn=clearTimeout(tmridn);
        };

    return debouncedFnc;
    }

//LPCD:2023-04-28: This is a concept from another project for creating a debounced function on the idle queue.
//function debouncedIdle(dly,fnc) {
//    let pnd = 0;
//    let cbk = function(...args1) {
//        if (!pnd) {
//            pnd = idleCbk((...args2) => {
//                if(pnd) {
//                    pnd = 0;
//                    return fnc(...args1,...args2);
//                    }
//                }, { timeout: dly });
//            }
//        };
//    cbk.cancel = function() {
//        if(pnd) { idleCan(pnd); }
//        pnd = 0;
//        };
//    return cbk;
//    }

/**
  * Facilitates deferral of a code block to the event-loop for operations that cannot occur inline.
  *
  * Use like this:
  *
  *     // defer to next event loop
  *     defer(function() {
  *         ... the code here
  *         });
  *
  *     // defer for a specific time
  *     defer(2000,function() {
  *         ... the code here
  *         });
  *
  *     // defer for a specific time with bound arguments
  *     defer(2000,someFunction,val1,val2);
  *
  * **Arguments & Return:**
  *
  *     dly             The number of milliseconds to delay execution; optional, defaults to 0.
  *     fnc             The function to call.
  *     args...         Arguments to pass to `fnc`. Optional.
  *     =>              The timer ID.
  */
exported.defer=defer;
function defer(dly,fnc,args) {
    if(isFunc(dly)) { args=argsArray(arguments,1); fnc=dly; dly=0; }
    else            { args=argsArray(arguments,2);                 }

    return setTimeout(function() { fnc.apply(null,args); },dly);
    }

/**
  * Facilitates deferral of a code block to the next animation frame for operations that cannot occur inline. Falls back
  * to the event loop if animation frames are not supported.
  *
  * Use like this:
  *
  *     // defer to next frame
  *     deferAF(function() {
  *         ... the code here
  *         });
  *
  *     // defer with bound arguments
  *     deferAF(someFunction,val1,val2);
  *
  * **Arguments & Return:**
  *
  *     fnc             The function to call.
  *     args...         Arguments to pass to `fnc`. Optional.
  *     =>              The timer ID from `setTimeout` or `requestAnimationFrame`.
  */
exported.deferAF=deferAF;
function deferAF(fnc,args) {
    args=argsArray(arguments);
    return raf(function() { fnc.apply(null,args); });
    }

/**
  * Facilitates artificial deferral of a code block for testing asynchronous operations which typically occur too quickly.
  * Emits console warnings that the wrapped code is artificially deferred.
  *
  * Use like this:
  *
  *     /\u002A\u002A/testDefer(2000,function() {
  *     ... the code here
  *     /\u002A\u002A/});
  *
  * **Arguments & Return:**
  *
  *     dly             The number of milliseconds to delay execution.
  *     fnc             The function to call.
  */
exported.testDefer=testDefer;
function testDefer(dly,fnc) {
    if(console.log) { console.log(LOGPFX,"Artificially deferring code block for "+dly+" ms..."); }
    setTimeout(function() {
        fnc();
        if(console.log) { console.log(LOGPFX,"... deferred code block completed."); }
        }, dly);
    }

/**
  * Creates a throttling function which executes no more frequently than a fixed delay and at most once per event-loop.
  * Similar to {{#debounce}}, this wrapper differs in that the delay is imposed between executions of the provided
  * wrapped function. Throttling should be thought of as limiting the frequency an action.
  *
  * The throttling function executes with the arguments passed in the most recent call.
  *
  * The throttling function has a `cancel` function which will reset the throttle and clear any pending invocation.
  *
  * The principle use of this is to ensure an action occurs on the event loop without risk of flooding the queue with
  * many redundant invocations (and potentially temporarily leaking large amounts of memory and/or overwhelming the
  * system's timer tables).
  *
  * Use like this:
  *
  *     let throttled=throttle(someFunction);                       // throttle for the default deley
  *     let throttled=throttle( 100,someFunction);                  // throttle for 100 milliseconds; no arguments bound.
  *     let throttled=throttle(3000,someFunction,val1,val2);        // throttle for 3 seconds with bound arguments
  *
  * Invoke throttled function like this:
  *
  *     throttled();                                                // call throttled function with only bound arguments
  *     throttled(val1,val2);                                       // call throttled function with bound arguments plus `val1` and `val2`.
  *     throttled.cancel();                                         // cancel pending invocation
  *
  * **Arguments & Return:**
  *
  *     dly             The number of milliseconds to delay execution. Optional, defaults to 333.
  *     fnc             The function to call. Optional. If omitted any existing function will be cancelled.
  *     fxdargs...      The fixed arguments to pass to the returned function before any supplied when it is invoked.
  *     =>              A new function which throttles the given function.
  *
  * ###### Arguments & Return for `fnc`:
  *
  *     args-1          Trailing arguments passed to the creating function.
  *     args-2          All arguments passed to last invocation of the throttled function.
  *     =>              True if the function was queued; false if it was already queued.
  */
exported.throttle=throttle;
function throttle(dly,fnc,fxdargs) {
    let invargs
    ,   tmridn,lasivk=0;

    if(isFunc(dly)) { fxdargs=argsArray(arguments,1); fnc=dly; dly=333; }
    else            { fxdargs=argsArray(arguments,2);                   }

    function throttledInv() {
        if(tmridn) {                                                                                                    // ensure doesn't execute if cancelled after timer-event is queued
            let allargs=argsArray(fxdargs,0,invargs);
            tmridn=undefined;                                                                                           // clear first, allowing call to requeue
            invargs=null;                                                                                               // clear first, allowing call to requeue
            lasivk=Date.now();
            fnc.apply(null,allargs);
            }
        }

    function throttledFnc() {
        invargs=arguments;
        if(!tmridn) {
            tmridn=setTimeout(throttledInv,Math.max(0,(dly-(Date.now()-lasivk))));
            return true;
            }
        else {
            return false;
            }
        }

    throttledFnc.cancel=function() {
        tmridn=clearTimeout(tmridn);
        lasivk=0;
        };

    return throttledFnc;
    }

// *********************************************************************************************************************
// PRIVATE
// *********************************************************************************************************************

// COPY/PASTE FROM GENERAL UTIL
function argsArray(basargs,basofs,addargs,addofs) {
    if(basargs && (!isArray(basargs) || basofs!=0)) { basargs=Array.prototype.slice.call(basargs,basofs || 0); }
    if(addargs && (!isArray(addargs) || addofs!=0)) { addargs=Array.prototype.slice.call(addargs,addofs || 0); }
    return (!addargs || addargs.length==0) ? (basargs || [])
    :      (!basargs || basargs.length==0) ?  addargs
    :                                         basargs.concat(addargs);
    }

function isArray(arg) {
    return Array.isArray(arg);
    }

function isFunc(arg) {
    return typeof(arg)==="function";
    }

// *********************************************************************************************************************
init();
return exported;
}
