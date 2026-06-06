// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

import { BddEnv }           from "/$bdd/BddEnv.js";
import { Litmus }           from "/$bdd/Litmus.js";
import {
    DOMParser,
    Document,
    Node ,
    }                       from "jsr:@b-fuze/deno-dom";

// Deno DOM does not (yet) support the isConnected property.
Object.defineProperty(Node.prototype, "isConnected", {
    enumerable   : true,
    configurable : false,
    get() {
        let nod = this;
        while(nod && !(nod instanceof Document)) { nod = nod.parentNode; }
        return nod!=null;
        },
    });

// Deno DOM does not (yet) support SVG creation with namespaces.
Object.defineProperty(Document.prototype, "createElementNS", {
    value: (nsp, tag) => {
        let elm = document.createElement(tag);
        nsp ? elm.setAttribute("xmlns", nsp) : elm.removeAttribute("xmlns");
        elm.namespaceURI = nsp;
        return elm;
        }
    });

const   env                 = new BddEnv()
,       log                 = console.log
,       test                = new Litmus({ outputPass: true, diag: true, failFast: true })
,     { ANYOBJ
,       ANYFNC
,       ANYSTR }            = test
,       NS_HTM              = "http://www.w3.org/1999/xhtml"
,       NS_SVG              = "http://www.w3.org/2000/svg"
,       NS_MATHML           = "http://www.w3.org/1998/Math/MathML"
,       SKPCHN              = true
,       UDF                 = undefined
,       VAL_TRUE            = true
,       VAL_FALSE           = false

const   UvDom               = env.loadModule("/$cwd/UvDom.js");

let     domParser           = new DOMParser()
,       document            = domParser.parseFromString("<html><body id='root'><div></div></body><html>","text/html")

let   { define : vw
,       island : vwIsland
,       update : vwUpdate
,       render : vwRender
,       dataOf : vwDataOf
,       insights }          = new UvDom({ name: "Unit Test", document, printNode, /* Only For Manual Debugging: */ listChildren, nameOf, toHtml })

//**********************************************************************************************************************
// TESTS
//**********************************************************************************************************************

test.batch("Module Construction.",{
    "An Ultraviolet module is created by construction with the required configuration.": () => {
        test.objEQ({define:ANYFNC, update:ANYFNC, island:ANYFNC, render:ANYFNC, dataOf:ANYFNC, insights:ANYFNC}         , new UvDom({ name: "Unit Test 1", document }));
        },
    "Passing no arguments or and empty config object is an error.": () => {
        test.fails("ReferenceError"                                                                                     , UvDom);
        test.fails("ReferenceError"                                                                                     , UvDom,{});
        },
    "An Ultraviolet view descriptor contains { tag: \"\", atr: {}, chn: [], $uv: {} }.": () => {
        let vew = vw("div");
        test.typeEQ(""                                                                                                  , vew.tag, "tag must be a string");
        test.typeEQ({}                                                                                                  , vew.atr, "atr must be an object");
        test.typeEQ([]                                                                                                  , vew.chn, "chn must be an array" );
        test.typeEQ({}                                                                                                  , vew.$uv, "$uv must be an object");
        },
    });

