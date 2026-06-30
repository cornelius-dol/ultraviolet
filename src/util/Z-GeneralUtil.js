// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

import { BddEnv }           from "/$bdd/BddEnv.js";
import { Litmus }           from "/$bdd/Litmus.js";

const env           = new BddEnv()
,     test          = new Litmus({ diag: false, failFast: true, outputPass: false })
,     LOGPFX        = "        "
,     YES           = true
,     NO            = false

const genU          = env.createModule("/$cwd/GeneralUtil.js",{ asyncUtil: env.createModule("/$prj/src/async/AsyncUtil.js", { logPrefix: LOGPFX }), logPrefix: LOGPFX });

test.batch("argsArray() converts the arguments object to an array, optionally appending a second set arguments",{
    "Given an arguments object, produce an array of the same length, with the same values": () => {
        test.objEQ(["a", 1, [2], {three:3}]                 , function() { return genU.argsArray(arguments); }("a", 1, [2], {three:3}));
        },
    "Given an arguments object, return an array sliced from an offset": () => {
        test.objEQ([[2], {three:3}]                         , function() { return genU.argsArray(arguments,2); }("a", 1, [2], {three:3}));
        },
    "Append arguments with additional values to produce an array of all": () => {
        let add=["b", 4, [5], {six:6}];
        test.objEQ(["a", 1, [2], {three:3}, "b", 4, [5], {six:6}], function() { return genU.argsArray(arguments,0,add); }("a", 1, [2], {three:3}));
        },
    "Prepend arguments with additional values to produce an array of all": () => {
        let add=["b", 4, [5], {six:6}];
        test.objEQ(["b", 4, [5], {six:6}, "a", 1, [2], {three:3}], function() { return genU.argsArray(add,0,arguments); }("a", 1, [2], {three:3}));
        },
    "Append arguments sliced from an offset with additional values": () => {
        let add=["b", 4, [5], {six:6}];
        test.objEQ([[2], {three:3}, "b", 4, [5], {six:6}]   , function() { return genU.argsArray(arguments,2,add); }("a", 1, [2], {three:3}));
        },
    "Prepend arguments sliced from an offset with additional values": () => {
        let add=["b", 4, [5], {six:6}];
        test.objEQ([[5], {six:6}, "a", 1, [2], {three:3}]   , function() { return genU.argsArray(add,2,arguments); }("a", 1, [2], {three:3}));
        },
    "Append arguments sliced from an offset with additional values sliced from an offset": () => {
        let add=["b", 4, [5], {six:6}];
        test.objEQ([[2], {three:3}, [5], {six:6}]           , function() { return genU.argsArray(arguments,2,add,2); }("a", 1, [2], {three:3}));
        },
    "Prepend arguments sliced from an offset with additional values sliced from an offset": () => {
        let add=["b", 4, [5], {six:6}];
        test.objEQ([[5], {six:6}, [2], {three:3}]           , function() { return genU.argsArray(add,2,arguments,2); }("a", 1, [2], {three:3}));
        },
    });

test.batch("bindArgs() creates a new function with some number of fixed arguments bound for every invocation", {
    "Function call with only bound arguments": () => {
        let fnc=genU.bindArgs((...args) => (args),"a", 1, [2], {three:3});
        test.objEQ(["a", 1, [2], {three:3}]                 , fnc());
        },
    "Function call with only invocation arguments": () => {
        let fnc=genU.bindArgs((...args) => (args));
        test.objEQ(["a", 1, [2], {three:3}]                 , fnc("a", 1, [2], {three:3}));
        },
    "Function call with bound and invocation arguments": () => {
        let fnc=genU.bindArgs((...args) => (args),"a", 1, [2], {three:3});
        test.objEQ(["a", 1, [2], {three:3}, "b", 4, [5], {six:6}], fnc("b", 4, [5], {six:6}));
        },
    });

test.batch("chain() is a simple mechanism for invoking a several functions in series", {
    "Null arguments are removed and a function which invokes all functions in the sequence given is returned": () => {
        let one=() => { res[0]=one; }
        ,   two=() => { res[1]=two; }
        ,   res=[];
        genU.chain(one,null,two)();
        test.objEQ([one,two]                                , res);
        },
    "If the resulting list is empty, null is returned": () => {
        test.valEQ(null                                     , genU.chain()              );
        test.valEQ(null                                     , genU.chain(null)          );
        test.valEQ(null                                     , genU.chain(null,null,null));
        },
    "If the resulting list is a single element, then that singular function is returned": () => {
        let fnc=() => {};
        test.valEQ(fnc                                      , genU.chain(fnc));
        },
    });

