About Ultraviolet
========================================================================================================================

The Ultraviolet JavaScript Library (uvjs) is a compilation of high-quality functions that have been developed in real
world apps, curated by senior engineers, and deemed useful for broad consumption. It is completely self-contained,
versioned and distributed as a package, available to all application developers, and maintained by a senior systems
architect and developer.

Chief among them is the Ultraviolet micro-vdom module (UvDom), a self-contained module less than 8K unminimized, 4K
minimized, which provides everything needed to build high-performance frontend apps. It is small, fast, and completely
unopinionated as to how your app functions, maintains state, and is architected. It simply makes frontend UI easy.

This project is stable and does not exect to see a high velocity of changes and additions. In particular, the
UltravioletDOM component is deemed feature complete and does not expect to see any changes to that core module outside
of bug fixes.

Build tooling is deliberately avoided. The fundamental value is simplicity. The Ultraviolet Built Tool (UvBT) is used to
perform simple minimization of the project.

Status Indicators
------------------------------------------------------------------------------------------------------------------------

The library employs the following status indicators at the package, module, and function level.

**(experimental)**

The item and it's design is experimental and may be changed, renamed, or removed altogether. Use at your own risk.

**(unstable)**

The item design is in a state of flux with respect to it's API and contents, but is expected to progress to stable.

The API is not yet stable and future changes may introduce incompatibilities as the interface evolves. Check
documentation when a new version of this library is deployed.

**(stable)**

The item design is considered stable and the interfaces should not change; if they do the change should normally be
transparent and backward compatible.

However modules may be moved to different packages and functions may be split into separate modules. When a function is
moved, a deprecated alias will replace the original, but the dependent project will need to add the new module in its
package. Deprecated functions *will* eventually be removed.

All changes required in dependent code should be simple, mechanical operations.

**(locked)**

The item design is locked. Modules may be added, but not removed. Public functions may be added, but not removed, nor
incompatibly altered.

**(deprecated)**

The item has been deemed flawed and/or inappropriate and will be removed, or it is an alias for something moved to
another module. Use of the old function should be changed at the earliest convenient time. When a better solution
replaces the original, it will be so noted.

Developers may choose to add a copy of deprecated code for use in their project if they wish to continue with it. Copies
will remain available from the git repository indefinitely.

Ultraviolet DOM Engine
------------------------------------------------------------------------------------------------------------------------

Ultraviolet DOM (uvDOM) is a single JavaScript module for building high performance web applications. It should fit very
nicely into any existing codebase without requiring new tooling or significant engineering. Ultraviolet is predicated
upon a philosophy of "just write the code" — most often the answer to "How do I do *X* with Ultraviolet" is "just write
the code to do *X*".

###### Highlights

  - Easy     : The entire API can be mastered in minutes, with explicit, obvious, easily debugged behavior.
  - Fast     : Approximately 7% slower vs painfully imperative vanilla DOM code.
  - Small    : Under 500 LOC excluding documentation & comments; under 6K minimized (Closure); under 4K compressed.
  - Zero-dep : Requires no dependencies, bundling, compilation, or tooling. BYO minimizer or use the provided JS.

To use Ultraviolet you should be comfortable with JavaScript on the frontend, and be using a modern, evergreen browser.

###### Installation

Step one:

    <script src="/path/to/your/library/folder/UvDom.js"></script>

There is no step two. Use of a minimizer is recommended, but not required; the Closure Compiler does an excellent job of
reducing (but also obfuscating) the code, but a simple minimizer that simply removes comments and whitespace is more
than adequate. You should do what is best for *your* application.

###### What μvDOM is Not

Ultraviolet DOM is not a frontend development framework. It doesn't provide routing, AJAX, streams, datastores, vendor
prefixing, CSS-in-JS, or any form of HTML-in-CSS templates (aka JSX). It aims to do one thing, and do it very, very well
— make building a frontend UI using plain old JavaScript a breeze.