test.batch("Views are described with the 'describe()' function.",{
    "The first argument is the element description, using CSS notation.": {
        "It must be a string"                               : () => { test.fails("TypeError"                            , vw,{}); },
        "First the element name: div"                       : () => { test.objEQ(dscObject("div")                       , vw("div")); },
        "... with an optional ID: div#id"                   : () => { test.objEQ(dscObject("div#id")                    , vw("div#id")); },
        "... and a class: div#id.cls1"                      : () => { test.objEQ(dscObject("div#id.cls1")               , vw("div#id.cls1")); },
        "... or two or more: div#id.cls1.cls2.cls3"         : () => { test.objEQ(dscObject("div#id.cls1.cls2.cls3")     , vw("div#id.cls1.cls2.cls3")); },
        "... or classes with no ID: div.cls1.cls2"          : () => { test.objEQ(dscObject("div.cls1.cls2")             , vw("div.cls1.cls2")); },
        "The element name is optional and defaults to div:" : () => { test.objEQ(dscObject("div")                       , vw("")); },
        "... with an optional ID: #id"                      : () => { test.objEQ(dscObject("div#id")                    , vw("#id")); },
        "... and a class: #id.cls1"                         : () => { test.objEQ(dscObject("div#id.cls1")               , vw("#id.cls1")); },
        "... or two or more: #id.cls1.cls2.cls3"            : () => { test.objEQ(dscObject("div#id.cls1.cls2.cls3")     , vw("#id.cls1.cls2.cls3")); },
        "... or classes with no ID: .cls1.cls2"             : () => { test.objEQ(dscObject("div.cls1.cls2")             , vw(".cls1.cls2")); },
        },
    "The second argument specifies the element attributes, as an object.": {
        "It must be an object"                              : () => { test.fails("TypeError"                            , vw,"div","",""); },
        "Literal values are added as strings"               : () => { test.objEQ({ a: "1", b: "2" }                     , vw("div",{ a: 1, b: "2" }).atr); },
        "... except true/false which map to \"\" and null"  : () => { test.objEQ({ a: "", b: null }                     , vw("div",{ a: true, b: false }).atr); },
        "An attribute id overrides one in `tag`"            : () => { test.objEQ({ id: "atr" }                          , vw("div#emb",{ id: "atr" }).atr); },
        "... unless it's `undefined`"                       : () => { test.objEQ({ id: "emb" }                          , vw("div#emb",{ id: undefined }).atr); },
        "... but it may be null for attr stability"         : () => { test.objEQ({ id: null }                           , vw("div#emb",{ id: null }).atr); },
        "An attribute class augments those in `tag`"        : () => { test.objEQ({ class: "emb atr-cls" }               , vw("div.emb",{ class: "atr-cls" }).atr); },
        "Class dot-separators are allowed"                  : () => { test.objEQ({ class: "emb cls1 cls2" }             , vw("div.emb",{ class: ".cls1.cls2" }).atr); },
        "Event handlers are specified using onxxx"          : () => { test.objEQ({ onclick: evtClicker }                , vw("div",{ onclick: evtClicker }).atr); },
        "... and can be function-call-objects with args"    : () => { test.objEQ({ onclick: {f:evtClicker,a:1} }        , vw("div",{ onclick: {f:evtClicker,a:1} }).atr); },
        "... and can be `null` for attr stability"          : () => { test.objEQ({ onclick: null }                      , vw("div",{ onclick: null }).atr); },
        "Styles can be specified using a string"            : () => { test.objEQ({ style: "font:bold 16px sans-serif;" }, vw("div",{ style:    "font:bold 16px sans-serif;"   }).atr); },
        "... or an object"                                  : () => { test.objEQ({ style: "font:bold 16px sans-serif;" }, vw("div",{ style: { font: "bold 16px sans-serif"  } }).atr); },
        "... or `null` for attr stability"                  : () => { test.objEQ({ style: null                         }, vw("div",{ style: null                              }).atr); },
        },
    "The third argument is the child, or an array of children.": {
        "Children can be an array"                          : () => { test.objEQ(["string",123,true,false,null]         , vw("div",{},["string", 123, true, false, null]).chn); },
        "... or a single string"                            : () => { test.objEQ(["string"]                             , vw("div",{},"string").chn); },
        "... or a single number"                            : () => { test.objEQ([123]                                  , vw("div",{},123).chn); },
        "... or a single `true`"                            : () => { test.objEQ([true]                                 , vw("div",{},VAL_TRUE).chn); },
        "... or a single `false`"                           : () => { test.objEQ([false]                                , vw("div",{},VAL_FALSE).chn); },
        "... or a single `null`"                            : () => { test.objEQ([null]                                 , vw("div",{},null).chn); },
        "... or objects with a `valueOf` function"          : () => { test.objEQ([false]                                , vw("div",{},[new Boolean(false)]).chn); },
        "... or components with a `$dom` function"          : () => { test.objEQ([ANYFNC]                               , vw("div",{},cptStatic()).chn); },
        "... or another view descriptor (of course)"        : () => { test.objEQ([dscObject("div",["x"])]               , vw("div",{},[vw("",["x"])]).chn); },
        "But not arbitrary objects"                         : () => { test.fails("TypeError"                            , vw,"div",{},{}); },
        },
    "The attributes argument can be omitted.": {
        "Children can be an array"                          : () => { test.objEQ(["string",123,true,false,null]         , vw("div",["string", 123, true, false, null]).chn); },
        "... or a single string"                            : () => { test.objEQ(["string"]                             , vw("div","string").chn); },
        "... or a single number"                            : () => { test.objEQ([123]                                  , vw("div",123).chn); },
        "... or a single `true`"                            : () => { test.objEQ([true]                                 , vw("div",VAL_TRUE).chn); },
        "... or a single `false`"                           : () => { test.objEQ([false]                                , vw("div",VAL_FALSE).chn); },
        "... or a single `null`"                            : () => { test.objEQ([null]                                 , vw("div",null).chn); },
        "... or objects with a `valueOf` function"          : () => { test.objEQ([false]                                , vw("div",[new Boolean(VAL_FALSE)]).chn); },
        "... or components with a `$dom` function"          : () => { test.objEQ([ANYFNC]                               , vw("div",cptStatic()).chn); },
        "... or another view descriptor (of course)"        : () => { test.objEQ([dscObject("div",["x"])]               , vw("div",[vw("",["x"])]).chn); },
        },
    "Nested child arrays will be rendered as if flattened"  : () => { test.objEQ( dscObject("div",[
                                                                        "top",
                                                                        "zero",1,2,3,"four",
                                                                        dscObject("span",["Hi 1"])
                                                                        ])                                              , vw("div",{},[ "top", ["zero",[[1,[[[2]]],3]],"four"], fragmentSpan() ])); },
    "An ID is used as part of the signature for the node": () => {
        let vew = vw("div#an-id")
        ,   dfn = { tag: "div", atr: {id:"an-id"}, chn: [], $uv: ANYOBJ }
        ,   dom = "<div id='an-id'/>";

        test.objEQ(dfn                                                                                                  , vew,"Check definition");
        test.valEQ(dom                                                                                                  , toHtml(vwRender(vew)),"Check DOM");
        test.valEQ("div:an-id[class,id]"                                                                                , vew.$uv.nid,"Validate node-ID");
        },
    });

