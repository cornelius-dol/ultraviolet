// ---------------------------------------------------------------------------------------------------------------------
// Build Script: See documentation for Ultraviolet Build Tool (UBT).
// ---------------------------------------------------------------------------------------------------------------------

"use strict";

let log;

// *********************************************************************************************************************
// SETUP AND TEARDOWN
// *********************************************************************************************************************

export async function setup(ctx,ubt) {
    log = ubt.log;

    ctx.build.dumpOnError = false;
    ctx.docFolder = ubt.fsInfo(ctx.prjFolder,"doc/");

    ubt.buildSequence(packagePrimary  ,[ buildProject ]);
    ubt.buildSequence(packageFinal    ,[ buildProject, packagePrimary, packageSecondary ]);

    ubt.createFolders(ctx.project.wrkFolder);

    if(ctx.action==="packageFinal") {
        ubt.heading2("Final Build Prechecks");

        log("  1. Have all debugs been removed (search for `/*" + "*/` markers)?");
        log("  2. Have code changes been fully committed?");
        log("  3. Are you on the release branch?");
        log();
        if(!ubt.confirm("Are all of these prerequisites met?")) { throw new ubt.Error("Precheck","Prerequisite was not met"); }
        }
    }

export async function teardown(ctx,ubt) {
    if(ctx.action==="packageFinal") { ubt.deleteFolders(ctx.project.wrkFolder); }
    //*/log();
    //*/log(ubt.objString("Build Context: ",ctx)); log();
    }

// *********************************************************************************************************************
// BUILD ACTIONS
// *********************************************************************************************************************

export async function buildFile(ctx,ubt) {
    if(ctx.file.nameExt===".java") {
        await ubt.compileJava(ctx.file);
        await ubt.runJavaTests(ctx.file);
        }
    if(ctx.file.nameExt===".js") {
        await ubt.validateJs(ctx.file);
        await ubt.runJsTests(ctx.file);
        }
    if(ctx.file?.nameBase.endsWith("UvDom")) {
        let tgtmin = 8192, tgtzip = 4096;

        log();

        log("Checking UvDom sizes...");
        await ubt.compileJavaScript(`${ctx.folder}UvDom.js`,`${ctx.project.wrkFolder}UvDom.js.tmp`,{ noLog: true });
        await ubt.createArchive(`${ctx.project.wrkFolder}UvDom.zip.tmp`, [{ folder: ctx.project.wrkFolder, glob: "UvDom.js.tmp" }], { noLog: true });
        let sizcpl = ubt.fsInfo(`${ctx.project.wrkFolder}UvDom.js.tmp`).size;
        let sizzip = ubt.fsInfo(`${ctx.project.wrkFolder}UvDom.zip.tmp`).size;
        await ubt.runJava(`${ctx.build.binFolder}ResGen.jar`,[
            `-collapseLines:indented`,
            `-banner:// Copyright 2025, L.P. Cornelius Dol`,
            `-header:`,
            `-src.include:UvDom.js`,
            `-src.exclude:Z*`,
            `-tgt:${ctx.project.wrkFolder}UvDom.js.tmp`,
            `${ctx.prjFolder}src/vdom/`,
            ], { noLog: true });
        await ubt.createArchive(`${ctx.project.wrkFolder}UvDom.zip.tmp`, [{ folder: ctx.project.wrkFolder, glob: "UvDom.js.tmp" }], { noLog: true });
        let sizwcc = ubt.fsInfo(`${ctx.project.wrkFolder}UvDom.js.tmp`).size;
        let sizwcz = ubt.fsInfo(`${ctx.project.wrkFolder}UvDom.zip.tmp`).size;
        log(`             | Minimized <= ${tgtmin} | Compressed <= ${tgtzip}`);
        log(`  -----------|-------------------|-------------------`);
        log(`  WebCluster | ${alignR(sizwcc,17)} |  ${alignR(sizwcz,17)}`);
        log(`  Closure    | ${alignR(sizcpl,17)} |  ${alignR(sizzip,17)}`);

        ubt.deleteFiles(ubt.findFiles(`${ctx.project.wrkFolder}*.*.tmp`));
        if(sizwcc > tgtmin || sizwcz > tgtzip) { throw new Error("[SizeTarget] UvDom WebCluster size exceeds target"); }
        if(sizcpl > tgtmin || sizzip > tgtzip) { throw new Error("[SizeTarget] UvDom compiled size exceeds target"); }
        }
    }

