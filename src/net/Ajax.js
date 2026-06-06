// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * Ajax
  * ====================================================================================================================
  *
  * Promise based Asynchoronous  Javascript and X. Defaults to JSON input output.
  *
  * <p><span class="status-stable">Module Status: </span>
  * <p><span class="since">1.00</span>
  *
  * ###### Construction
  *
  *     new Ajax(config)
  *
  * ###### Dependencies:
  *
  *   * {{@util/GeneralUtil|GeneralUtil}}
  *
  * ###### Arguments:
  *
  *     config          Module configuration.
  *
  * ###### Config:
  *
  *     baseUrl         A URL or string which prefixes all requests made.
  *     baseQuery       An object, array or string which prefixes query data for all requests made.
  *     processing      A function which will be called with a `true` argument when a request begins, and `false` when
  *                     it completes (`Promise.finally`).
  *     throwIf         A list of keys, in order of precedence, which will cause the response to be thrown as an
  *                     exception if any are loosely true in the top level of response. This allows 2xx error responses
  *                     to be automatically converted to exceptions which can be processed with a promise catch handler.
  */

function Ajax(config)
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

const   PROCESSING      = true

const   genU            = new GeneralUtil()

let     debug           = false

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {                                                                                                       // self-contained init avoids leaking temp objects into module closure
    config=genU.clone(config||{});
    config.baseUrl  =config.baseUrl || "";
    config.baseQuery=queryDataToString("",config.baseQuery);                                                            // avoid processing base query for every send
    }

// *********************************************************************************************************************
// API
// *********************************************************************************************************************

exported.connect=genU.bindArgs(send,"CONNECT");
exported.head   =genU.bindArgs(send,"HEAD");
exported.options=genU.bindArgs(send,"OPTIONS");
exported.trace  =genU.bindArgs(send,"TRACE");

exported.delete =genU.bindArgs(send,"DELETE");
exported.get    =genU.bindArgs(send,"GET");
exported.set    =genU.bindArgs(send,"POST");
exported.link   =genU.bindArgs(send,"LINK");
exported.post   =genU.bindArgs(send,"POST");
exported.put    =genU.bindArgs(send,"PUT");
exported.patch  =genU.bindArgs(send,"PATCH");
exported.unlink =genU.bindArgs(send,"UNLINK");

/**
  * General purpose function to send an AJAX request.
  *
  * If the config specifies a `baseUrl` it is prepended verbatim to the supplied URL.
  *
  * If the config specifies a `baseQuery` it is prepended verbatim to the supplied query data after it is encoded as
  * query data. The query data should not have a leading `?`. The end result (allowing for blank/null query data) is:
  *
  *     {base-url}url?{baseQuery}&qry
  *
  * If an object is given for query data, it is encoded as a URI string. If an array is given it is simply joined with
  * an `&` separator. A simple value is coerced to a string and passed verbatim.
  *
  * If an object or array is given for body data, it is encoded as JSON. Other encodings must be passed as string values
  * and the content type and encoding specified with options. A simple value is coerced to a string and passed verbatim.
  *
  * **Arguments & Return:**
  *
  *     mth         HTTP method for request.
  *     url         URL to fetch.
  *     qry         Optional query object or value.
  *     bdy         Optional body object, array or value.
  *     opt         Optional `fetch` options passed to HTML API.
  *     =>          The `obj` supplied (allowing inline assignment by the caller).
  *
  * ###### Aliases:
  *
  *     connect (url, qry, bdy, opt)  =>  send("CONNECT", url, qry, bdy, opt);
  *     head    (url, qry, bdy, opt)  =>  send("HEAD"   , url, qry, bdy, opt);
  *     options (url, qry, bdy, opt)  =>  send("OPTIONS", url, qry, bdy, opt);
  *     trace   (url, qry, bdy, opt)  =>  send("TRACE"  , url, qry, bdy, opt);
  *
  *     delete  (url, qry, bdy, opt)  =>  send("DELETE" , url, qry, bdy, opt);
  *     get     (url, qry, bdy, opt)  =>  send("GET"    , url, qry, bdy, opt);
  *     set     (url, qry, bdy, opt)  =>  send("POST"   , url, qry, bdy, opt);
  *     link    (url, qry, bdy, opt)  =>  send("LINK"   , url, qry, bdy, opt);
  *     post    (url, qry, bdy, opt)  =>  send("POST"   , url, qry, bdy, opt);
  *     put     (url, qry, bdy, opt)  =>  send("PUT"    , url, qry, bdy, opt);
  *     patch   (url, qry, bdy, opt)  =>  send("PATCH"  , url, qry, bdy, opt);
  *     unlink  (url, qry, bdy, opt)  =>  send("UNLINK" , url, qry, bdy, opt);
  *
  * ###### Error Codes & Descriptions:
  *
  *   Error Code                    | Error Text
  *   ------------------------------|-----------------------------------------------------------------------------------
  *   `UnrecognizedContentType`     | HTTP response did not contain usable content
  *   `HTTP_nnn`                    | The text for HTTP response codes is obtained from the HTTP server's response.
  *
  * <p><span class="status-stable">Status: </span>
  * <p><span class="since">1.00</span>
  */