test.batch("Boolean, null and undefined values are allowed and have special, pragmatic, meaning.",{
    "Null children are considered to be defined, and are rendered as placeholder comments": () => {
        let vew = vw("div", [ null ])
        ,   dfn = { tag: "div", atr:{class:UDF}, chn: [null], $uv: ANYOBJ }
        ,   dom = toHtml(elm("div").cmt().done());

        test.objEQ(dfn                                                                                                  , vew,"Check definition");
        test.valEQ(dom                                                                                                  , toHtml(vwRender(vew)),"Check DOM");
        test.valEQ("div:[class]"                                                                                       , vew.$uv.nid,"Validate node-ID");
        },
    "Null attributes are considered to be defined, but are not rendered": () => {
        let vew = vw("div",{ atr: null })
        ,   dfn = { tag: "div", atr: { "atr": null }, chn: [], $uv: ANYOBJ }
        ,   dom = toHtml(elm("div").done());

        test.objEQ(dfn                                                                                                  , vew,"Check definition");
        test.valEQ(dom                                                                                                  , toHtml(vwRender(vew)),"Check DOM");
        test.valEQ("div:[class,atr]"                                                                                    , vew.$uv.nid,"Validate node-ID");
        },
    "Null attributes will, however, clear corresponding DOM attributes": () => {
        let vew1 = vw("div.inhibited")
        ,   vew2 = vw("div")
        ,   ins1, ins2;

        insights({}); vwRender(vew1,mountReset()); ins1 = insights();
        test.valEQ("<div class='inhibited'/>"                                                                           , toHtml(mountPoint())      , "DOM Structure 1");
        insights({}); vwRender(vew2,mountPoint()); ins2 = insights();
        test.valEQ("<div/>"                                                                                             , toHtml(mountPoint())      , "DOM Structure 2");

        test.objEQ({atr:{create:1}, dom:{insert:1,remove:1,render:1}, evt:{}, hnd:{}, nod:{element:1}}                  , nrmInsights(ins1)  , "DOM Operations 1");
        test.objEQ({atr:{remove:1}, dom:{insert:0,remove:0,render:1}, evt:{}, hnd:{}, nod:{}}                           , nrmInsights(ins2)  , "DOM Operations 2");
        },
    "Undefined children are neither defined, nor rendered": () => {
        let vew = vw("div", [ undefined ])
        ,   dfn = { tag: "div", atr: {}, chn: [], $uv: ANYOBJ }
        ,   dom = toHtml(elm("div").done());

        test.objEQ(dfn                                                                                                  , vew,"Check definition");
        test.valEQ(dom                                                                                                  , toHtml(vwRender(vew)),"Check DOM");
        test.valEQ("div:[class]"                                                                                        , vew.$uv.nid,"Validate node-ID");
        },
    "Undefined attributes are neither defined, nor rendered": () => {
        let vew = vw("div",{ atr: undefined })
        ,   dfn = { tag: "div", atr: {}, chn: [], $uv: ANYOBJ }
        ,   htm = '<div/>';

        test.objEQ(dfn                                                                                                  , vew,"Check definition");
        test.valEQ(htm                                                                                                  , toHtml(vwRender(vew)),"Check DOM");
        test.valEQ("div:[class]"                                                                                        , vew.$uv.nid,"Validate node-ID");
        },
    "Boolean attribute values are defined as either blank/null and rendered/omitted, respectively.": () => {
        let vew = vw("div",{ trueAtr: true, falseAtr: false })
        ,   dfn = { tag: "div", atr: { "trueAtr": "", "falseAtr": null }, chn: [], $uv: ANYOBJ }
        ,   htm = "<div true-atr=''/>";

        test.objEQ(dfn                                                                                                  , vew,"View Check");
        test.valEQ(htm                                                                                                  , toHtml(vwRender(vew)),"DOM Check");
        test.valEQ("div:[class,trueAtr,falseAtr]"                                                                       , vew.$uv.nid,"Node-ID Check");
        },
    });

test.batch("Views are rendered into DOM trees with the `vwRender()` function.",{
    "Rendering views creates a DOM tree.": {
        "Either standalone.": () => {
            let vew = vw("div#parent",[
                        vw("span#child",["This is some text"])
                        ])
            ,   dom = elm("div").atr("id","parent")
                        .chd(elm("span").atr("id","child").txt("This is some text"))
                        .done();
            test.valEQ(toHtml(dom)                                                                                      , toHtml(vwRender(vew)));
            },
        "Or replacing an existing DOM tree.": () => {
            let vew = vw("div#parent",[
                        vw("span#child",{ onclick: evtClicker },["This is some text"])
                        ])
            ,   dom = elm("div").atr("id","parent")
                        .chd(elm("span").atr("id","child").atr("onclick","[[evtClicker]]").txt("This is some text"))
                        .done()
            ,   nod = vwRender(vew,document.querySelector("#root > div"));
            test.valEQ(toHtml(dom)                                                                                      , toHtml(document.querySelector("#root > div")));
            test.valEQ(VAL_TRUE                                                                                         , nod.isConnected, "Check isConnected");
            },
        "Mixed case attributes are rendered kebab-case"     : () => {
            let vew = vw("div",{ dataValue: "custom" })
            ,   htm = "<div data-value='custom'/>";
            test.valEQ(htm                                                                                              , toHtml(vwRender(vew)));
            },
        },
    "Rendering is HTML injection safe.": {
        "Text values are escaped.": () => {
            let vew = vw("div",["HTML tags: <b>, <i>, <u>"])
            ,   dom = elm("div").txt("HTML tags: <b>, <i>, <u>").done();
            test.valEQ(toHtml(dom)                                                                                      , toHtml(vwRender(vew)));
            },
        "Attribute values are escaped.": () => {
            let vew = vw("div",{ dataTags: "<, ', \", >, <b>, <i>, <u>"})
            ,   dom = elm("div").atr("data-tags","<, ', \", >, <b>, <i>, <u>").done();
            test.valEQ(toHtml(dom)                                                                                      , toHtml(vwRender(vew)));
            },
        },
    });

