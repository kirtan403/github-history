"use strict";

const rp = require('request-promise');
var fs = require('fs');


var githubUser = "<<USER_NAME>>"  // github user name
var password = "<<YOUR_PERSONAL_ACCESS_TOKEN_HERE>>"  // personal access token with repos permission
var fromDate = '2017-07-01'  //yyyy-mm-dd
const auth = 'Basic ' + new Buffer(githubUser + ':' + password).toString('base64');

rp({
    uri: 'https://api.github.com/users/' + githubUser + '/repos',
    headers: {
        'User-Agent': 'Request-Promise',
        'Authorization': auth
    },
    resolveWithFullResponse: true
})
.then(function(response) {

    let repos = JSON.parse(response.body);
    // console.log(repos);

    // loop through json to get the commits url
    let allCommitsRequests = [];

    repos.forEach(function(repo) {
        let commits_url = repo.commits_url.replace(/{\/sha}/,"");
        let req = rp({
          uri : commits_url + '?author=' + githubUser + '&since=' + fromDate,
          headers: {
              'User-Agent': 'Request-Promise',
              'Authorization': auth
          },
          resolveWithFullResponse: true
        });

        allCommitsRequests.push(req);
    });

    Promise.all(allCommitsRequests).then(function(results) {

        let outputs = [];
        results.forEach(function(result,index) {
            // console.log(result.body);

            var commits = JSON.parse(result.body);

            if (commits.length > 0) {
                var output = {};
                output.name = repos[index].name;
                output.commits = {};
                commits.forEach( commit => {
                    // console.log(commit);
                    var date = commit.commit.author.date.substring(0,10);

                    // init array if empty
                    if (output.commits[date] == null)
                        output.commits[date] = []

                    output.commits[date].push(commit.commit.message);
                })

                outputs.push(output);
            }
        })

        printOutput(outputs)

    })

})
.catch(function(err) {
    // Crawling failed...
    console.error("err: " + err);
    // callback(err, null);
});


function printOutput(out) {
    var final = "";
    out.forEach(project => {
        final += "Project: " + project.name + "\n\n";
        for(var date in project.commits) {
            if (project.commits.hasOwnProperty(date)) {
                final += '\n' + date + ':' + '\n';
                var dateCommits = project.commits[date];
                dateCommits.forEach(commit => {
                    final += '- ' + commit + '\n';
                })
            }
        }
        final += '-------------------------------' + '\n\n';
    })

    fs.writeFile("./output.txt", final, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    console.log(final);
}
