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
        state: 'all',   // Either open, closed, or all to filter by state.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    console.log(response);
    let prs = [];
    for (const i in response.data) {
        console.log(response.data[i]);
        prs.push({
            id: response.data[i].id,
            number: response.data[i].number,
            state: response.data[i].state,
            title: response.data[i].title,
        });
    }
    res.send(prs)
});

/* Get a pull request */
// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
router.get('/get', async function (req, res, next) {
    const octokit = new Octokit({
        // auth: req.query.token
    })
    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        pull_number: req.query.pull_number,   // The number that identifies the pull request.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    res.send({
        number: response.data.number,
        state: response.data.state,
        description: response.data.body,
        head: response.data.head.ref,
        base: response.data.base.ref,
    });
});

/* List issue comments */
// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#list-issue-comments
router.get('/comments', async function (req, res, next) {
    const octokit = new Octokit({
        // auth: req.query.token
    })
    const response = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        issue_number: req.query.pull_number,   // The number that identifies the pull request.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    let comments = [];
    for (const i in response.data) {
        console.log(response.data[i]);
        comments.push({
            id: response.data[i].id,
            user: response.data[i].user.login,
            created_at: response.data[i].created_at,
            body: response.data[i].body,
        });
    }
    res.send(comments);
});

module.exports = router;