test.batch("A component is an object having a `$dom` property which is a UvDom.update() function`.",{
    "A simple component is a UV module which exports its updater as '$dom'.": () => {
        let cpt = cptStatic("Text")
        ,   vew = vw("div",cpt);
        test.objEQ(dscObject("div",[cpt.$dom.$s])                                                                       , vew                  , "View incorrect");
        test.valEQ("<div><h1 class='component'>Text</h1></div>"                                                         , toHtml(vwRender(vew)), "DOM incorrect");
        },
    "A dynamic component can be dynamically updated by calling any update API that it provides.": () => {
        let cpt = cptDynamic("Original Text")
        ,   vew = vw("div",cpt)
        ,   dom;

        dom = elm("div").chd(elm("h1").atr("class","component").txt("Original Text")).done();
        test.objEQ(dscObject("div",[cpt.$dom.$s])                                                                       , vew                  , "1st view incorrect");
        test.valEQ(toHtml(dom)                                                                                          , toHtml(vwRender(vew)), "1st DOM incorrect");

        cpt.update("Different Text");
        dom = elm("div").chd(elm("h1").atr("class","component").txt("Different Text")).done();
        test.objEQ(dscObject("div",[cpt.$dom.$s])                                                                       , vew                  , "2nd view Incorrect");
        test.valEQ(toHtml(dom)                                                                                          , toHtml(vwRender(vew)), "2nd DOM Incorrect");
        },
    "A component can be conditionally rendered or omitted": () => {
        const cpt = new component();

        function define(inccpt) {
            return vw("main.m", [
                vw("button.m"),
                inccpt ? cpt: undefined,
                vw("div.m",["M"]),
                ]);
            }

        function component() {
            let exp = {};
            vwIsland(() => {
                return vw("div.c",[
                    vw("div.c",["C"]),
                    vw("input.c"),
                    ]);
                }, exp);
            return exp;
            }

        let exp1 = "<main class='m'><button class='m'/>" + "<div class='c'><div class='c'>C</div><input class='c'/></div>" + "<div class='m'>M</div></main>"
        ,   exp2 = "<main class='m'><button class='m'/>"                                                                   + "<div class='m'>M</div></main>"
        ,   dom;

        insights({});
        dom = vwRender(define(VAL_TRUE),mountReset());
        test.valEQ(exp1                                                                                                 , toHtml(dom), "1st DOM Incorrect");
        test.objEQ({atr:{create:6},dom:{insert:8,remove:1,render:8},evt:{},hnd:{},nod:{element:6,text:2}}               , nrmInsights(), "1st Insights Incorrect");

        insights({});
        dom = vwRender(define(VAL_FALSE),dom);
        test.valEQ(exp2                                                                                                 , toHtml(dom), "2nd DOM Incorrect");
        test.objEQ({atr:{create:1},dom:{insert:2,remove:6,render:4},evt:{},hnd:{},nod:{element:1,text:1}}               , nrmInsights(), "2nd Insights Incorrect");

        insights({});
        dom = vwRender(define(VAL_TRUE),dom);
        test.valEQ(exp1                                                                                                 , toHtml(dom), "3rd DOM Incorrect (rerender of 1st)");
        test.objEQ({atr:{create:1},dom:{insert:6,remove:2,render:4},evt:{},hnd:{},nod:{element:1,text:1}}               , nrmInsights(), "3rd Insights Incorrect");
        },
    });

test.batch("DOM mutations can be measured using `insights()`.",{
    "Rendering a new node should create 1 DOM node.": () => {
        let vew = vw("div"), nod;
        insights({});
        nod = vwRender(vew);
        test.objEQ({atr:{}, dom:{insert:0, remove:0, render:1}, evt:{}, hnd:{}, nod:{element:1}}                        , nrmInsights());
        },
    "Rendering a new node with an attribute should create 1 node, and 1 attribute.": () => {
        let vew = vw("div",{ test: "Value"}), nod;
        insights({});
        nod = vwRender(vew);
        test.objEQ({atr:{create:1}, dom:{insert:0,remove:0,render:1}, evt:{}, hnd:{}, nod:{element:1}}                  , nrmInsights());
        },
    "Rendering a new node with an attribute and a text child should create 1 element node, 1 attribute, and 1 text node.": () => {
        let vew = vw("div",{ test: "Value"},["Child"]);
        insights({});
        vwRender(vew);
        test.objEQ({atr:{create:1}, dom:{insert:0,remove:0,render:2}, evt:{}, hnd:{}, nod:{element:1, text:1}}
                                                                                                                        , nrmInsights());
        },
    "Rendering a new node with an attribute and a, element child should create 2 element nodes, and 1 attribute.": () => {
        let vew = vw("div",{ test: "Value"},[vw("span")]);
        insights({});
        vwRender(vew);
        test.objEQ({atr:{create:1}, dom:{insert:0,remove:0,render:2}, evt:{}, hnd:{}, nod:{element:2}}                  , nrmInsights());
        },
    });