It is intended to be completely unopinionated, and to work well with whatever methodology and libraries you already use
for development. Due to it's minimalist design, using Ultraviolet with other systems, including other UI frameworks is
only as difficult as the *other* framework makes it.

###### Conceptual Overview

Ultraviolet works by, first, defining a description of what the UI should look (virtual DOM), then, second, rendering
such a view to the DOM making only the changes needed to materialize the description as a DOM tree. Each time any
program state changes which affects a particular view you describe the new view in full and call Ultraviolet to render
it into the DOM. This is so efficient that most applications can simple describe the entire page every time *anything*
changes and throw the result at Ultraviolet.

Because views are created using JavaScript, the full Turing-complete power of the language can be brought to bear in
creating your UI. No limitations, no edge-cases that were not considered, no frustrating "fighting the framework"
absorbing hours of developer time. Just JavaScript. In all it's functional power and glory.

Generators are functions which generate a portion of a view description. They can be as simple or complex as necessary,
and repeated code in views can be readily DRY'd out at will using normal code refactoring processes to make reusable
code units that represent common UI elements, like buttons, checkboxes, text fields, and labels. Many of the things for
which other frameworks would require a fully fledged "component", often with a lot of boilerplate, are just functions
with Ultraviolet.

Because the define/render calls are explicit and imperative, making isolated subviews, or "islands", is as simple as
creating a new module (or class if you are an OO aficionado) and using the `UvDom.update()` function to create a
function that can be plugged into another view. This "view-updater" function will coordinate and segregate the
responsibility for producing a section of the DOM tree.

Because a component is "just another module" (or class, or function), one interacts with it like any other, with no
special constraints or considerations.

###### What is Virtual DOM?

A virtual DOM tree is a JavaScript data structure that describes a DOM tree. It consists of nested virtual DOM
descriptors, structures which describe a DOM node. When a virtual DOM tree is rendered, it is used as a blueprint to
create a DOM tree that matches its structure.

Typically, virtual DOM trees are fully recreated every render cycle, triggered in response to program state changes.
Ultraviolet compares the vDOM to the actual DOM and only modifies DOM elements in spots where there are changes. It may
seem wasteful to recreate the vDOM so frequently, but as it turns out, modern JavaScript engines can create hundreds of
thousands of objects in less than a millisecond. On the other hand, modifying the DOM is several orders of magnitude
more expensive than creating vDOM.

The result of this rendering model that recreates the entire vDOM tree on every render is a declarative API, a style of
rendering that makes it drastically easier to manage UI complexity. In particular, a large portion of the vDOM, or it's
entirety can be efficiently recreated without concern for manually identifying the parts of the DOM which are actually
affected by a particular state change. Many applications will simply recreate the entire vDOM on every render.

To illustrate why declarative mode is so important, consider the DOM API and HTML. The DOM API is an imperative retained
mode API and requires (1) writing out exact instructions to assemble a DOM tree procedurally, and (2) writing out other
instructions to update that tree. The imperative nature of the DOM API means you have many opportunities to
micro-optimize your code, but it also means that you have more chances of introducing failure-to-update bugs and more
complexity, making the code harder to understand.

In contrast, using vDOM, you can describe a DOM tree in a far more natural and readable way, without worrying about
forgetting to append a child to a parent, forgetting that a state change affects multiple disparate DOM elements, etc.
Using vDOM allows you to describe dynamic DOM trees without having to manually write multiple sets of DOM API calls to
efficiently create and subsequently update the UI in response to arbitrary data changes.

Contributions
========================================================================================================================

Contributions from other developers will be considered, but the any such work should be discussed in an issue first. The
pervading priority of this project is to limit growth and feature creep; to provide a minimal, solid foundation for web
development, **not to attempt to be all things to all developers**.

Dependencies between modules should be avoided, especially between modules in other packages. The intent is for the end
developer to be able to pick and choose what functionality they wish to incorporate in their project to the maximum
extent reasonable.
