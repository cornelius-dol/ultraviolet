// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

import { BddEnv }           from "/$bdd/BddEnv.js";
import { Litmus }           from "/$bdd/Litmus.js";

const   env                 = new BddEnv()
,       log                 = console.log
,       test                = new Litmus({ outputPass: true, diag: true, failFast: true })

globalThis.GeneralUtil      = env.loadModule("/$prj/src/util/GeneralUtil.js");

const   UvState             = env.loadModule("/$cwd/UvState.js");
const   uvs                 = new UvState();

const   SKPCBK              = true
,       CBKINI              = true
,       VAL_TRUE            = true
,       VAL_FALSE           = false

//**********************************************************************************************************************
// TESTS - pgs
//**********************************************************************************************************************

test.batch("pgs() creates a reactive property getter/setter.",{
    "A PGS with no arguments defaults to undefined.": () => {
        let prp = uvs.pgs();
        test.valEQ(undefined                                                                                            , prp());
        },
    "A PGS with an initial value returns that value.": () => {
        let prp = uvs.pgs("hello");
        test.valEQ("hello"                                                                                              , prp());
        },
    "Setting a PGS value returns the new value.": () => {
        let prp = uvs.pgs(1);
        test.valEQ(2                                                                                                    , prp(2));
        test.valEQ(2                                                                                                    , prp());
        },
    "Setting to the same value does not trigger callback.": () => {
        let cnt = 0;
        let prp = uvs.pgs("x", () => { cnt++; });
        prp("x");
        test.valEQ(0                                                                                                    , cnt);
        },
    "Setting to a different value triggers callback.": () => {
        let cnt = 0;
        let prp = uvs.pgs("x", () => { cnt++; });
        prp("y");
        test.valEQ(1                                                                                                    , cnt);
        },
    "Callback receives new and old values.": () => {
        let captured = {};
        let prp = uvs.pgs("old", (nv,ov) => { captured.nv=nv; captured.ov=ov; });
        prp("new");
        test.objEQ({ nv: "new", ov: "old" }                                                                             , captured);
        },
    "Callback can override the value by returning a non-undefined value.": () => {
        let prp = uvs.pgs(0, (nv) => { return nv * 2; });
        prp(5);
        test.valEQ(10                                                                                                   , prp());
        },
    "Callback returning undefined does not override.": () => {
        let prp = uvs.pgs(0, () => { return undefined; });
        prp(7);
        test.valEQ(7                                                                                                    , prp());
        },
    "Setting with skpcbk=true suppresses callback.": () => {
        let cnt = 0;
        let prp = uvs.pgs("a", () => { cnt++; });
        prp("b", SKPCBK);
        test.valEQ(0                                                                                                    , cnt);
        test.valEQ("b"                                                                                                  , prp());
        },
    "The chgcbk argument can be omitted when stgnam is a string.": () => {
        let prp = uvs.pgs("init", "test-storage-key-1");
        test.valEQ("init"                                                                                               , prp());
        },
    "The chgcbk argument can be omitted when cbkini is a boolean.": () => {
        let prp = uvs.pgs("init", !CBKINI);
        test.valEQ("init"                                                                                               , prp());
        },
    "The stgnam argument can be omitted when cbkini is a boolean.": () => {
        let cnt = 0;
        let prp = uvs.pgs("init", () => { cnt++; }, CBKINI);
        test.valEQ(1                                                                                                    , cnt, "callback invoked on init");
        },
    "The cbkini flag invokes callback immediately with initial value.": () => {
        let captured = {};
        let prp = uvs.pgs("first", (nv,ov) => { captured.nv=nv; captured.ov=ov; }, CBKINI);
        test.objEQ({ nv: "first", ov: undefined }                                                                       , captured);
        },
    "PGS has isPGS property set to true.": () => {
        let prp = uvs.pgs(42);
        test.valEQ(VAL_TRUE                                                                                             , prp.isPGS);
        },
    "PGS toJSON returns current value.": () => {
        let prp = uvs.pgs({ a: 1 });
        test.objEQ({ a: 1 }                                                                                             , prp.toJSON());
        },
    "PGS toString returns string of current value.": () => {
        let prp = uvs.pgs(123);
        test.valEQ("123"                                                                                                , prp.toString());
        },
    "PGS chainVal causes set to return the specified value instead of the property value.": () => {
        let model = {};
        let prp = uvs.pgs(0).chainVal(model);
        let ret = prp(99);
        test.valEQ(model                                                                                                , ret, "set returns chain value");
        test.valEQ(99                                                                                                   , prp(), "get still returns property value");
        },
    "PGS chainVal returns the PGS itself for inline chaining.": () => {
        let prp = uvs.pgs(0);
        let ret = prp.chainVal("x");
        test.valEQ(prp                                                                                                  , ret);
        },
    "PGS chainVal returns the chain value even when set to the same value.": () => {
        let model = {};
        let prp = uvs.pgs("old").chainVal(model);
        let ret = prp("old");
        test.valEQ(model                                                                                                , ret);
        },
    "The value is visible as updated inside the callback.": () => {
        let seen;
        let prp = uvs.pgs(0, () => { seen = prp(); });
        prp(5);
        test.valEQ(5                                                                                                    , seen);
        },
    });