test.batch("DOM mutations should not occur if the view has not changed.",{
    "Updating an existing node, using an identical view, should create no nodes.": () => {
        let vew = vw("div");
        vwRender(vew,mountReset()); insights({}); vwRender(vew,mountPoint());
        test.objEQ({atr:{}, dom:{insert:0,remove:0,render:1}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights());
        },
    "Updating an existing node with an attribute, using an identical view, should create no nodes.": () => {
        let vew = vw("div",{ test: "value" }), nod;
        vwRender(vew,mountReset()); insights({}); vwRender(vew,mountPoint());
        test.objEQ({atr:{}, dom:{insert:0,remove:0,render:1}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights());
        },
    "Updating an existing node with an attribute and a text child, using an identical view, create no nodes or attributes.": () => {
        let vew = vw("div",{ test: "value" },"child");
        vwRender(vew,mountReset()); insights({}); vwRender(vew,mountPoint());
        test.objEQ({atr:{}, dom:{insert:0,remove:0,render:2}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights());
        },
    "Updating an existing node with an attribute and an element child, using an identical view, creates no nodes or attributes.": () => {
        let vew = vw("div",{ test: "value" },vw("span","Test"));
        vwRender(vew,mountReset());
        test.valEQ("<div test='value'><span>Test</span></div>"                                                          , toHtml(mountPoint()), "DOM Structure 1");
        insights({});
        vwRender(vew,mountPoint());
        test.valEQ("<div test='value'><span>Test</span></div>"                                                          , toHtml(mountPoint()), "DOM Structure 2");
        test.objEQ({atr:{}, dom:{insert:0,remove:0,render:3}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights());
        },
    });

test.batch("Form control value normalization.",{
    "Clearing an input value via null results in a blank DOM value.": () => {
        let vew1 = vw("div",[vw("input",{ value: "text" })])
        ,   vew2 = vw("div",[vw("input",{ value: null   })])
        ,   inp;

        vwRender(vew1,mountReset());
        inp = mountPoint().querySelector("input");
        test.valEQ("text"                                                                                               , inp.getAttribute("value"), "Initial attribute value");
        test.valEQ("text"                                                                                               , inp.value, "Initial property value");

        vwRender(vew2,mountPoint());
        inp = mountPoint().querySelector("input");
        test.valEQ(null                                                                                                 , inp.getAttribute("value"), "Attribute removed when null");
        test.valEQ(""                                                                                                   , inp.value, "Null value coerces to blank string");
        },
    });

test.batch("DOM mutations are minimized where the corresponding existing node can be reused.",{
    "Updating text nodes just reuses them.": () => {
        let vew1 = vw("div",["one","two","three","four","five"])
        ,   vew2 = vw("div",["1","2","3","4","5"])
        ,   dom  = elm("div").txt("1").txt("2").txt("3").txt("4").txt("5").done();
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:0,remove:0,render:6}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights(), "DOM Operations");
        },
    "Updating a node with two children after dropping the first child, creates 1 nodes.": () => {
        let vew1 = vw("div",[vw("one"), vw("two")])
        ,   vew2 = vw("div",[vw("two")])
        ,   dom  = elm("div").chd(elm("two")).done();
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:1,remove:2,render:2}, evt:{}, hnd:{}, nod:{element:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Updating a node with two children after dropping the second child, creates no nodes.": () => {
        let vew1 = vw("div",[vw("one"), vw("two")])
        ,   vew2 = vw("div",[vw("one")])
        ,   dom  = elm("div").chd(elm("one")).done();
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:0,remove:1,render:2}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights(), "DOM Operations");
        },
    "Updating a node with two children after nulling the first child, creates 1 comment node.": () => {
        let vew1 = vw("div",[vw("one"), vw("two")])
        ,   vew2 = vw("div",[null,vw("two")])
        ,   dom  = elm("div").cmt().chd(elm("two")).done();
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:1,remove:1,render:3}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Updating a node with two children after nulling the second child, creates 1 comment node.": () => {
        let vew1= vw("div",[vw("one"), vw("two")])
        ,   vew2= vw("div",[vw("one"), null])
        ,   dom = elm("div").chd(elm("one")).cmt().done();
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:1,remove:1,render:3}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Updating a node with two children in a different order recreates both nodes.": () => {
        let vew1= vw("div",[vw("one"), vw("two")])
        ,   vew2= vw("div",[vw("two"), vw("one")])
        ,   dom = elm("div").chd(elm("two")).chd(elm("one")).done();
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:2,remove:2,render:3}, evt:{}, hnd:{}, nod:{element:2}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused where the structure matches: [A,~cpt~,B,~cpt~,C].": () => {
        let cpt1 = cptCustom("one")
        ,   cpt2 = cptCustom("two")
        ,   vew1 = vw("div",["A", cpt1, "B", cpt2, "C"])
        ,   vew2 = vw("div",["A", cpt2, "B", cpt1, "C"]);
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ("<div>A<two/>B<one/>C</div>"                                                                         , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:3,remove:3,render:4}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused where the structure matches: [~cpt~,B,~cpt~,C].": () => {
        let cpt1= cptCustom("one")
        ,   cpt2= cptCustom("two")
        ,   vew1= vw("div",[cpt1, "B", cpt2, "C"])
        ,   vew2= vw("div",[cpt2, "B", cpt1, "C"])
        ,   dom  = fmHtml("<div><two/>B<one/>C</div>");
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:3,remove:3,render:3}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused where the structure matches: [A,~cpt~,~cpt~,C].": () => {
        let cpt1= cptCustom("one")
        ,   cpt2= cptCustom("two")
        ,   vew1= vw("div",["A", cpt1, cpt2, "C"])
        ,   vew2= vw("div",["A", cpt2, cpt1, "C"])
        ,   dom  = fmHtml("<div>A<two/><one/>C</div>");
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:3,remove:3,render:3}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused where the structure matches: [A,~cpt~,B,~cpt~].": () => {
        let cpt1= cptCustom("one")
        ,   cpt2= cptCustom("two")
        ,   vew1= vw("div",["A", cpt1, "B", cpt2])
        ,   vew2= vw("div",["A", cpt2, "B", cpt1])
        ,   dom  = fmHtml("<div>A<two/>B<one/></div>");
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ(toHtml(dom)                                                                                          , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:3,remove:3,render:3}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused where the structure matches: [~cpt~,B,~cpt~].": () => {
        let cpt1= cptCustom("one")
        ,   cpt2= cptCustom("two")
        ,   vew1= vw("div",[cpt1, "B", cpt2])
        ,   vew2= vw("div",[cpt2, "B", cpt1]);
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ("<div><two/>B<one/></div>"                                                                           , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:3,remove:3,render:2}, evt:{}, hnd:{}, nod:{comment:1}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused where the structure matches: [A,~cpt1~,B,~cpt2~,C,~cpt3~].": () => {
        let cpt1 = cptCustom("input",{value: "one"})
        ,   cpt2 = cptCustom("input",{value: "two"})
        ,   cpt3 = cptCustom("input",{value: "three"})
        ,   vew1 = vw("div",["A", cpt1, "B", cpt2, "C",cpt3])
        ,   vew2 = vw("div",[           "B", cpt2, "C",cpt3]);
        vwRender(vew1,mountReset());
        test.valEQ("<div>A<input value='one'/>B<input value='two'/>C<input value='three'/></div>"                       , toHtml(mountPoint()), "DOM Structure");
        insights({});
        vwRender(vew2,mountPoint());
        test.valEQ("<div>B<input value='two'/>C<input value='three'/></div>"                                            , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:4,remove:6,render:3}, evt:{}, hnd:{}, nod:{comment:2}}                          , nrmInsights(), "DOM Operations");
        },
    "Children will be reused when additional nodes are appended.": () => {
        let cpt1= cptCustom("one")
        ,   cpt2= cptCustom("two")
        ,   cpt3= cptCustom("three")
        ,   cpt4= cptCustom("four")
        ,   vew1= vw("div",["A", cpt1, "C"])                                                                            // cpt1 is rendered here, and will result in only one render call next
        ,   vew2= vw("div",["A", cpt1, "C", cpt2 , cpt3, cpt4]);                                                        // cpt2,cpt3,cpt4 have two renders here; inside the component, and as child of the parent
        vwRender(vew1,mountReset()); insights({}); vwRender(vew2,mountPoint());
        test.valEQ("<div>A<one/>C<two/><three/><four/></div>"                                                           , toHtml(mountPoint()), "DOM Structure");
        test.objEQ({atr:{}, dom:{insert:3,remove:0,render:6}, evt:{}, hnd:{}, nod:{element:3}}                          , nrmInsights(), "DOM Operations");
        },
    "Component nodes will only be recycled for the same component.": () => {
        let cpt1 = cptCustom("section", vw("Cpt-Child-1"))
        ,   cpt2 = cptCustom("section", vw("Cpt-Child-2"))
        ,   vew1 = vw("main", [cpt1, cpt2])
        ,   vew2 = vw("main", [vw("section", vw("Elm-Child-1")), vw("section",vw("Elm-Child-2"))])
        ,   ins1, ins2, ins3;

        insights({}); vwRender(vew1,mountReset()); ins1 = insights();
        test.valEQ("<main><section><cpt-child-1/></section><section><cpt-child-2/></section></main>"                    , toHtml(mountPoint()), "DOM Structure 1");
        test.objEQ({atr:{}, dom:{insert:5,remove:1,render:5}, evt:{}, hnd:{}, nod:{element:5}}                          , nrmInsights(ins1), "DOM Operations 1");

        insights({}); vwRender(vew2,mountPoint()); ins2 = insights();
        test.valEQ("<main><section><elm-child-1/></section><section><elm-child-2/></section></main>"                    , toHtml(mountPoint()), "DOM Structure 2");
        test.objEQ({atr:{}, dom:{insert:4,remove:4,render:5}, evt:{}, hnd:{}, nod:{element:4}}                          , nrmInsights(ins2), "DOM Operations 2");

        insights({}); vwRender(vew1,mountPoint()); ins3 = insights();
        test.valEQ("<main><section><cpt-child-1/></section><section><cpt-child-2/></section></main>"                    , toHtml(mountPoint()), "DOM Structure 3");
        test.objEQ({atr:{}, dom:{insert:4,remove:4,render:1}, evt:{}, hnd:{}, nod:{}}                                   , nrmInsights(ins3), "DOM Operations 3");
        },
    });