exported.send=send;
function send(mth, url, qry, bdy, opt) {
    function handleResponse(rsp) {
        let sts=rsp.status;
        return parseResponse(rsp).then(function(rsp) {
            if(debug) { console.log("Ajax Response: ",mth,url,rsp); }
            if(sts < 200 || sts > 299) {
                throw rsp;
                }
            config.throwIf && config.throwIf.forEach((key) => {
                let val = rsp[key];
                if(val) { throw(rsp); }
                });
            return rsp;
            });
        }

    function parseResponse(rsp) {
        let contyp=(rsp.headers.get("Content-Type") || "").split(";")[0].trim();
        if(rsp.status>=200 && rsp.status<=299) {
            switch(contyp) {
                case ""                 : return Promise.resolve({ Success: { SuccessCode: "HTTP_"+rsp.status, SuccessText: rsp.statusText, SuccessDetail: { Response: rsp } }});
                case "application/json" : return rsp.json();
                default                 : throw { Fail: { ErrorCode: "UnrecognizedContentType", ErrorText: "HTTP response did not contain usable content", ErrorDetail: { Response: rsp }}};
                }
            }
        else {
            switch(contyp) {
                case "application/json" : return rsp.json();
                default                 : throw { Fail: { ErrorCode: "HTTP_"+rsp.status, ErrorText: rsp.statusText, ErrorDetail: { HttpResponse: rsp }}};
                }
            }
        }

    if(config.baseUrl) { url=config.baseUrl+(url || ""); }
    url+=queryDataToString(config.baseQuery,qry);
    opt = opt || {};
    opt.method = mth.toUpperCase();

    if(!("credentials" in opt)) { opt.credentials = "same-origin"; }

    if(bdy!=null) {
        if(genU.isArray(bdy) || genU.isStruct(bdy)) {
            opt.headers = opt.headers || {};
            opt.headers["Content-Type"] = "application/json";
            opt.body = JSON.stringify(bdy);
            }
        else if(genU.isObject(bdy)) {
            opt.body = bdy;                                                                                             // some other object.
            }
        else {
            opt.body = ""+bdy;                                                                                          // primitive value or wrapper.
            }
        }

    if(debug) { console.log("Ajax Fetch: ",mth,url,opt); }
    config.processing?.(PROCESSING);
    return fetch(url,opt).then(handleResponse).finally(() => { config.processing?.(!PROCESSING); });
    }

/**
  * Sends a beacon message.
  *
  * Beacon messages are guaranteed by the browser to reach the server (unless the browser itself is closed). They are
  * asynchronous, always use `POST`, and may contain query data or content.
  *
  * **Arguments & Return:**
  *
  *     url         URL to POST.
  *     qry         Optional query object or value.
  *     bdy         Optional body object, array or value. Encoded as JSON.
  *     =>          A Promise, resolved if the beacon was queue, rejected if it was not.
  *
  * <p><span class="status-stable">Status: </span>
  * <p><span class="since">7.00</p>
  */