test.batch("clone() deep-clones the supplied data-object or array, optionally transforming it", {
    "Simple Cloning": {
        "Cloning a simple value just returns that value, including null and undefined": () => {
            test.valEQ("A"                                  , genU.clone("A")      );
            test.valEQ(123                                  , genU.clone(123)      );
            test.valEQ(null                                 , genU.clone(null)     );
            test.valEQ(undefined                            , genU.clone(undefined));
            },
        "Cloning an object gives a new object with new sub-objects/arrays and the same base values": () => {
            let obj={ aa: [2], bb: {three:3}, cc: [5], dd: {six:6}};
            let cln=genU.clone(obj);
            test.objEQ(obj                                  , cln         );
            test.valNE(obj                                  , cln         );
            test.valNE(obj.aa                               , cln.aa      );
            test.valNE(obj.bb                               , cln.bb      );
            test.valNE(obj.cc                               , cln.cc      );
            test.valNE(obj.dd                               , cln.dd      );
            test.valEQ(obj.bb.three                         , cln.bb.three);
            test.valEQ(obj.dd.six                           , cln.dd.six  );
            },
        "Cloning an array gives a new array with new sub-objects/arrays and the same base values": () => {
            let arr=[[2], {three:3}, [5], {six:6}];
            let cln=genU.clone(arr);
            test.objEQ(arr                                  , cln         );
            test.valNE(arr                                  , cln         );
            test.valNE(arr[0]                               , cln[0]      );
            test.valNE(arr[1]                               , cln[1]      );
            test.valNE(arr[2]                               , cln[2]      );
            test.valNE(arr[3]                               , cln[3]      );
            test.valEQ(arr[1].three                         , cln[1].three);
            test.valEQ(arr[3].six                           , cln[3].six  );
            },
        },
    "Complex Cloning": {
        "Cloning can use a selector to omit top level fields based on path": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let sel     = (pth,key,val) => !(pth==="/" && key==="bb");
            let cln     = genU.clone(obj,sel);
            test.objEQ({ aa: [2], cc: [5], dd: { six: 6 }}  , cln);
            },
        "Cloning can use a selector to omit deeper fields based on path": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let sel     = (pth,key,val) => (pth!=="/bb/");
            let cln     = genU.clone(obj,sel);
            test.objEQ({ aa: [2], bb: {}, cc: [5], dd: { six: 6 }}, cln);
            test.valNE(obj.bb                               , cln.bb);
            test.valNE(obj.dd                               , cln.dd);
            },
        "Cloning can use a selector to omit deeper fields based on key": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let sel     = (pth,key,val) => (key!=="six");
            let cln     = genU.clone(obj,sel);
            test.objEQ({ aa: [2], bb: { three: 3 }, cc: [5], dd: {}}, cln);
            test.valNE(obj.bb                               , cln.bb);
            test.valNE(obj.dd                               , cln.dd);
            },
        "Cloning can use a selector to omit deeper fields based on value": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let sel     = (pth,key,val) => (val!==5);
            let cln     = genU.clone(obj,sel);
            test.objEQ({ aa: [2], bb: { three: 3 }, cc: [],  dd: { six: 6 }}, cln);
            test.valNE(obj.bb                               , cln.bb);
            test.valNE(obj.dd                               , cln.dd);
            },
        "Cloning can use a transformer to alter values as they are cloned": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let xfmtxt  = (pth,key,val) => (typeof(val)==="number" ? ""+val : val);
            let cln     = genU.clone(obj,null,xfmtxt);
            test.objEQ({ aa: ["2"], bb: { three: "3" }, cc: ["5"], dd: { six: "6" }}, cln);
            test.valNE(obj.bb                               , cln.bb);
            test.valNE(obj.dd                               , cln.dd);
            },
        "Cloning transformers are invoked after the value is cloned": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let cnt     = 0;
            let xfmtxt  = (pth,key,val) => {
                let ref=(pth+key).substring(1).replace("/",".");
                if(genU.isContainer(val)) { cnt++; test.valNE(val,genU.deepRef(obj,ref)); }
                return typeof(val)==="number" ? String(val) : val;
                };
            let cln     = genU.clone(obj,null,xfmtxt);
            test.objEQ (cln                                 , { aa: ["2"], bb: { three: "3" }, cc: ["5"], dd: { six: "6" }});
            test.valEQ (5                                   , cnt         ,"checking count of container values");
            test.typeEQ(3                                   , obj.bb.three,"check original is type number");
            test.typeEQ(""                                  , cln.bb.three,"check duplicate is type string");
            },
        "Cloning can use a referencer to indicate values that should be copied by reference": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let equdd   = (pth,key,val) => (key==="dd");
            let cln     = genU.clone(obj,null,null,equdd)
            test.objEQ({ aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }}, cln);
            test.valNE(obj.bb                               , cln.bb);
            test.valEQ(obj.dd                               , cln.dd);
            },
        "Cloning transformers are not invoked for copy-by-reference values": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let equdd   = (pth,key,val) => (key==="dd");
            let xfmtxt  = (pth,key,val) => (typeof(val)==="number" ? ""+val : val);
            let cln     = genU.clone(obj,null,xfmtxt,equdd)
            test.objEQ({ aa: ["2"], bb: { three: "3" }, cc: ["5"], dd: { six: 6 }}, cln);
            test.valNE(obj.bb                               , cln.bb);
            test.valEQ(obj.dd                               , cln.dd);
            },
        "Cloning can use a selector, transformer, and referencer to cull and transform an object in one pass": () => {
            let obj     = { aa: [2], bb: { three: 3 }, cc: [5], dd: { six: 6 }};
            let neqbb   = (pth,key,val) => (pth!=="/bb/");
            let xfmtxt  = (pth,key,val) => (typeof(val)==="number" ? ""+val : val);
            let equdd   = (pth,key,val) => (key==="dd");
            let cln     = genU.clone(obj,neqbb,xfmtxt,equdd);
            test.objEQ({ aa: ["2"], bb: {          }, cc: ["5"], dd: { six: 6 }}, cln);
            test.valEQ(obj.dd                               , cln.dd);
            },
        },
    });