export async function buildFolder(ctx,ubt) {
    await ubt.deleteFiles(ubt.findFiles(ctx.folder,"*.class"   ));
    await ubt.compileJava(ubt.findFiles(ctx.folder,"!(Z)*.java"));
    await ubt.validateJs (ubt.findFiles(ctx.folder,"!(Z)*.js"  ));
    if(ctx.action==="buildFolder") {
        await ubt.runJavaTests(ubt.findFiles(ctx.folder,"Z*.java"));
        await ubt.runJsTests  (ubt.findFiles(ctx.folder,"Z*.js"));
        }
    }

export async function buildProject(ctx,ubt) {
    if(ctx.action==="packageFinal") {
        ubt.heading2("Update Version and Build");
        await ubt.runJava(`${ctx.build.binFolder}SourceBuild.jar`, [
            "VERSION",
            `${ctx.project.srcFolder}UvVersion.js`,
            `${ctx.prjFolder}src/...`,
            ]);
        }
    log();
    ubt.copyFiles(`${ctx.project.srcFolder}UvVersion.js`,ctx.project.wrkFolder);

    log();
    ubt.heading2("Build/Validate All Files");
    log(`Delete ${ctx.prjFolder}**/*.class`);
    ubt.deleteFiles(ubt.findFiles(ctx.prjFolder,"*.class"));
    log("    - Done");
    for(ctx.folder of ubt.findFolders(ctx.prjFolder,"src/**")) {
        await buildFolder(ctx,ubt);
        }
    }

// *********************************************************************************************************************
// PACKAGE ACTIONS
// *********************************************************************************************************************

export async function packagePrimary(ctx,ubt) {
    let optargs = [
        `-collapseLines:indented`,
        `-banner:// Copyright 2025, L.P. Cornelius Dol`,
        `-header:`,
        `-src.include:*.js`,
        `-src.exclude:Z*`,
        ]
    ,   pkgfdrs = ubt.findFolders(`${ctx.prjFolder}src/?*`).map((fdr) => (fdr.path));

    // Minimize All Packages Together
    await ubt.runJava(`${ctx.build.binFolder}ResGen.jar`,[
        ...optargs,
        `-tgt:${ctx.project.wrkFolder}uv.min.js`,
        ...pkgfdrs,
        ]);

    // Minimize All Packages Individually
    for(let pkgfdr of pkgfdrs) {
        await ubt.runJava(`${ctx.build.binFolder}ResGen.jar`,[
            ...optargs,
            `-tgt:${ctx.project.wrkFolder}uv-${ubt.fsInfo(pkgfdr).name}.min.js`,
            pkgfdr,
            ]);
        }

    ubt.heading2(`Copy Build Artifacts to Other Locations`);
    ubt.copyArtifacts(ctx.project.wrkFolder,"*.@(js|txt)",ctx);
    }

export async function packageSecondary(ctx,ubt) {
    await ubt.generateDoc(`${ctx.project.wrkFolder}Documentation.zip`,[
        `${ctx.prjFolder}src/+`,
        ],{
        idxLevel    : 2,
        idxContent  : `!index.txt`,
        srcExclude  : `Z*`,
        subCompany  : `DolHub Sofware Engineering`,
        subTitle    : `Ultraviolet JavaScript Library`,
        tgtVerify   : `${ctx.docFolder}`,
        });
    }

export async function packageFinal(ctx,ubt) {
    await checkBranch(ctx,ubt,"release");

    ubt.heading2("Create Distribution Archive");
    await ubt.runJava(`${ctx.build.binFolder}SourceBuild.jar`, [
        `COPY`,
        `${ctx.project.srcFolder}UvVersion.js`,
        `${ctx.project.wrkFolder}`,
        `${ctx.project.bldFolder}$Version$-$Build$`,
        ]);
    }

// *********************************************************************************************************************
// UTILITY
// *********************************************************************************************************************

async function checkBranch(ctx,ubt,...rqdbchs) {
    let gitbch = await ubt.runGit("rev-parse", [ "--abbrev-ref", "HEAD" ], { noLog: true, returnOutput: true });
    for(let rqdbch of rqdbchs) {
        if(rqdbch.endsWith("/") && gitbch.startsWith(rqdbch)) { return gitbch; }
        if(rqdbch===gitbch)                                   { return gitbch; }
        }
    throw new ubt.Error("GitBranch", (ctx.action==="packageFinal" ? "Final" : "Test") + " build must be created on one of the following branches: " + rqdbchs + " (current branch=" + gitbch + ")");
    }

function alignR(txt,len,chr = " ") {
    return (txt.length>=len ? txt : (chr.repeat(len) + txt).slice(-len));
    }

// *********************************************************************************************************************