exported.sendBeacon=sendBeacon;
function sendBeacon(url, qry, bdy) {
    if(config.baseUrl) {
        url=config.baseUrl+(url || "");
        }
    url+=queryDataToString(config.baseQuery,qry);
    if(bdy!=null) {
        if(genU.isArray(bdy) || genU.isObject(bdy)) {
            opt.headers = opt.headers || new Headers();
            opt.headers.set("Content-Type", "application/json");
            opt.body = JSON.stringify(bdy);
            }
        else {
            opt.body = ""+bdy;
            }
        }
    if(navigator.sendBeacon(url,bdy)) {
        return Promise.resolve({});
        }
    else {
        return Promise.reject({ErrorCode:"BeaconNotQueued",ErrorText:"Browser did not queue request"});
        }
    }

/**
  * Add a new API method to this instance, returning a new API object. The original instance is not changed.
  *
  * **Arguments & Return:**
  *
  *     nam         The name of the API function.
  *     vrb         The name of the HTTP verb; defaults to `nam.toUpperCase()`.
  *     =>          A new object consisting of the current exports plus the new API function.
  *
  * ###### Example
  *
  *     let ajax=new Ajax(...).addMethod("rename"); // map ajax.rename(url, qry, bdy, opt) to send HTTP "RENAME ..." request
  *     ajax.rename("/some/resource","target=/some/other/resource"); // rename a resource
  *
  * <p><span class="status-stable">Status: </span>
  * <p><span class="since">1.00</span>
  */
exported.addMethod=addMethod;
function addMethod(nam,vrb) {
    let obj=genU.clone(exported);
    vrb=vrb || nam.toUpperCase();
    obj[nam]=genU.bindArgs(send,vrb);
    return obj;
    }

/**
  * Get/set debug flag.
  *
  * **Arguments & Return:**
  *
  *     flg         Set true/false to set debugging of data messages, omit to get current state.
  *     =>          The value of debug if no argument give; this object if one is supplied.
  *
  * ###### Example
  *
  *     let ajax=new Ajax(...).debug(true);
  *     console.print(ajax.debug() ? "Debugging is enabled" : "Debugging is disabled");
  *     ajax.debug(false);
  *
  * <p><span class="status-stable">Status: </span>
  * <p><span class="since">1.00</span>
  */
exported.debug=gsDebug;
function gsDebug(on) {
    if(on!=undefined) {
        debug=on || false;
        return exported;
        }
    else {
        return debug;
        }
    }

/**
  * Encode an object as URL query data.
  *
  * **Arguments & Return:**
  *
  *     dta         Object to encode.
  *     =>          The query data string.
  *
  * <p><span class="status-stable">Status: </span>
  * <p><span class="since">1.00</span>
  */
exported.objToUrlData=objToUrlData;
function objToUrlData(dta) {
    return queryAppend([],"",dta).join("&");
    }

// *********************************************************************************************************************
// UTILITY
// *********************************************************************************************************************

function queryDataToString(bas,dta) {
    let qry="",sep="?";

    if(bas) { qry=qry+sep+bas; sep="&"; }
    dta=objToUrlData(dta);
    return (dta ? qry+sep+dta : qry);
    }

function queryAppend(tgt,nam,val) {
    if(val) {
        if     (genU.isArray (val)) { queryAppendArray (tgt,nam,val);                  }
        else if(genU.isObject(val)) { queryAppendObject(tgt,nam,val);                  }
        else if(genU.isFunc  (val)) { tgt.push(nam + '=' + encodeURIComponent(val())); }
        else if(nam               ) { tgt.push(nam + '=' + encodeURIComponent(val)  ); }
        else                        { tgt.push(val);                                   }
        }
    return tgt;
    }

function queryAppendArray(tgt,nam,arr) {
    if(nam) { nam+="__"; }
    arr.map(function(val,idx) { queryAppend(tgt,nam+idx,val); }).join('&');
    }

function queryAppendObject(tgt,nam,obj) {
    if(nam) { nam+="."; }
    Object.keys(obj).map(function(key) { queryAppend(tgt,nam+key,obj[key]); }).join('&');
    }

// *********************************************************************************************************************
init();
return exported;
}
