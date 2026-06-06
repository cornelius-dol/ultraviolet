// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * DataLink
  * ====================================================================================================================
  *
  * Duplex streaming data link for JSON messaging utilizing the best communications technology supported by the runtime.
  * Currently this employs a WebSocket with fallback to AJAX but in future other technology may be added.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Dependencies:
  *
  *     {{@Ajax}}
  *     {{@util/GenUtil|GenUtil}}
  *
  * ###### Construction
  *
  *     new DataLink(config)
  *
  * ###### Arguments:
  *
  *     config          Configuration parameters.
  *
  * ###### Config:
  *
  *     apiUrl          Base URL (possibly a relative reference) for the API namespace.
  *     apiQuery        Base query data.
  *     poll            Defines the options for an automatic poll message.
  *     . message       An object or function defining the message to send.
  *     . frequency     Frequency of polls in milliseconds.
  *     retryLimit      Maximum number of times to attempt a long-lived connection to the server (e.g. when using a
  *                     WebSocket). Defaults to `POSITIVE_INFINITY`.
  *     retryDelay      Number of seconds to delay between connection attempts. Defaults to 3.
  *     --------------  ------------------------------------------------------------------------------------------------
  *     attempt         This function is invoked when the remote link is attempted. If omitted the event is ignored.
  *     opened          This function is invoked when the remote link is opened. If omitted the event is ignored.
  *     receive         This function receives and distributes link messages. If omitted messages are simply discarded.
  *     closed          This function is invoked when the remote link is closed. If omitted the event is ignored.
  *     error           This function receives and distributes link errors. If omitted errors are ignored.
  *     log             This function receives and logs console messages. Not used by debug messages.
  *
  * ###### Error Arguments & Return:
  *
  *     msg             Object containing an incoming message.
  *     rty             Retry remaining count. Can be POSITIVE_INFINITY.
  *     =>              Nothing.
  *
  * ###### Receive Arguments & Return:
  *
  *     msg             Object containing an incoming message.
  *     =>              Nothing.
  *
  * ###### Message Arguments & Return:
  *
  *     =>              A message object.
  *
  * ###### Message Structure and Details
  *
  * In order to support AJAX transparently alongside newer asynchronous technologies and for compatibility with RESTful
  * web services, the message object in both directions must conform to the following structure, designed to be
  * compatible with REST over HTTP:
  *
  *     head
  *     . action        API Action: "GET", "PUT", "POST", ...
  *     . subpath       API subpath. Example: "v1/emulation/session.name/1".
  *     . query         Object of field/value pairs corresponding to query data.
  *     body            Object of payload data. This will be the content for an AJAX request and must contain all data
  *                     needed by the application layer.
  *
  * AJAX support only creates the abstraction of two-way messaging; in actual fact messages will be transmitted with
  * request/response latency and size overhead. Messages are not queued by this module; if no better means of
  * communication link is available when a message is sent, AJAX will be used. Any response to an AJAX message will be
  * delivered to the receiver function.
  *
  * Background polling of the host for back-channel state is supported but it's up to the application layer to handle
  * these messages in a useful way. Polling frequency is done at the configured rate, and can be disabled. The poll
  * message must be configured by the application. If configured, polling is done regardless of the current underlying
  * transport.
  *
  * Confer: [WebSocket documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).
  */