test.batch("comparator() creates a general-purpose property-based function for comparing objects", {
    "Passing no arguments is an error": () => {
        test.fails("TypeError"                              ,genU.comparator);
        },
    "Passing an argument that is not a string or array is an error": () => {
        test.fails("TypeError"                              ,genU.comparator,1);
        },
    "The return result is a function named comparator": () => {
        let cmp     = genU.comparator("a","b","c");
        test.valEQ("comparator()"                           , genU.valString(cmp));
        },
    "Passing a string is split on commas": () => {
        let one     = { aa: 1, bb: 2, cc: 3 }
        ,   two     = { aa: 1, bb: 2, cc: 3 };
        let cmp     = genU.comparator("aa,bb,cc");
        test.valEQ(0                                        , cmp(one,two));
        },
    "Passing an array of properties works just as well": () => {
        let one     = { aa: 1, bb: 2, cc: 3 }
        ,   two     = { aa: 1, bb: 2, cc: 3 };
        let cmp     = genU.comparator([ "aa","bb","cc" ]);
        test.valEQ(0                                        , cmp(one,two));
        },
    "By default comparison done as strings": () => {
        let one     = { aa:   1, bb: "10", cc:   3 }
        ,   two     = { aa: "1", bb:    2, cc: "3" };
        let cmp     = genU.comparator("aa,bb,cc");
        test.valLT(0                                        , cmp(one,two));
        },
    "Properties can be prepended with '#' to compare numerically": () => {
        let one     = { aa:   1, bb: "10", cc:   3 }
        ,   two     = { aa: "1", bb:    2, cc: "3" };
        let cmp     = genU.comparator("aa,#bb,cc");
        test.valGT(0                                        , cmp(one,two));
        },
    "Properties can be prepended with '!' to invert the comparison": () => {
        let one     = { aa:   1, bb: "10", cc:   3 }
        ,   two     = { aa: "1", bb:    2, cc: "3" };
        let cmp     = genU.comparator("aa,!bb,cc");
        test.valGT(0                                        , cmp(one,two));
        },
    "Properties can be prepended with '!#' to invert a numeric comparison": () => {
        let one     = { aa:   1, bb: "10", cc:   3 }
        ,   two     = { aa: "1", bb:    2, cc: "3" };
        let cmp     = genU.comparator("aa,!#bb,cc");
        test.valLT(0                                        , cmp(one,two));
        },
    "Use a comparator with standard functions like Array.sort": () => {
        let arr  = [{ aa: 1000 },{ aa:  "1" },{ aa:  30 },{ aa: "2" },{ aa:  200 },{ aa:  "3" }];
        test.objEQ([{ aa:  "1" },{ aa: 1000 },{ aa: "2" },{ aa: 200 },{ aa:  "3" },{ aa:   30 }], arr.sort(genU.comparator("aa"))  , "sort as strings");
        test.objEQ([{ aa:   30 },{ aa:  "3" },{ aa: 200 },{ aa: "2" },{ aa: 1000 },{ aa:  "1" }], arr.sort(genU.comparator("!aa")) , "sort as strings in reverse order");
        test.objEQ([{ aa:  "1" },{ aa:  "2" },{ aa: "3" },{ aa:  30 },{ aa:  200 },{ aa: 1000 }], arr.sort(genU.comparator("#aa")) , "sort as numbers");
        test.objEQ([{ aa: 1000 },{ aa:  200 },{ aa:  30 },{ aa: "3" },{ aa:  "2" },{ aa:  "1" }], arr.sort(genU.comparator("!#aa")), "sort as numbers in reverse order");
        },
    "Both null and undefined sort as equal to each other, and greater than every other value": () => {
        let one     = { aa: null, bb: null     , cc:         3 }
        ,   two     = { aa:  "1", bb: undefined, cc: undefined };
        test.valGT(0, genU.comparator("aa" )(one,two), "Compare null/undefined as strings");
        test.valEQ(0, genU.comparator("bb" )(one,two), "Compare null/undefined as strings");
        test.valLT(0, genU.comparator("cc" )(one,two), "Compare null/undefined as strings");
        },
    });

