"use strict";

const rp = require('request-promise');
var fs = require('fs');


var githubUser = "<<GITHUB_USERNAME>>"  // github user name
var password = "<<PERSONAL_ACCESS_TOKEN>>"  // personal access token with repos permission
var fromDate = '2017-08-06'  //yyyy-mm-dd
const auth = 'Basic ' + new Buffer(githubUser + ':' + password).toString('base64');

rp({
    uri: 'https://api.github.com/user/repos',
    headers: {
        'User-Agent': 'Request-Promise',
        'Authorization': auth
    },
    resolveWithFullResponse: true
})
.then(function(response) {

    let repos = JSON.parse(response.body);
    console.log(repos.length + " repos found");

    // loop through json to get the commits url
    let allCommitsRequests = [];
	let allBranshesRequests = [];

	// get all branches list
	repos.forEach(function(repo) {
		let branches_url = repo.branches_url.replace(/{\/branch}/,"");
		let req = rp({
          uri : branches_url,
          headers: {
              'User-Agent': 'Request-Promise',
              'Authorization': auth
          },
          resolveWithFullResponse: true
        });
		
		allBranshesRequests.push(req);
	});
	
	// loop through branch results to create commit requests
	Promise.all(allBranshesRequests).then(function(results) {
		
		// loop repos and generate urls for all branches
		repos.forEach(function(repo,index) {
			
			let result = JSON.parse(results[index].body);
			result.forEach(function(branch) {
				let commits_url = repo.commits_url.replace(/{\/sha}/,"");
				commits_url += '?sha=' + branch.name; // https://stackoverflow.com/a/16782303
				let req = rp({
				  uri : commits_url + '&?author=' + githubUser + '&since=' + fromDate,
				  headers: {
					  'User-Agent': 'Request-Promise',
					  'Authorization': auth
				  },
				  resolveWithFullResponse: true
				});

				allCommitsRequests.push(req);
			});
		});

		// we have the results
		Promise.all(allCommitsRequests).then(function(results) {

			let outputs = [];
			results.forEach(function(result,index) {
				// console.log(result.body);

				var commits = JSON.parse(result.body);
				console.log(commits.length + " commits");
				
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

		});
	
	});    

})
.catch(function(err) {
    // Oops...
    console.error("err: " + err);
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
