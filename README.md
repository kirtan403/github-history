# Installation

Clone/download the repo.

Open `index.js` and edit these 3 variables:
* `githubUser` : Your github username
* `password` : Your personal access token with repos permission. Can be generated from github settings
* `fromDate` : Date from which you want to fetch commit history

Save and close.

From the terminal, run:

    npm Install

Now your setup is done.

Run below command everytime you want the history. Edit the date in index.js and run.

    node index.js

Output will be saved in `output.txt` file.