test.batch("deepFreeze recusively freezes a container and its subcontainers (simple objects and arrays)",{
    "Given null or undefined, the result will be identical to the input": () => {
        test.valEQ(null ,genU.deepFreeze(null ),"Ensure null");
        test.valEQ(undefined,genU.deepFreeze(undefined),"Ensure undefined");
        },
    "Given an object the result will be the same object, altered such that it can no longer be modified": () => {
        let obj={ a: 1, b: { b1: 2, b2: [1,2,3] }, c: [4,5,7,{ d:8 }] };
        let obj2=genU.deepFreeze(obj);
        test.valEQ(obj ,obj2                        ,"Ensure object is identical");
        test.valEQ(YES ,Object.isFrozen(obj)        ,"Ensure object is frozen");
        test.valEQ(YES ,Object.isFrozen(obj.b)      ,"Ensure sub-object is frozen");
        test.valEQ(YES ,Object.isFrozen(obj.b.b2)   ,"Ensure sub-object sub-array is frozen");
        test.valEQ(YES ,Object.isFrozen(obj.c)      ,"Ensure sub-array is frozen");
        test.valEQ(YES ,Object.isFrozen(obj.c[3])   ,"Ensure sub-array sub-object is frozen");
        },
    "Freezing an object will not freeze members which are classes or functions": () => {
        let obj={ a: 1, b: 2, c: new Error(), d: () => true };
        let obj2=genU.deepFreeze(obj);
        test.valEQ(YES ,Object.isFrozen(obj)       ,"Ensure container is frozen");
        test.valEQ(NO  ,Object.isFrozen(obj.c)     ,"Ensure member class-instance is not frozen");
        test.valEQ(NO  ,Object.isFrozen(obj.d)     ,"Ensure member function is not frozen");
        },
    "Freezing an object with a skip function will not freeze skipped members": () => {
        let obj={ a: 1, b: { b1: 2, b2: [1,2,3] }, c: [4,5,7,{ d:8 }] };
        let obj2=genU.deepFreeze(obj,(pth,key,val) => { return key==="b"; });
        test.valEQ(obj  ,obj2                       ,"Ensure root object is identical");
        test.valEQ(YES ,Object.isFrozen(obj)       ,"Ensure root object is frozen");
        test.valEQ(NO  ,Object.isFrozen(obj.b)     ,"Ensure sub-object `b` is NOT frozen");
        test.valEQ(NO  ,Object.isFrozen(obj.b.b2)  ,"Ensure sub-object sub-array `b.b2` is frozen");
        test.valEQ(YES ,Object.isFrozen(obj.c)     ,"Ensure sub-array `c` is frozen");
        test.valEQ(YES ,Object.isFrozen(obj.c[3])  ,"Ensure sub-array sub-object `c[3]` is frozen");
        },
    });

test.batch("deepRef enables null coallescing reference resolution",{
    "Given an object and a string reference, when the subvalue exists then the sub-reference is returned": () => {
        let tst     = { a: { b: { c: "subvalue" }}};
        test.valEQ("subvalue",genU.deepRef(tst,"a.b.c"));
        },
    "Given an object and an array reference, when the subvalue exists then the sub-reference is returned": () => {
        let tst     = { a: { b: { c: "subvalue" }}};
        test.valEQ("subvalue",genU.deepRef(tst,["a","b","c" ]));
        },
    "Given an object and a string reference, when the subvalue does not exists, then the result is null": () => {
        let tst     = { a: { b: { cx: "subvalue" }}};
        test.valEQ(null,genU.deepRef(tst,"a.b.c"));
        },
    "Given an object and an array reference, when the subvalue does not exists, then the result is null": () => {
        let tst     = { a: { b: { cx: "subvalue" }}};
        test.valEQ(null,genU.deepRef(tst,["a","b","c" ]));
        },
    "Given an object and a string reference, when an intermediate structure does not exists, then the result is null": () => {
        let tst     = { a: { bx: { c: "subvalue" }}};
        test.valEQ(null,genU.deepRef(tst,"a.b.c"));
        },
    "Given an object and an array reference, when an intermediate structure does not exists, then the result is null": () => {
        let tst     = { a: { bx: { c: "subvalue" }}};
        test.valEQ(null,genU.deepRef(tst,["a","b","c" ]));
        },
    });