//**********************************************************************************************************************
// TESTS - pgsGet
//**********************************************************************************************************************

test.batch("pgsGet() creates a read-only view of a PGS.",{
    "A read-only getter returns the PGS value.": () => {
        let prp = uvs.pgs(42);
        let get = uvs.pgsGet(prp);
        test.valEQ(42                                                                                                   , get());
        },
    "A read-only getter reflects changes to the underlying PGS.": () => {
        let prp = uvs.pgs("a");
        let get = uvs.pgsGet(prp);
        prp("b");
        test.valEQ("b"                                                                                                  , get());
        },
    "Without error text, write attempts are silently ignored.": () => {
        let prp = uvs.pgs(1);
        let get = uvs.pgsGet(prp);
        get(99);
        test.valEQ(1                                                                                                    , prp());
        },
    "With error text, write attempts throw an Error.": () => {
        let prp = uvs.pgs(1);
        let get = uvs.pgsGet(prp, "[ReadOnly] Cannot write");
        test.fails("Error"                                                                                              , () => { get(99); });
        },
    });

//**********************************************************************************************************************
// TESTS - pgsToggle
//**********************************************************************************************************************

test.batch("pgsToggle() toggles a boolean PGS.",{
    "Toggling false yields true.": () => {
        let prp = uvs.pgs(VAL_FALSE);
        uvs.pgsToggle(prp);
        test.valEQ(VAL_TRUE                                                                                             , prp());
        },
    "Toggling true yields false.": () => {
        let prp = uvs.pgs(VAL_TRUE);
        uvs.pgsToggle(prp);
        test.valEQ(VAL_FALSE                                                                                            , prp());
        },
    "Returns the new value.": () => {
        let prp = uvs.pgs(VAL_TRUE);
        test.valEQ(VAL_FALSE                                                                                            , uvs.pgsToggle(prp));
        },
    });

//**********************************************************************************************************************
// TESTS - pgsPathSelector
//**********************************************************************************************************************

test.batch("pgsPathSelector() creates a selector function for property paths.",{
    "A single root-level path selects the correct key.": () => {
        let sel = uvs.pgsPathSelector("name");
        test.valEQ(VAL_TRUE                                                                                             , sel("/","name","x"));
        test.valEQ(undefined                                                                                            , sel("/","other","x"));
        },
    "A nested path selects the correct key at the correct depth.": () => {
        let sel = uvs.pgsPathSelector("address/city");
        test.valEQ(VAL_TRUE                                                                                             , sel("address/","city","x"));
        test.valEQ(undefined                                                                                            , sel("/","city","x"));
        },
    "Multiple paths select any matching key.": () => {
        let sel = uvs.pgsPathSelector(["name","age"]);
        test.valEQ(VAL_TRUE                                                                                             , sel("/","name","x"));
        test.valEQ(VAL_TRUE                                                                                             , sel("/","age","x"));
        test.valEQ(undefined                                                                                            , sel("/","other","x"));
        },
    "A string argument is treated as a single-element array.": () => {
        let sel = uvs.pgsPathSelector("key");
        test.valEQ(VAL_TRUE                                                                                             , sel("/","key","x"));
        },
    });

//**********************************************************************************************************************
// TESTS - pgsUnwrap
//**********************************************************************************************************************