test.batch("A number of special attributes, prefixed with `$` are supported.",{
    "An unrecognized special property throws an Error exception from define().": () => {
        test.fails("Error"                                                                                              , () => {vw("div",{ $notvalid: "" },"Test")});
        },
    "Specifying $data attaches arbitrary data to the DOM element, which can be extracted by an event handler.": () => {
        let dta = { a: "One", b: "Two" }
        ,   vew = vw("div",{ $data: dta },"Test")
        ,   nod = vwRender(vew);

        // TEST RENDERED NODE
        test.objEQ(dta                                                                                                  ,vwDataOf(vew), "Data in vDOM");
        test.objEQ(dta                                                                                                  ,vwDataOf(nod), "Data in DOM");

        dta = { a: "ONE", b: "TWO" }
        vew = vw("div",{ $data: dta },"Test")
        nod = vwRender(vew,nod);

        // TEST UPDATED NODE
        test.objEQ(dta                                                                                                  ,vwDataOf(vew), "Data in vDOM");
        test.objEQ(dta                                                                                                  ,vwDataOf(nod), "Data in DOM");
        },
    "Specifying $debug enables rendering debugging.": () => {
        test.valEQ(VAL_TRUE                                                                                             , vw("div",{ $debug: true },"Test").atr.$debug);
        },
    "Action handlers allow code to be run when specific DOM actions occur." : {
        "The $create action handler is invoked after a new element is created.": () => {
            let cnt     = counter()
            ,   vew     = vw("div",{ $create: {f:acnCounter,a:["create",cnt]} });

            insights({});
            vwRender(vew,mountReset());
            test.valEQ(1                                                                                                , cnt(), "First render");
            vwRender(vew,mountPoint());
            test.valEQ(1                                                                                                , cnt(), "Second render");
            test.objEQ({atr:{}, dom:{insert:1,remove:1,render:2}, evt:{}, hnd:{create:1}, nod:{element:1}}              , nrmInsights(insights()));
            },
        "The $render action handler is invoked after an existing element is (re)rendered.": () => {
            let cnt     = counter()
            ,   vew     = vw("div",{ $render: {f:acnCounter,a:["render",cnt]} });

            insights({});
            vwRender(vew,mountReset());
            test.valEQ(1                                                                                                , cnt(),"First Render");
            vwRender(vew,mountPoint());
            test.valEQ(2                                                                                                , cnt(),"Second Render");
            test.objEQ({atr:{}, dom:{insert:1,remove:1,render:2}, evt:{}, hnd:{render:2}, nod:{element:1}}              , nrmInsights(insights()));
            },
        "The $insert and $remove action handlers enable processing DOM elements after being added and before being removed.": () => {
            function insert(nod) {
                if(!nod.isConnected) { throw new Error("Node is not connected in $insert"); }
                nod.append(chd);
                ivkins = true;
                }
            function remove(nod) {
                if(!nod.isConnected) { throw new Error("Node is not connected in $remove"); }
                nod.removeChild(chd);
                ivkrmv = true;
                }

            let vew1    = vw("div",{ $insert: insert, $remove: remove })
            ,   vew2    = vw("div")
            ,   chd     = fmHtml("<span>some text</span>")
            ,   ivkins  = false
            ,   ivkrmv  = false
            ,   nod;

            insights({});
            nod = vwRender(vew1,mountReset());
            test.valEQ("<div><span>some text</span></div>"                                                              , toHtml(nod),"Check DOM 1");
            nod = vwRender(vew1,mountPoint());
            test.valEQ(VAL_TRUE                                                                                         , ivkins);
            test.valEQ("<div><span>some text</span></div>"                                                              , toHtml(nod),"Check DOM 2");
            vwRender(vew2,mountPoint()); // Correct, DON'T assign nod here; verifying that $remove removes the child
            test.valEQ(VAL_TRUE                                                                                         , ivkrmv);
            test.valEQ("<div/>"                                                                                         , toHtml(nod),"Check DOM 3");
            test.objEQ({atr:{}, dom:{insert:2,remove:2,render:3}, evt:{}, hnd:{insert:1,remove:1}, nod:{element:2}}     , nrmInsights(insights()));
            },
        "Invalid $xxx values throw an Error.": () => {
            test.fails("Error"                                                                                          , () => { vwRender(vw("div",{ $xyz: ()=>{} },"Test")) });
            },
        },
    });