test.batch("defaultValue defaults a value when it is undefined.",{
    "Given an undefined value, the returned value is the default.": () => {
        test.valEQ("default",genU.defaultValue(undefined,"default"));
        },
    "Given a defined value, the returned value is the value.": () => {
        test.valEQ("defined",genU.defaultValue("defined","default"));
        },
    "Given a null value, the returned value is `null`.": () => {
        test.valEQ(null,genU.defaultValue(null,"default"));
        },
    "Given a false value, the returned value is `false`.": () => {
        test.valEQ(NO,genU.defaultValue(NO,"default"));
        },
    "Given a \"\" value, the returned value is `\"\"`.": () => {
        test.valEQ("",genU.defaultValue("","default"));
        },
    });

test.batch("ensureArray ensures that a value is an array.",{
    "Given a value, the result is a array of length 1 where index 0 is the value.": () => {
        test.objEQ(["success"],genU.ensureArray("success"));
        },
    "Given `undefined`, the result is an empty array.": () => {
        test.objEQ([],genU.ensureArray(undefined));
        },
    "Given an array, the result is the same array reference.": () => {
        let arr     = [1,2,3];
        test.valEQ(arr,genU.ensureArray(arr));
        },
    });

test.batch("ensureProp ensures that an object contains a specific property.",{
    "Given an object, if the named key does not exist it is set.": () => {
        test.objEQ({ desired: "default" },genU.ensureProp({},"desired","default"));
        },
    "Given an object, if the named key is explicitly `undefined` it is set.": () => {
        test.objEQ({ desired: "default" },genU.ensureProp({ desired: undefined },"desired","default"));
        },
    "Given an object, if the named key does exist it is left as is.": () => {
        test.objEQ({ desired: "original" },genU.ensureProp({ desired: "original" },"desired","default"));
        },
    "Given an object, if the named key is explicitly `null` it is left as is.": () => {
        test.objEQ({ desired: null },genU.ensureProp({ desired: null },"desired","default"));
        },
    "Given an object, if the named key is explicitly `\"\"` it is left as is.": () => {
        test.objEQ({ desired: "" },genU.ensureProp({ desired: "" },"desired","default"));
        },
    });

test.batch("findObject searches an array for an object for which the comparator returns `true`.",{
    "Given an array with no matching object, undefined is returned": () => {
        let arr     = [{ a:"0.1", b:"0.2", c:"0.3" }, { a:"1.1", b:"1.2", c:"1.3" }, { a:"2.1", b:"2.2", c:"2.3" }];
        test.valEQ(undefined,genU.findObject(arr,{ b:"0" },genU.comparator("b")));
        },
    "Given an array with a matching object, that object is returned": () => {
        let arr     = [{ a:"0.1", b:"0.2", c:"0.3" }, { a:"1.1", b:"1.2", c:"1.3" }, { a:"2.1", b:"2.2", c:"2.3" }];
        test.valEQ(arr[1],genU.findObject(arr,{ b:"1.2" },genU.comparator("b")));
        },
    "Given an array with a matching object of differing types, that object is returned": () => {
        let arr     = [{ a:"0.1", b:"0.2", c:"0.3" }, { a:"1.1", b:"1.2", c:"1.3" }, { a:"2.1", b:"2.2", c:"2.3" }];
        test.valEQ(arr[1],genU.findObject(arr,{ b:1.2 },genU.comparator("b")));
        },
    "Given an array with an object matching multiple values, that object is returned and objects matching only some values are not.": () => {
        let arr     = [{ a:"0.1", b:"0.2", c:"0.3" }, { a:"0.1", b:"1.2", c:"2.3" }, { a:"2.1", b:"2.2", c:"2.3" }];
        test.valEQ(arr[1],genU.findObject(arr,{ a:0.1, b:1.2, c:2.3 },genU.comparator("a,b,c")));
        },
    "Given an array with objects matching only some comparator values, undefined is returned": () => {
        let arr     = [{ a:"0.1", b:"0.2", c:"0.3" }, { a:"1.1", b:"1.2", c:"1.3" }, { a:"2.1", b:"2.2", c:"2.3" }];
        test.valEQ(undefined,genU.findObject(arr,{ a:"0.1", b:"1.2", c:"2.3" },genU.comparator("a,b,c")));
        },
    });

