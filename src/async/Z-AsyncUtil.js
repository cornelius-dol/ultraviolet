// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

import { BddEnv } from "/bdd/BddEnv.js";
import { Litmus } from "/bdd/Litmus.js";

const env           = new BddEnv()
,     test          = new Litmus({ diag: false, failFast: true, outputPass: false })
,     undef         = undefined;

const MAXINT        = Number.MAX_SAFE_INTEGER;

const asyU          = env.createModule("./AsyncUtil.js");

test.logTotals();
env.exitEngine(test.totalFailed());

function setTimeout(fnc,ms,...args) {
    fnc.apply(null,args);
    }
