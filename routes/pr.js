var express = require('express');
const { Octokit } = require("@octokit/rest");
var router = express.Router();
const axios = require('axios');

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
    });

    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
            owner: req.query.owner,   // The account owner of the repository.
            repo: req.query.repo,     // The name of the repository without the .git extension.
            pull_number: req.query.pull_number,   // The number that identifies the pull request.
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        res.send({
            number: response.data.number,
            state: response.data.state,
            description: response.data.body,
            head: response.data.head.ref,
            base: response.data.base.ref,
            creator: response.data.user.login,  // Return the PR creator's username
            created_at: response.data.created_at  // Add PR creation time
        });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).send({ message: error.message });
    }
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
        auth: req.query.token
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

/* 創建審查 API */
router.post('/create-review', async function (req, res, next) {
    const { owner, repo, pull_number, body, event } = req.body;
    const octokit = new Octokit({
        auth: req.query.token
    });

    try {
        const response = await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
            owner,
            repo,
            pull_number,
            body,
            event, // 'APPROVE', 'REQUEST_CHANGES', or 'COMMENT'
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        res.json({
            id: response.data.id,
            user: response.data.user.login,
            body: response.data.body,
            state: response.data.state,
            html_url: response.data.html_url
        });
    } catch (error) {
        console.error("無法創建審查", error);
        res.status(500).send({ error: '無法創建審查' });
    }
});


/* Create a pull request */
// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#create-a-pull-request
router.post('/', async function (req, res, next) {
    try {
        const { owner, repo, title, body, head, token } = req.body;
        if (!owner || !repo || !title || !head || !token) {
            return res.status(400).send({ message: 'Missing required parameters' });
        }
        const octokit = new Octokit({
            auth: token
        });

        const response = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
            owner: owner, // The account owner of the repository.
            repo: repo, // The name of the repository without the .git extension.
            title: title, // The title of the new pull request. Required unless issue is specified.
            body: body, // The contents of the pull request.
            head: head, // The name of the branch where your changes are implemented.
            base: 'main', // The name of the branch you want the changes pulled into.
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).send({ message: error.message });
    }
});

module.exports = router;


/* Check if a pull request has been merged */
// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#check-if-a-pull-request-has-been-merged
router.get('/merged-or-not', async function (req, res, next) {
    const octokit = new Octokit({
        // auth: req.query.token
    });
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
            owner: req.query.owner,
            repo: req.query.repo,
            pull_number: req.query.pull_number,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });
        res.send(true);
    } catch (error) {
        res.send(false);
    }
});

/* Merge a pull request */
// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#merge-a-pull-request
router.post('/merge', async function (req, res, next) {
    try {
        const { owner, repo, pull_number, commit_title, commit_message, token } = req.body;

        if (!owner || !repo || !pull_number || !token) {
            return res.status(400).send({ message: 'Missing required parameters' });
        }

        const octokit = new Octokit({
            auth: token
        });

        const response = await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
            owner: owner,
            repo: repo,
            pull_number: pull_number,
            commit_title: commit_title || `Merged PR #${pull_number}`,  // 默認 commit 標題
            commit_message: commit_message || '',  // 默認 commit 訊息
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).send({ message: error.message });
    }
});

// Check for updated_at timestamp of a pull request
router.get('/check-updated-at', async function (req, res, next) {
    try {
        const { owner, repo, pull_number, token } = req.query;

        if (!owner || !repo || !pull_number || !token) {
            return res.status(400).send({ message: 'Missing required parameters' });
        }

        const octokit = new Octokit({
            auth: token
        });

        const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
            owner: owner,
            repo: repo,
            pull_number: pull_number,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                'accept': 'application/vnd.github+json'
            }
        });

        const pullRequest = response.data;
        const updatedAt = pullRequest.updated_at;

        res.send({
            message: 'Successfully retrieved PR updated_at timestamp',
            updated_at: updatedAt
        });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).send({ message: error.message });
    }
});
router.get('/pr-diff', async function (req, res) {

    const { owner, repo, base, head ,token} = req.query;

    if (!owner || !repo || !base || !head|| !token) {
        return res.status(400).json({ error: 'Missing required parameters: owner, repo, base, head' });
    }
    const octokit = new Octokit({
        auth: token
    });

    try {

        const response = await octokit.repos.compareCommits({
            owner: owner,
            repo: repo,
            base: base,
            head: head
        });


        const filesChanged = response.data.files.map(file => ({
            filename: file.filename,
            changes: file.changes,
            patch: file.patch
        }));


        res.status(200).json({
            status: response.data.status,
            total_commits: response.data.total_commits,
            files_changed: filesChanged
        });
    } catch (error) {
        console.error("Error fetching comparison:", error);
        res.status(500).json({ error: 'An error occurred while fetching the comparison.' });
    }
});
router.post('/generate-pr', async function (req, res) {
    try {

        // 檢查請求體是否包含 prompt 和 diffMessage
        if (!req.body || !req.body.prompt || !req.body.diffMessage) {
            return res.status(400).send({ message: 'Prompt and diffMessage are required' });
        }

        console.log('Prompt:', req.body.prompt);
        console.log('Diff Message:', req.body.diffMessage + "結束");

        // OpenAI API 密鑰
        const apiKey = '';

        // 將 diffMessage 包含到 prompt 中
        const userInput = `
        請根據下列 diff 描述生成 pull request 的標題和描述，並以 JSON 格式回傳結果，包含以下欄位：
        {
          "title": "這是pull request的標題",
          "summary": "這是pull request的摘要",
          "fileChanges": [
            {
              "fileName": "變更檔案的名稱",
              "changes": "這是針對該檔案的變更描述"
            }
          ],
          "improvements": [
            {
              "feature": "功能名稱",
              "description": "功能改進的描述"
            }
          ]
        }
        請根據下列diff內容撰寫：
        \n\n${req.body.diffMessage}
        `;

        // 發送 API 請求到 OpenAI
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userInput }],
            max_tokens: 500 // 可以根據需求調整
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // 獲取生成的回答
        const generatedAnswer = response.data.choices[0].message.content.trim();

        // 回傳結果
        res.send({
            message: 'Successfully generated answer',
            answer: generatedAnswer
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ message: 'Error generating PR description', error: error.message });
    }
});


module.exports = router;