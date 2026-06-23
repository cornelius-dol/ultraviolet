const UvVersion = Object.freeze((() => {
    let VERSION = "1.00_dev"; /*2026.0622.2226*/                                                                            // version (the commented datestamp is when the version was last updated)
    let BUILD   = "2026.0622.2226";                                                                                     // build datestamp (separate from the version datestamp so they can be updated independently)
    return { VERSION, BUILD };
    })());
