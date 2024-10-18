var express = require('express');
const { Octokit } = require("@octokit/rest");
var router = express.Router();

/* Delete a reference */
// https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#delete-a-reference
router.post('/delete', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', {
        owner: req.query.owner,
        repo: req.query.repo,
        ref: 'heads/' + req.query.ref,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
    console.log(response);
    res.send(response)
});

router.post('/create', async function (req, res, next) {
    // Octokit.js
    const octokit = new Octokit({
        auth: req.query.token
    })

    const response = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner: req.query.owner,
        repo: req.query.repo,
        ref: 'refs/heads/' + req.query.ref,
        sha: req.query.sha,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
    console.log(response);
    res.send(response);
});

module.exports = router;