import createAnswerClient from './answerHubClient';
module.exports = (pluginContext) => {
    const {shell,logger,preferences,app} = pluginContext;

    const initClient = prefs=> {
        logger.log('prefs updated');
        logger.log(prefs.username);
        logger.log( prefs.password);
        logger.log( prefs.answerHubBaseUrl);

        if (prefs.username && prefs.password && prefs.answerHubBaseUrl){
            answerHubClient = createAnswerClient(prefs.username,prefs.password,prefs.answerHubBaseUrl,logger.log);
        }
    };

    const showLoginMessage = res =>{
        res.add({
            id: "login",
            title: "Please enter Username and Password",
            desc: "Click this to open preferences",
            icon :"#fa fa-unlock-alt",
            payload:{
                action:'prefs'
            }
        });
    };

    const hideLoginMessage = res => res.remove('login');

    const showLoader = res =>{
        res.add({
            id: "loading",
            title: "Loading...",
            desc: "Results are on their way.",
            icon :"#fa fa fa-spinner fa-spin fa-3x fa-fw"
        });
    };

    const hideLoader = res=> res.remove('loading');
    const getBestAnswer = answers => answers.find(x=> x.marked);
    const getQuestionUrl = (id,title) => `http://soluto.cloud.answerhub.com/questions/${id}/${title.replace('?','')}.html`;

    var answerHubClient = undefined;
    const startup = ()=>{
        initClient(preferences.get());
        preferences.on('update',initClient);
    };
    const search =(query, res)=> {
        const query_trim = query.trim();
        if (query_trim.length === 0) return;

        if (!answerHubClient){
            showLoginMessage(res);
            return;
        }
        else{
            hideLoginMessage(res);
        }

        showLoader(res);

        answerHubClient.search(query_trim)
            .then(match=> {
                hideLoader(res);
                match.list.forEach( item=> {
                    const bestAnswer = getBestAnswer(item.answers);
                    res.add({
                        id: item.id,
                        title: item.title,
                        desc: item.body,
                        payload: {
                            action :'open',
                            id: item.id,
                            title: item.title,
                            bestAnswer
                        },
                        preview : bestAnswer ? true :false
                    })
                });
            })
            .catch(err=>{
                hideLoader(res);
                res.add({
                    id: "error",
                    title: "Oops, could'nt get your results",
                    desc: "Make sure plugin preferences are correct, Click here to check",
                    icon :"#fa fa-exclamation-circle",
                    action: 'prefs'
                });
            });
    };

    const execute = (id, payload) =>{
        if (!payload.action) return;
        switch (payload.action){
            case 'prefs':{
                app.openPreferences('hain-plugin-answerhub');
                break;
            }
            case 'open':{
                if (!payload || !payload.id|| !payload.title) return;
                const url = getQuestionUrl(payload.id,payload.title);
                shell.openExternal(url);
                break;
            }

        }
    };

    const renderPreview =(id, payload, render)=> {
        if (!payload.bestAnswer) return;

        render(`<html><body>${payload.bestAnswer.bodyAsHTML}</body></html>`)
    };

    return { startup,search, execute,renderPreview }
};