test.batch("generateId creates a random string of arbitrary length and composition.",{
    "Default Length, Default Composition": {
        "Length 50"                                         : () => { test.valEQ(50     ,genU.generateId().length       ); },
        },
    "Change Length": {
        "Length 5"                                          : () => { test.valEQ(5      ,genU.generateId(5).length      ); },
        "Length 10"                                         : () => { test.valEQ(10     ,genU.generateId(10).length     ); },
        "Length 15"                                         : () => { test.valEQ(15     ,genU.generateId(15).length     ); },
        "Length 20"                                         : () => { test.valEQ(20     ,genU.generateId(20).length     ); },
        },
    "Change Composition": {
        "Only A"                                            : () => { test.valEQ("AAAAA"        ,genU.generateId( 5,"A")); },
        "Only 0"                                            : () => { test.valEQ("00000"        ,genU.generateId( 5,"0")); },
        "Only 0123456789ABCDEF"                             : () => { test.valEQ(/^[0-9A-F]+$/  ,genU.generateId(50,"0123456789ABCDEF")); },
        },
    });

test.batch("Various isXxx() functions allow testing of types and values", {
    "Answer the question, what type is it?": {
        "function"                                          : () => { test.valEQ(YES,genU.isFunc(()=>{})              ); },
        "array"                                             : () => { test.valEQ(YES,genU.isArray([])                 ); },
        "boolean"                                           : () => { test.valEQ(YES,genU.isBoolean(0==1)             ); },
        "container (struct)"                                : () => { test.valEQ(YES,genU.isContainer({})             ); },
        "container (array)"                                 : () => { test.valEQ(YES,genU.isContainer([])             ); },
        "number"                                            : () => { test.valEQ(YES,genU.isNumber(1)                 ); },
        "object"                                            : () => { test.valEQ(YES,genU.isObject(new Error())       ); },
        "string"                                            : () => { test.valEQ(YES,genU.isString("")                ); },
        "struct"                                            : () => { test.valEQ(YES,genU.isStruct({})                ); },
        "Boolean is a wrapper"                              : () => { test.valEQ(YES,genU.isWrapper(new Boolean(YES)) ); },
        "Number is a wrapper"                               : () => { test.valEQ(YES,genU.isWrapper(new Number(1))    ); },
        "String is a wrapper"                               : () => { test.valEQ(YES,genU.isWrapper(new String(""))   ); },
        "Isn't function"                                    : () => { test.valEQ(NO ,genU.isFunc("")                  ); },
        "Isn't array"                                       : () => { test.valEQ(NO ,genU.isArray({})                 ); },
        "Isn't boolean"                                     : () => { test.valEQ(NO ,genU.isBoolean(0)                ); },
        "Isn't container"                                   : () => { test.valEQ(NO ,genU.isContainer("")             ); },
        "Isn't number"                                      : () => { test.valEQ(NO ,genU.isNumber("1")               ); },
        "Isn't object"                                      : () => { test.valEQ(NO ,genU.isObject(null)              ); },
        "Isn't string"                                      : () => { test.valEQ(NO ,genU.isString(1)                 ); },
        "Isn't struct"                                      : () => { test.valEQ(NO ,genU.isStruct(new Error())       ); },
        "Isn't wrapper"                                     : () => { test.valEQ(NO ,genU.isWrapper(NO)               ); },
        },
    "Answer the question, what value is it?": {
        "It is a blank string"                              : () => { test.valEQ(YES,genU.isBlank("")                 ); },
        "String with whitespace is also blank"              : () => { test.valEQ(YES,genU.isBlank(" ")                ); },
        "Null is blank"                                     : () => { test.valEQ(YES,genU.isBlank(null)               ); },
        "Undefined is blank"                                : () => { test.valEQ(YES,genU.isBlank(undefined)          ); },
        "String with characters isn't blank"                : () => { test.valEQ(NO ,genU.isBlank("A")                ); },
        "It is an empty array"                              : () => { test.valEQ(YES,genU.isEmpty([])                 ); },
        "It is an empty struct"                             : () => { test.valEQ(YES,genU.isEmpty({})                 ); },
        "It is an empty string"                             : () => { test.valEQ(YES,genU.isEmpty("")                 ); },
        "It isn't an empty array"                           : () => { test.valEQ(NO ,genU.isEmpty([1])                ); },
        "It isn't an empty struct"                          : () => { test.valEQ(NO ,genU.isEmpty({a:1})              ); },
        "It isn't an empty string"                          : () => { test.valEQ(NO ,genU.isEmpty("a")                ); },
        "String with only whitespace is not empty"          : () => { test.valEQ(NO ,genU.isEmpty(" ")                ); },
        },
    });