function DataLink(config)
{
"use strict";
let exported=this || {};                                                                                                // allow invocation with or without new

const   SEND_NOW        =true
,       FOREVER         =Number.POSITIVE_INFINITY;

let     asyU            =new AsyncUtil()
  ,     genU            =new GeneralUtil()

let     ajax            =null
  ,     closed          =false
  ,     debug           =false
  ,     pollTimer       =0
  ,     skt             =null
  ,     sktRetries     =-1
  ,     sktPending      =0
  ,     sktUrl          =null

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {                                                                                                       // self-contained init avoids leaking temp objects into module closure
    config=genU.clone(config);
    config.retryDelay=config.retryDelay>0 ? config.retryDelay : 3;
    config.retryLimit=config.retryLimit>0 ? config.retryLimit : FOREVER;

    ajax=new Ajax({
        baseUrl         : config.apiUrl,
        baseQuery       : config.apiQuery,
        });

    if(WebSocket) {
        try {
            if(config.log) { config.log("WebSocket supported"); }
            sktRetries=config.retryLimit;
            sktUrl=new URL(config.apiUrl,globalThis.location.href);
            sktUrl.protocol=sktUrl.protocol.replace("http","ws");
            sktUrl=sktUrl.href;
            wsOpen();
            }
        catch(thr) {
            if(config.log) { config.log("WebSocket support error:",sktUrl,thr); }
            }
        }
    else {
        if(config.log) { config.log("WebSocket not supported"); }
        }
    linkPoll(!SEND_NOW);                                                                                                // queue first poll
    }

// *********************************************************************************************************************
// PUBLIC FUNCTIONS
// *********************************************************************************************************************

/**
  * Retrieve the underlying `Ajax` module for making an AJAX request/response.
  *
  * **Arguments & Return:**
  *
  *     =>              An `Ajax` module configured for the end-point associated with this DataLink.
  */
exported.ajax=gAjax;
function gAjax() {
    return ajax;
    }

/**
  * Close this datalink. After calling this, the datalink can no longer be used, any connections will be closed, and all
  * attempts to send data will fail.
  *
  * **Arguments & Return:**
  *
  *     cod         Optional error code. Default=1000.
  *     txt         Optional human readable reason for closing the socket. Default="Normal close".
  *     =>          A reference to this module.
  *
  * Confer: [WebSocket status codes](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes).
  */
exported.close=close;
function close(cod,txt) {
    closed=true;
    wsClose(cod,txt);
    return exported;
    }

/**
  * Get/set debug flag.
  *
  * **Arguments & Return:**
  *
  *     flg         Set true/false to set debugging of data messages, omit to get current state.
  *     =>          The debug state if no argument supplied, otherwise a reference to this module.
  *
  * ###### Example
  *
  *     let link=new DataLink(...).debug(true);
  *     console.print(link.debug() ? "Debugging is enabled" : "Debugging is disabled");
  *     link.debug(false);
  */
exported.debug=gsDebug;
function gsDebug(on) {
    if(on!=undefined) {
        debug=on || false;
        ajax.debug(on);                                                                                                 // also enable debugs for the ajax transmissions
        return exported;
        }
    else {
        return debug;
        }
    }

/**
  * Asyncronously send a message. This function makes it's best attempt to deliver the message, but there is no
  * guarantee that the message will make it to the other end.
  *
  * **Arguments & Return:**
  *
  *     msg             Object or JSON string representing the message to send (refer to required format above).
  *     =>              A reference to this module.
  */
exported.send=send;
function send(msg) {
    linkField(msg,msg             ,"Message object");
    linkField(msg,msg.head        ,"Message field 'head'");
    linkField(msg,msg.head.action ,"Message field 'head.action'");
    linkField(msg,msg.head.subpath,"Message field 'head.subpath'");
    linkData(msg);
    return exported;
    }

/**
  * Send a poll message immediately, if polling is configured.
  *
  * This is a convenience wrapper and uses the configured poll message. Itenables adaptive rapid polling beyond the
  * background status polling. The pending background poll, if any, will be cancelled and rescheduled.
  *
  * If the the poll parameters are not configured then this is a no-op. Specifically, if `config.poll.message` is null
  * or undefined, no poll is sent and no error is indicated.
  *
  * **Arguments & Return:**
  *
  *     =>              A reference to this module.
  */
exported.sendPoll=sendPoll;
function sendPoll() {
    linkPoll(SEND_NOW);
    return exported;
    }

// *********************************************************************************************************************
// PRIVATE FUNCTIONS
// *********************************************************************************************************************

function linkAttempt(rmn) {
    if(debug) { console.log("[DB]","Data Link attempt for '"+config.apiUrl+"': ",evt); }
    if(!closed && config.attempt!=null) { config.attempt({ retryLimit: config.retryLimit, retriesRemaining: rmn }); }
    }

function linkOpened(evt) {
    if(debug) { console.log("[DB]","Data Link opened for '"+config.apiUrl+"': ",evt); }
    if(!closed && config.opened!=null) { config.opened(evt); }
    }

function linkClosed(evt) {
    if(debug) { console.log("[DB]","Data Link closed for '"+config.apiUrl+"': ",evt); }
    if(!closed && config.closed!=null) { config.closed(evt); }
    }

function linkFailed(msg) {
    if(debug) { console.log("[DB]","Data Link error for '"+config.apiUrl+"': ",msg); }
    if(!closed && config.error!=null) { config.error(msg,sktRetries); }
    }

function linkData(msg) {
    if(debug) { console.log("[DB]","Data Link send for '"+config.apiUrl+"': ",msg); }
    if(!closed && !wsSend(msg)) {
        ajax.send(msg.head.action,msg.head.subpath,msg.head.query,msg.body)
        .then(function(rspdta) {
            linkRecv({ head: msg.head, body: rspdta });
            })
        .catch(function(err) {
            if(debug) { console.log("[DB]","Data Link AJAX error for '"+config.apiUrl+"': ",err); }
            linkFailed(err);
            });
        }
    }

function linkPoll(sndnow) {
    if(!closed && config && config.poll && config.poll.message) {
        clearTimeout(pollTimer);
        if(sndnow) { send(genU.isFunc(config.poll.message) ? config.poll.message() : config.poll.message); }
        if(config.poll.frequency>0) { pollTimer=setTimeout(sendPoll,config.poll.frequency); }
        }
    }

function linkRecv(msg) {
    if(debug) { console.log("[DB]","Data Link recv for '"+config.apiUrl+"': ",msg); }
    if(!closed && config.receive!=null) { config.receive(msg); }
    }

function linkField(msg,fld,dsc) {
    if(fld==null) { throw new Escape("Message","Data Link: "+dsc+" is required"+(msg!==fld ? "("+JSON.stringify(msg)+")" : "")); }
    }

// *********************************************************************************************************************
// PRIVATE FUNCTIONS - WEBSOCKET
// *********************************************************************************************************************

function wsOpen() {
    if(closed || sktUrl==null || sktPending) {
        return false;
        }

    if(skt!=null) try { skt.close(); } catch(err) {/*ignore*/}                                                          // attempt close and ignore error
    skt=null;

    if(sktRetries==0) {
        let err="WebSocket connection attempts exhausted for "+sktUrl;
        if(debug) { console.log("[DB]",err); }
        sktRetries=-1;                                                                                                  // flags to callback that retries will no longer be attempted
        linkFailed(err);
        return false;
        }
    else if(sktRetries<0) {
        return false;
        }

    let dly=(sktRetries>=config.retryLimit ? 0 : config.retryDelay);

    --sktRetries;                                                                                                       // INFINITY - 1 = INFINITY
    sktPending=asyU.defer((dly*1000),function() {
        sktPending=0;
        try {
            if(debug) { console.log("[DB]","WebSocket connection attempt to "+sktUrl+" (retries remaining: "+(sktRetries+1)+")"); }
            linkAttempt(sktRetries);
            skt=new WebSocket(sktUrl);
            skt.onopen   =wsOpened;
            skt.onclose  =wsClosed;
            skt.onerror  =wsFailed;
            skt.onmessage=wsReceived;
            }
        catch(err) {
            if(config.log) { config.log("WebSocket error:",sktUrl,err); }
            wsOpen();
            }
        });
    if(debug) { console.log("[DB]","WebSocket connection queued for action"+(dly>0 ? " in "+dly+" seconds." : ".")); }

    return true;
    }

function wsClose(cod,txt) {
    sktRetries=-1;
    if(skt!=null) {
        try { skt.close((cod || 1000),(txt || "Normal close")); } catch(err) {/*ignore*/}                               // error is ignored
        }
    }

function wsSend(msg) {
    if(skt==null) {
        wsOpen();
        return false;                                                                                                   // not ready
        }
    else if(skt.readyState!=WebSocket.OPEN) {
        return false;
        }
    else {
        try {
            skt.send(JSON.stringify(msg));
            return true;
            }
        catch(err) {
            if(config.log) { config.log("WebSocket error:",sktUrl,err); }
            linkFailed(err);
            wsOpen();
            return false;                                                                                               // send failed
            }
        }
    }

function wsOpened(evt) {
    if(config.log) { config.log("WebSocket opened:",sktUrl); }

    if(closed) {
        wsClose();
        return;
        }

    sktRetries=config.retryLimit;
    linkOpened(evt);
    }

function wsClosed(evt) {
    if(config.log) { config.log("WebSocket closed:",sktUrl); }
    linkClosed(evt);
    wsOpen();
    }

function wsFailed(err) {
    if(config.log) { config.log("WebSocket failed:",sktUrl); }
    linkFailed(err);
    wsOpen();
    }

function wsReceived(evt) {
    linkRecv(JSON.parse(evt.data));
    }

// *********************************************************************************************************************
init();
return exported;
}