test.batch("Views can render non-HTML nodes, such as SVG using xmlns namespace attributes",{
    "Rendering an SVG element propagates its namespace to descendants.": () => {
        let vew = vw("svg", { xmlns: NS_SVG }, [
            vw("circle",{ cx: 50, cy: 50, r: 40 })
            ])
        ,   dom = vwRender(vew)
        ,   cir = dom.querySelector("circle");

        test.valEQ(NS_SVG                                                                                              , dom.namespaceURI          , "SVG root namespace");
        test.valEQ(NS_SVG                                                                                              , cir.namespaceURI          , "SVG child namespace");
        test.valEQ(`<svg xmlns='${NS_SVG}'><circle cx='50' cy='50' r='40'/></svg>`                                      , toHtml(dom));
        },
    "Replacing an element with the same tag in a different namespace.": () => {
        let vw1 = vw("svg", { xmlns: NS_SVG }, [
            vw("circle",{ cx: 50, cy: 50, r: 40 })
            ])
        ,   vw2 = vw("svg", { xmlns: NS_MATHML }, [
            vw("circle",{ cx: 50, cy: 50, r: 40 })
            ])
        ,   dom1 = vwRender(vw1)
        ,   dom2 = vwRender(vw2)
        ,   dom3 = vwRender(vw2,dom1);

        test.valEQ(NS_SVG                                                                                               , dom1.namespaceURI         , "Initial namespace");
        test.valEQ(NS_MATHML                                                                                            , dom2.namespaceURI         , "Replacement namespace");
        test.valEQ(NS_MATHML                                                                                            , dom3.namespaceURI         , "Mounted namespace after swap");
        test.valEQ(NS_MATHML                                                                                            , dom2.querySelector("circle").namespaceURI);
        test.valEQ(NS_MATHML                                                                                            , dom3.querySelector("circle").namespaceURI);
        test.valEQ(`<svg xmlns='${NS_MATHML}'><circle cx='50' cy='50' r='40'/></svg>`                                   , toHtml(dom3));
        },
    "Namespaces can be overridden for embedded HTML content.": () => {
        let vew = vw("svg", { xmlns: NS_SVG }, [
            vw("foreignObject",{
                width : 10,
                height: 10,
                },[
                vw("div", {
                    xmlns: NS_HTM,
                    },[
                    vw("p",["HTML content"])
                    ])
                ])
            ])
        ,   dom = vwRender(vew)
        ,   box = dom.querySelector("foreignObject")
        ,   div = dom.querySelector("foreignObject > div");

        test.valEQ(NS_SVG                                                                                              , dom.namespaceURI, "SVG root namespace");
        test.valEQ(NS_SVG                                                                                              , box.namespaceURI, "foreignObject namespace matches parent");
        test.valEQ(NS_HTM                                                                                              , div.namespaceURI, "Embedded HTML namespace");
        test.valEQ(`<svg xmlns='${NS_SVG}'><foreignobject width='10' height='10'><div xmlns='${NS_HTM}'><p>HTML content</p></div></foreignobject></svg>`
                                                                                                                        , toHtml(dom));
        }
    });

log("Totals: Passed",test.totalPassed(),"- Failed",test.totalFailed());
env.exitEngine(test.totalFailed());

//**********************************************************************************************************************
// HELPERS
//**********************************************************************************************************************

function acnCounter(nod,par,acn,cnt) {
    if(acn==="create") {
        if( nod.isConnected) { throw new Error(`Node IS connected in $${acn}`); }
        }
    else {
        if(!nod.isConnected) { throw new Error(`Node IS NOT connected in $${acn}`); }
        }
    cnt(cnt()+1);
    }