test.batch("Various isoXxx() functions yield ISO formatted dates and times", {
    "isoDate() gives us a local date in ISO format": {
        "Given a Date for 0, we get the ISO format date for the JavaScript epoch.": () => {
            test.valEQ("1969-12-31",genU.isoDate(new Date(0)),"");
            },
        "Given a Date for 1588540932452, we get the ISO format date for May 3, 2020.": () => {
            test.valEQ("2020-05-03",genU.isoDate(new Date(1588540932452)),"");
            },
        "Given a Date for 100,000,000 days, we get the maximum ISO format date (Sep 13, 275760).": () => {
            test.valEQ("275760-09-12",genU.isoDate(new Date( 100000000*24*60*60*1000)),"");
            },
        "Given a Date for -100,000,000 days, we get the minimum ISO format date (Apr 20, 271821 BC).": () => {
            test.valEQ("271821-04-19 BC",genU.isoDate(new Date(-100000000*24*60*60*1000)),"");
            },
        },
    "isoTime() gives us a local time in ISO format": {
        "Given a Date with time 09:05:03, we get zero-padded HH:MM:SS.": () => {
            let dat = new Date(2020,0,1,9,5,3);
            test.valEQ("09:05:03",genU.isoTime(dat),"");
            },
        "Given a Date with time 23:59:59, we get 24-hour format.": () => {
            let dat = new Date(2020,0,1,23,59,59);
            test.valEQ("23:59:59",genU.isoTime(dat),"");
            },
        "Given a Date with time 00:00:00, we get midnight as zeros.": () => {
            let dat = new Date(2020,0,1,0,0,0);
            test.valEQ("00:00:00",genU.isoTime(dat),"");
            },
        },
    "isoDateTime() gives us a local date and time in ISO format with space separator": {
        "Given a specific date and time, we get YYYY-MM-DD HH:MM:SS.": () => {
            let dat = new Date(2020,4,3,14,30,45);
            test.valEQ("2020-05-03 14:30:45",genU.isoDateTime(dat),"");
            },
        "Given midnight on Jan 1, we get zeros for the time portion.": () => {
            let dat = new Date(2020,0,1,0,0,0);
            test.valEQ("2020-01-01 00:00:00",genU.isoDateTime(dat),"");
            },
        },
    });

test.batch("merge() recusively combines two or more structures.", {
    "Merge two simple structures": () => {
        test.objEQ({a:1,b:2},genU.merge({a:1},{b:2}));
        },
    "Merge data structures, with arrays": () => {
        test.objEQ({a:[1],b:[2],c:[3]},genU.merge({a:[1],c:[2]},{b:[2],c:[3]}));
        },
    "Merge data structures, ensuring arrays are replaced": () => {
        let arrA=[1,1,1], arrB=[2,2,2], arrC=[3,3,3];
        let stc={ a:arrA, b:arrB, c:arrC };
        genU.merge(stc,{ b: ["Two"] });
        test.valEQ(stc.a,arrA);
        test.valNE(stc.b,arrB);
        test.valEQ(stc.c,arrC);
        test.typeEQ([],stc.b);
        test.valNE(arrB.length,stc.b.length);
        test.valEQ("Two",stc.b[0]);
        },
    "Merge multiple data structures, ensuring like-named values are replaced": () => {
        let stc={ a:[1],b:[2],c:[3] };
        genU.merge(stc,{ b:"Nope", c:"Nope" }, { b:"Test" }, { c:"Test" });
        test.valEQ(stc.b,"Test");
        test.valEQ(stc.c,"Test");
        },
    "Confirm deep merging": () => {
        let stc={ a:{a:1,b:2,c:3},b:{a:{a:1,b:2,c:3},b:{a:1,b:2,c:3},c:{a:1,b:2,c:3}},c:{a:1,b:2,c:3} };
        genU.merge(stc,{ b: { c: { a:"Test" }}});
        test.valEQ(stc.b.c.a,"Test");
        },
    });

test.batch("mergeShallow() combines the top-level of two or more structures.", {
    "Merge two simple structures": () => {
        test.objEQ({a:1,b:2},genU.mergeShallow({a:1},{b:2}));
        },
    "Merge multiple data structures, ensuring like-named values are replaced": () => {
        let stc={ a:[1],b:[2],c:[3] };
        genU.mergeShallow(stc,{ b:"Nope", c:"Nope" }, { b:"Test" }, { c:"Test" });
        test.valEQ(stc.b,"Test");
        test.valEQ(stc.c,"Test");
        },
    "Confirm shallow merging": () => {
        let stc={ a:{a:1,b:2,c:3},b:{a:{a:1,b:2,c:3},b:{a:1,b:2,c:3},c:{a:1,b:2,c:3}},c:{a:1,b:2,c:3} };
        genU.mergeShallow(stc,{ b: { c: { a:"Test" }}});
        test.objEQ({a:1,b:2,c:3}, stc.a     , "stc.a");
        test.valEQ(undefined        , stc.b.a   , "stc.b.a");
        test.valEQ(undefined        , stc.b.b   , "stc.b.b");
        test.valEQ("Test"       , stc.b.c.a , "stc.b.c.a");
        test.valEQ(undefined        , stc.b.c.b , "stc.b.c.b");
        test.valEQ(undefined        , stc.b.c.c , "stc.b.c.c");
        test.objEQ({a:1,b:2,c:3}, stc.c     , "stc.c");
        },
    });