test.batch("pgsUnwrap() deep-clones an object unwrapping PGS values to plain values.",{
    "A simple object with PGS values is unwrapped.": () => {
        let obj = { name: uvs.pgs("Alice"), age: uvs.pgs(30) };
        let raw = uvs.pgsUnwrap(obj);
        test.objEQ({ name: "Alice", age: 30 }                                                                          , raw);
        },
    "Non-PGS values pass through unchanged.": () => {
        let obj = { x: 1, y: "two" };
        let raw = uvs.pgsUnwrap(obj);
        test.objEQ({ x: 1, y: "two" }                                                                                  , raw);
        },
    "Nested objects are recursed.": () => {
        let obj = { outer: { inner: uvs.pgs("deep") } };
        let raw = uvs.pgsUnwrap(obj);
        test.objEQ({ outer: { inner: "deep" } }                                                                        , raw);
        },
    "Arrays are recursed.": () => {
        let obj = [uvs.pgs(1), uvs.pgs(2), uvs.pgs(3)];
        let raw = uvs.pgsUnwrap(obj);
        test.objEQ([1, 2, 3]                                                                                           , raw);
        },
    "A non-container value is returned as-is.": () => {
        test.valEQ(42                                                                                                   , uvs.pgsUnwrap(42));
        test.valEQ("str"                                                                                                , uvs.pgsUnwrap("str"));
        test.valEQ(null                                                                                                 , uvs.pgsUnwrap(null));
        },
    "The source object is not mutated.": () => {
        let prp = uvs.pgs("val");
        let obj = { key: prp };
        uvs.pgsUnwrap(obj);
        test.valEQ(prp                                                                                                  , obj.key);
        },
    "A selector function excludes unselected fields.": () => {
        let obj = { keep: uvs.pgs("yes"), drop: uvs.pgs("no") };
        let sel = (pth,key) => (key === "keep");
        let raw = uvs.pgsUnwrap(obj, sel);
        test.objEQ({ keep: "yes" }                                                                                      , raw);
        },
    "A transform function modifies values after unwrapping.": () => {
        let obj = { n: uvs.pgs(5) };
        let xfm = (pth,key,val) => (typeof val === "number" ? val * 10 : val);
        let raw = uvs.pgsUnwrap(obj, null, xfm);
        test.valEQ(50                                                                                                   , raw.n);
        },
    });

//**********************************************************************************************************************
// TESTS - pgsWrap
//**********************************************************************************************************************

test.batch("pgsWrap() deep-clones an object wrapping leaf values as PGS.",{
    "A simple object has its leaf values wrapped as PGS.": () => {
        let raw = { name: "Bob", age: 25 };
        let obj = uvs.pgsWrap(raw);
        test.valEQ(VAL_TRUE                                                                                             , obj.name.isPGS, "name is PGS");
        test.valEQ(VAL_TRUE                                                                                             , obj.age.isPGS, "age is PGS");
        test.valEQ("Bob"                                                                                                , obj.name());
        test.valEQ(25                                                                                                   , obj.age());
        },
    "Nested objects are recursed but not themselves wrapped.": () => {
        let raw = { addr: { city: "NYC" } };
        let obj = uvs.pgsWrap(raw);
        test.valEQ(undefined                                                                                            , obj.addr.isPGS, "object not wrapped");
        test.valEQ(VAL_TRUE                                                                                             , obj.addr.city.isPGS, "leaf wrapped");
        test.valEQ("NYC"                                                                                                , obj.addr.city());
        },
    "Arrays are recursed.": () => {
        let raw = [1, 2, 3];
        let obj = uvs.pgsWrap(raw);
        test.valEQ(VAL_TRUE                                                                                             , obj[0].isPGS);
        test.valEQ(1                                                                                                    , obj[0]());
        test.valEQ(3                                                                                                    , obj[2]());
        },
    "Null values are wrapped as PGS.": () => {
        let raw = { x: null };
        let obj = uvs.pgsWrap(raw);
        test.valEQ(VAL_TRUE                                                                                             , obj.x.isPGS);
        test.valEQ(null                                                                                                 , obj.x());
        },
    "A non-container value is returned as-is.": () => {
        test.valEQ(42                                                                                                   , uvs.pgsWrap(42));
        test.valEQ("str"                                                                                                , uvs.pgsWrap("str"));
        },
    "The source object is not mutated.": () => {
        let raw = { key: "val" };
        uvs.pgsWrap(raw);
        test.valEQ("val"                                                                                                , raw.key);
        },
    "A selector function excludes unselected fields.": () => {
        let raw = { keep: "yes", drop: "no" };
        let sel = (pth,key) => (key === "keep");
        let obj = uvs.pgsWrap(raw, sel);
        test.valEQ(VAL_TRUE                                                                                             , obj.keep.isPGS);
        test.valEQ(undefined                                                                                            , obj.drop);
        },
    });

//**********************************************************************************************************************
// TESTS - round-trip
//**********************************************************************************************************************

test.batch("pgsWrap/pgsUnwrap round-trip preserves data.",{
    "Wrapping then unwrapping yields the original structure.": () => {
        let raw = { name: "Eve", items: [10, 20], nested: { flag: true } };
        let obj = uvs.pgsWrap(raw);
        let out = uvs.pgsUnwrap(obj);
        test.objEQ(raw                                                                                                  , out);
        },
    "Modifying wrapped PGS values is reflected in unwrap.": () => {
        let raw = { x: 1, y: 2 };
        let obj = uvs.pgsWrap(raw);
        obj.x(99);
        let out = uvs.pgsUnwrap(obj);
        test.objEQ({ x: 99, y: 2 }                                                                                      , out);
        },
    });

log("Totals: Passed",test.totalPassed(),"- Failed",test.totalFailed());
env.exitEngine(test.totalFailed());

//**********************************************************************************************************************
