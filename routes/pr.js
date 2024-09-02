var express = require('express');
const { Octokit } = require("@octokit/rest");
var router = express.Router();

/* List pull requests */
// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
router.get('/list', async function (req, res, next) {
    const octokit = new Octokit({
        // auth: req.query.token
    })
    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        state: req.query.state,   // Either open, closed, or all to filter by state.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    console.log(response);
    let prs = [];
    for (const i in response.data) {
        console.log(response.data[i]);
        prs.push({ id: response.data[i].id, title: response.data[i].title });
    }
    res.send(prs)
});

module.exports = router;