test.batch("No-op is a substitution for a higher-order function when no action is desired.",{
    "noop() does nothing and returns it's first argument": () => {
        test.valEQ("Test",genU.noop("Test"));
        test.valEQ(1     ,genU.noop(1));
        test.objEQ({a:1} ,genU.noop({a:1}));
        },
    });

test.batch("Patch data structures", {
    "Deep patching (patch()) combines structures by replacing non-structure elements and adding new structures": {
        "Patch two simple structures": () => {
            test.objEQ({a:1,b:2},genU.merge({a:1}, {b:2}));
            },
        "Patch data structures, with arrays": () => {
            test.objEQ({a:[1],b:[2],c:[3]},genU.patch({a:[1],c:[2]},{b:[2],c:[3]}));
            },
        "Patch data structures, ensuring arrays are replaced": () => {
            let arrA=[1,1,1], arrB=[2,2,2], arrC=[3,3,3],arrD={ d: ["d"] };
            let stc={ a:arrA, b:arrB, c:arrC };
            genU.patch(stc,arrD);
            test.valEQ(stc.a,arrA);
            test.valEQ(stc.b,arrB);
            test.valEQ(stc.c,arrC);
            test.objEQ(stc.d,arrD.d);
            },
        //"Patch multiple data structures, ensuring like-named values are replaced": () => {
        //    let stc={ a:[1],b:[2],c:[3] };
        //    genU.patch(stc,{ b:"Nope", c:"Nope" }, { b:"Test" }, { c:"Test" });
        //    test.valEQ(stc.b,"Test");
        //    test.valEQ(stc.c,"Test");
        //    },
        //"Confirm deep merging": () => {
        //    let stc={ a:{a:1,b:2,c:3},b:{a:{a:1,b:2,c:3},b:{a:1,b:2,c:3},c:{a:1,b:2,c:3}},c:{a:1,b:2,c:3} };
        //    genU.patch(stc,{ b: { c: { a:"Test" }}});
        //    test.valEQ(stc.b.c.a,"Test");
        //    },
        },
    });

test.batch("Shuffle Arrays", {
    "The shuffle() function creates a new shuffled array from an input array.": {
        "Shuffling produces a random array order (1)": () => {
            let inp = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ], oup;
            oup = genU.shuffle(inp,() => (0.5));
            test.objEQ([0, 9, 1, 7, 2, 6, 3, 8, 4, 5],oup);
            },
        "Shuffling produces a random array order (2)": () => {
            let inp = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ], oup;
            oup = genU.shuffle(inp,() => (0.7));
            test.objEQ([0, 1, 9, 2, 3, 8, 4, 5, 6, 7],oup);
            },
        "Shuffling produces a random array order (3)": () => {
            let inp = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ], oup;
            oup = genU.shuffle(inp,() => (0.3));
            test.objEQ([9, 6, 0, 4, 5, 1, 7, 8, 2, 3],oup);
            },
        "Shuffling produces a different array order every time": () => {
            let inp = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ], oup, prv = [];
            for(let xa = 0; xa<100; xa += 1) {
                oup = genU.shuffle(inp);
                test.fails("LitmusError[IncorrectResult]",test.objEQ,[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],oup);
                test.fails("LitmusError[IncorrectResult]",test.objEQ,prv,oup);
                prv = oup;
                }
            },
        },
    });

test.batch("Visitor", {
    "The visit() function provides a generic means to search or process an object or array.": {
        "Visiting an array calls a function for each member": () => {
            let arr = [1,2,3,4];
            let add = (pth,key,val) => { tot += Number(val); }
            let mlt = (pth,key,val) => { tot *= Number(val); }
            let stp = (pth,key,val) => { return false; }
            let tot;

            tot = 0;
            test.valEQ(YES,genU.visit(arr,add),"Adder");
            test.valEQ(10,tot,"Adder");

            tot = 1;
            test.valEQ(YES,genU.visit(arr,mlt),"Multiplier");
            test.valEQ(24,tot,"Multiplier");
            },
        "Returning false stops processing immediately": () => {
            let arr = [1,2,3,4];
            let stp = (pth,key,val) => { return false; }
            let tot;

            tot = 0;
            test.valEQ(NO,genU.visit(arr,stp),"Stopped");
            test.valEQ(0,tot,"Stopped!");
            },
        },
    });

// ... more to do

test.logTotals();
env.exitEngine(test.totalFailed());
