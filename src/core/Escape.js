// ---------------------------------------------------------------------------------------------------------------------
// Copyright 2025, L.P. Cornelius Dol
// ---------------------------------------------------------------------------------------------------------------------

/**
  * Escape
  * ====================================================================================================================
  *
  * Allows throwing of a text-coded exception with a description and optional detail. The detail is opaque to this class
  * and may be any object. It is coerced to an object with a single value of `value` if passed as a simple value.
  *
  * <span class="status-stable">Module Status: </span>
  *
  * ###### Construction
  *
  *     new Escape()
  *     new Escape(code)
  *     new Escape(code,text)
  *     new Escape(code,text,detail)
  *
  * ###### Parameters
  *
  *     code            String  Text code; e.g. "InvalidArgument". Default: "General".
  *     text            String  Text description of the error condition; e.g "The argument passed to function `xyz` is
  *                             invalid". Default: "(description not provided)".
  *     detail          Object  Detail object, whose content is defined by the specific error code. Default: {}.
  *                             If not an object this argument is converted to `{ "value": detail }`.
  */

function Escape(code,text,detail)
{
"use strict";
let exported=this||{};

// *********************************************************************************************************************
// CONSTRUCTION
// *********************************************************************************************************************

function init() {
    code   =code || "General";
    text   =text || "(error text not provided)";
    detail =(typeof detail==="object" && detail) || { "value": detail };

    // ALLOW HANDLING CONSISTENT WITH ERROR
    exported.name       ="Escape["+code+"]";
    exported.message    =text;
    exported.stack      =new Error().stack || "<no stacktrace>";
    }

// *********************************************************************************************************************
// API
// *********************************************************************************************************************

/** Get the escape code. */
exported.getCode=gCode;                                                                                                 // backward compatibility
exported.code   =gCode;
function gCode() { return code; }

/** Get the escape text. */
exported.getText=gText;                                                                                                 // backward compatibility
exported.text   =gText;
function gText() { return text; }

/** Get the escape detail object (this is optional and may be empty). */
exported.getDetail=gDetail;                                                                                             // backward compatibility
exported.detail   =gDetail;
function gDetail() { return detail; }

/** Get the escape as a string. */
exported.toString=toString;
function toString() { return "Escape["+code+"]: "+text; }

// *********************************************************************************************************************
init();
return exported;
}
