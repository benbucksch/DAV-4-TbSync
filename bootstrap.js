/*
 * This file is part of DAV-4-TbSync.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

//no need to create namespace, we are in a sandbox

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Task.jsm");

let thisID = "";

let onInitDoneObserver = {
    observe: Task.async (function* (aSubject, aTopic, aData) {        
        let valid = false;
        try {
            Components.utils.import("chrome://tbsync/content/tbsync.jsm");
            valid = tbSync.enabled;
        } catch (e) {
            //if this fails, tbSync is not loaded yet and we will get the notification later again
        }
        
        //load this provider add-on into TbSync
        if (valid) {
            yield tbSync.registerProvider(thisID, "dav", "//dav4tbsync/content/dav.js");
        }
    })
}

function install(data, reason) {
}

function uninstall(data, reason) {
}

function startup(data, reason) {
    //possible reasons: APP_STARTUP, ADDON_ENABLE, ADDON_INSTALL, ADDON_UPGRADE, or ADDON_DOWNGRADE.

    //set default prefs (examples)
    let branch = Services.prefs.getDefaultBranch("extensions.dav4tbsync.");
    branch.setIntPref("maxitems", 50);
    branch.setCharPref("clientID.type", "TbSync");
    branch.setCharPref("clientID.useragent", "Thunderbird CalDAV/CardDAV");    
    branch.setBoolPref("addCredentialsToUrl", false);

    thisID = data.id;
    Services.obs.addObserver(onInitDoneObserver, "tbsync.init.done", false);

    //during app startup, the load of the provider will be triggered by a "tbsync.init.done" notification, 
    //if load happens later, we need load manually 
    if (reason != APP_STARTUP) {
        onInitDoneObserver.observe();
    }
}

function shutdown(data, reason) {
    Services.obs.removeObserver(onInitDoneObserver, "tbsync.init.done");

    //unload this provider add-on and all its loaded providers from TbSync
    try {
        tbSync.unloadProvider("dav");
    } catch (e) {
        //if this fails, tbSync has been unloaded already but has unloaded this addon as well
    }
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}
