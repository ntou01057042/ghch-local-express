var express = require('express');
const { Octokit } = require("@octokit/rest");
var router = express.Router();

/* List pull requests */
// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
router.get('/list', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
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
        auth: req.query.token
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
        creator: response.data.user.login,  // Return the PR creator's username
    });
});

/* List issue comments */
// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#list-issue-comments
router.get('/comments', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
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

/* List PR reviewers */
router.get('/reviewers', async function (req, res, next) {
    const octokit = new Octokit({
        // auth: req.query.token
    });

    // Get requested reviewers
    const requestedReviewersResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
        owner: req.query.owner,
        repo: req.query.repo,
        pull_number: req.query.pull_number,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    });

    // Get submitted reviews
    const reviewsResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
        owner: req.query.owner,
        repo: req.query.repo,
        pull_number: req.query.pull_number,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    });

    // Process requested reviewers
    let reviewers = [];
    if (requestedReviewersResponse.data.users.length > 0) {
        requestedReviewersResponse.data.users.forEach(user => {
            reviewers.push({
                user: user.login,
                state: 'PENDING'  // For requested reviewers, status is 'PENDING'
            });
        });
    }

    // Process reviews (reviewers who have already reviewed)
    if (reviewsResponse.data.length > 0) {
        reviewsResponse.data.forEach(review => {
            reviewers.push({
                user: review.user.login,
                state: review.state  // The state can be APPROVED, CHANGES_REQUESTED, or COMMENTED
            });
        });
    }

    res.send(reviewers);
});

/* comment API */
router.post('/comment', async function (req, res, next) {
    const { owner, repo, pull_number, body } = req.body;
    const octokit = new Octokit({
        auth: req.query.token
    });

    try {
        // 提交評論到對應的 PR
        const response = await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner,
            repo,
            issue_number: pull_number, // PR number also serves as issue number for comments
            body, // Comment text
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        // 返回提交的評論資料
        res.json({
            id: response.data.id,
            user: response.data.user.login,
            created_at: response.data.created_at,
            body: response.data.body
        });
    } catch (error) {
        console.error("無法提交評論", error);
        res.status(500).send({ error: '無法提交評論' });
    }
});


/* 邀請 reviewer API */
router.post('/invite-reviewer', async function (req, res, next) {
    const { owner, repo, pull_number, reviewers } = req.body;
    const octokit = new Octokit({
        auth: req.query.token
    });

    try {
        const response = await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
            owner,
            repo,
            pull_number,
            reviewers,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        res.send({ message: 'Reviewers successfully invited', data: response.data });
    } catch (error) {
        console.error("無法邀請 reviewers", error);
        res.status(500).send({ error: '無法邀請 reviewers' });
    }
});

module.exports = router;