function cptCustom(tag,atr,chn) {
    let vwu     = vwUpdate(describe);

    function describe() {
        return vw(tag,atr,chn);
        }

    return { "$dom": vwu };
    }

function cptDynamic(txt) {
    let EXPORTED = { update }
    ,   vwu      = vwIsland(describe,EXPORTED);

    function describe() {
        return vw("h1.component",txt || "");
        }

    function update(val) {
        txt = val;
        vwu();
        }

    return EXPORTED;
    }

function cptStatic(txt) {
    return { "$dom": vwUpdate(vw("h1.component",txt || "")) };
    }

function evtClicker() {}

function dscObject(tag,chn) {
    let idn,cls

    [tag,cls] = [ tag.split(".")[0], tag.split(".").slice(1).join(" ") || null];
    [tag,idn] = [ tag.split("#")[0], tag.split("#").slice(1).join(" ") || null];

    let atr = {};
    cls!=null && (atr.class = cls);
    idn!=null && (atr.id    = idn);
    chn ??= [];
    return { tag, atr, chn, $uv: ANYOBJ };
    }

// DON'T USE THIS ANYMORE; fmHtml("...") IS MUCH CLEANER
function elm(tag) {
    let cur = document.createElement(tag);
    let bld = {
        atr : (nam,val) => { cur.setAttribute(nam,val);                return bld; },
        chd : (oth)     => { cur.append(oth.done ? oth.done() : oth);  return bld; },
        cmt : ()        => { cur.append(document.createComment(""));   return bld; },
        txt : (val)     => { cur.append(document.createTextNode(val)); return bld; },
        done: ()        => ( cur ),
        };
    return bld;
    }

function counter(val) {
    val ??= 0;
    return (newval) => {
        newval!==undefined && (val=newval);
        return val;
        };
    }

function fragmentSpan() {
    return vw("span",["Hi 1"]);
    }

function listChildren(par, cur, txt) {
    if(par) {
        log("[**]","Children Of",nameOf(par),(txt || ""));
        for(let chl = par?.firstChild; chl; chl = chl.nextSibling) {
            log("[**]" + (chl===cur ? " => " : "    ") + nameOf(chl) + (!chl.$uv ? "(foreign)" : ""));
            }
        log("[**]    --");
        }
    }

function mountPoint() {
    return document.querySelector("#root > :first-child");
    }

function mountReset() {
    mountPoint().replaceWith(document.createElement("div"));
    return mountPoint();
    }

function nameOf(nod) {
    return nod && ((nod.tagName ?? nod.nodeName) + (nod.data ? ":" + nod.data : "") + (nod.valued ? ":" + nod.value : ""));
    }

function nrmInsights(obj) {
    obj ||= insights() || {};
    let rpl = {};
    for(let key of Object.keys(obj).sort()) {
        let val = obj[key];
        key==="dom" && (val = {
            insert: obj.insert ?? 0,
            remove: obj.remove ?? 0,
            render: obj.render ?? 0,
            ...val,                                                                                                     // catch furture additions
            });
        if(val!=null && val.constructor===Object) { val = nrmInsights(val); }
        rpl[key] = val;
        }
    return rpl;
    }

function fmHtml(htm) {
    htm = htm.replaceAll(/<([^/<> ]+)([^/<>]*)\/>/g,"<$1$2></$1>");                                                     // change <tag/> or <tag ...atrs/> to <tag ...></tag>
    return domParser.parseFromString(htm,"text/html").querySelector("body > *");
    }

function toHtml(nod,skpchn,curnsp) {
    let tgt = "";

    curnsp ??= NS_HTM;

    function atrText(nam,val) {
        return (" " + nam + "='" + val + "'");                                                                          // maybe escape value?
        }

    if(nod) {
        switch(nod.nodeType) {
            case Node.COMMENT_NODE: {
                tgt += "[#cmt" + (nod.data ? (":" + nod.data) : "") + "]";
                break;
                }
            case Node.ELEMENT_NODE: {
                let nsp     = nod.namespaceURI ?? NS_HTM
                ,   tag     = (nod.tagName===nod.tagName.toUpperCase() ? nod.tagName.toLowerCase() : nod.tagName)       // preserve mixed-case tags, force others to lowercase
                ,   hasnsp  = false;

                tgt += "<" + tag;
                for(let atr of (nod.attributes || [])) {
                    if(atr.name==="xmlns") {
                        hasnsp = true;
                        if(atr.value===curnsp) { continue; }
                        }
                    tgt += atrText(atr.name,atr.value);
                    }
                if(!hasnsp && nsp!==curnsp) {
                    tgt += atrText("xmlns",nsp ?? "");
                    }
                if(nod.$uv?.onx) {
                    for(let key of (Object.keys(nod.$uv.onx) || [])) {
                        tgt += atrText(key,"[[" + nod.$uv.onx[key].name + "]]");
                        }
                    }
                if(nod.firstChild) {
                    tgt += ">";
                    if(skpchn) {
                        tgt += "...";
                        }
                    else {
                        for(let chl = nod.firstChild; chl; chl = chl.nextSibling) {
                            tgt += toHtml(chl,!SKPCHN,nsp);
                            }
                        }
                    tgt += "</" + tag + ">";
                    }
                else {
                    tgt += "/>";
                    }
                break;
                }
            case Node.TEXT_NODE: {
                tgt += nod.data;
                break;
                }
            default: {
                tgt += "[" + (nod ? ("node:" + nod.nodeName) : nod) + "]";
                break;
                }
            }
        }

    return tgt;
    }

function printNode(obj) {
    return toHtml(obj,SKPCHN);
    }

//**********************************************************************************************************************
