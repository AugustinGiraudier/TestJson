var GHttpData = {
    'USER' : null,
    'REPO' : null,
    'FILE' : null,
    'USER_TOKEN' : null,
    'COMMIT_MESSAGE' : null,
    'BRANCH' : null,
    'CONTENT' : null,
}
var GHttpCallbacks = {
    'MISSING_PARAM' : null,
    'SUCCESS' : null,
    'ERROR' : null,
    'ASK_USER_TOKEN' : null,
}

//
async function GHttpGetJsonContent(){
    
    if(!GHttpRequireVar(["USER", "REPO", "FILE"])) return;

    const resp = await fetch(GHttpGetCurrentUrl());
    const json = await resp.json();
    var contents = JSON.parse(atob(json['content']));
    return contents;
}

//
async function GHttpSetJsonContent() {

    if(!GHttpRequireVar(["USER", "REPO", "FILE", "USER_TOKEN", 'CONTENT'])) return;

    let url = GHttpGetCurrentUrl();

    // Obtenir le SHA du fichier existant
    let response = await fetch(url, {
        headers: {
            "Authorization": `token ${GHttpData.USER_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    });
    
    if (!response.ok) {
        console.error("Impossible to find the file... maybe the parameters or the token are not valid...");
        GHttpCallbacks.ERROR ? GHttpCallbacks.ERROR() : null;
        return;
    }
    
    let fileData = await response.json();
    let sha = fileData.sha;
    let base64Content = btoa(JSON.stringify(GHttpData.CONTENT));

    // Préparer les données pour la mise à jour
    let updateData = {
        message: GHttpData.COMMIT_MESSAGE == null ? "GHttp Automatic commit" : GHttpData.COMMIT_MESSAGE,
        content: base64Content,
        sha: sha,
        branch: GHttpData.BRANCH == null ? "main" : GHttpData.BRANCH
    };

    // Effectuer la requête de mise à jour
    response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GHttpData.USER_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
    });

    if (response.ok) {
        console.log("Success !");
        GHttpCallbacks.SUCCESS ? GHttpCallbacks.SUCCESS() : null;
    } else {
        console.error("Impossible to modify the file... maybe the content is not valid");
        GHttpCallbacks.ERROR ? GHttpCallbacks.ERROR() : null;
        return;
    }
}

async function GHttpCreateFile() {

    if(!GHttpRequireVar(["USER", "REPO", "FILE", "USER_TOKEN"])) return;

    let url = GHttpGetCurrentUrl();

    // Préparer les données pour la mise à jour
    let createData = {
        message: GHttpData.COMMIT_MESSAGE == null ? "GHttp Automatic commit" : GHttpData.COMMIT_MESSAGE,
        content: btoa(""),
        branch: GHttpData.BRANCH == null ? "main" : GHttpData.BRANCH
    };

    // Effectuer la requête de mise à jour
    response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GHttpData.USER_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(createData)
    });

    if (response.ok) {
        console.log("Success !");
        GHttpCallbacks.SUCCESS ? GHttpCallbacks.SUCCESS() : null;
    } else {
        console.error("Impossible to create the file... maybe the content or the token are not valid");
        GHttpCallbacks.ERROR ? GHttpCallbacks.ERROR() : null;
        return;
    }
}




////////////////////////////////////////////////////////////////////////////////////////////////
//
function AskUserToken(){
    if(GHttpCallbacks.USER_TOKEN != null){
        GHttpCallbacks.USER_TOKEN();
    }
    else{ // default case
        GHttpData.USER_TOKEN = prompt('Please enter the user token');
    }
}

//
function GHttpGetCurrentUrl(){
    return `https://api.github.com/repos/${GHttpData.USER}/${GHttpData.REPO}/contents/${GHttpData.FILE}`;
}

//
function GHttpRequireVar(vars){
    for(let varName of vars){
        if(GHttpData[varName] == null || GHttpData[varName].length == 0){
            if(varName == "USER_TOKEN"){
                AskUserToken();
                continue;
            }
            console.error("Unset required parameter : " + varName);
            GHttpCallbacks.MISSING_PARAM ? GHttpCallbacks.MISSING_PARAM(varName) : null;
            return false;
        }
    }
    return true;
}