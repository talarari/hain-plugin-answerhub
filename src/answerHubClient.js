import fetch from 'node-fetch';
import base64 from 'base-64';


export default (username,password,baseUrl,log)=> {
    const answerHubFetch = (relativePath) => {
        const authToken = base64.encode(`${username.trim()}:${password.trim()}`).trim();
        log(authToken);
        return (fetch(`${baseUrl}/services/v2${relativePath}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authToken}`
                }
            }).then(res=> res.json()));
    };

    const search = (term) => {
        return answerHubFetch(`/node.json?q=${term}&sort=commentCount`)
            .then(res=> {
                return Promise.all(res.list.map(item =>{
                        return Promise.all(item.answers.map(answerId=> answerHubFetch(`/answer/${answerId}.json`)))
                            .then(answerInfos=> {
                                item.answers = answerInfos;
                                return item;
                            });
                    }))
                    .then(itemsWithAnserInfos=> {
                        res.list =itemsWithAnserInfos;
                        return res;
                    });
            })
    };

    return{
        search
    };
}