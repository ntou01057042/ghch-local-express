var express = require('express');
const { Octokit } = require("@octokit/rest");
var router = express.Router();

/* Create a repository for the authenticated user. */
// https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user
// OAuth app tokens need the public_repo or repo scope to create a public repository, and repo scope to create a private repository.
// todo: name already exists on this account
router.post('/create', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('POST /user/repos', {
        name: req.body.name,   // The name of the repository.
        description: req.body.description,   // A short description of the repository.
        homepage: req.body.homepage,   // A URL with more information about the repository.
        auto_init: req.body.auto_init,   // Whether the repository is initialized with a minimal README.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    res.send(response)
    // res.send(req.body)
});

/* Delete a repository. */
// https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#delete-a-repository
// OAuth app tokens need the delete_repo scope to use this endpoint.
router.post('/delete', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('DELETE /repos/{owner}/{repo}', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    res.send(response)
});

module.exports = router;
