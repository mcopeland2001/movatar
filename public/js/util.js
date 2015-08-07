function namespace(strNamespace) {
    "use strict";
    var packages = strNamespace.split('.');
    var objNamespace = window[packages[0]] || (window[packages[0]] = {});
    for(var i = 1; i < packages.length; i++) {
        objNamespace[packages[i]] = objNamespace[packages[i]] || {};
        objNamespace = objNamespace[packages[i]];
    }
    return objNamespace;
}