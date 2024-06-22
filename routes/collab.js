var express = require('express');
const { Octokit } = require("@octokit/rest");
var router = express.Router();

/* List repository collaborators. */
// https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#list-repository-collaborators
router.get('/list', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('GET /repos/{owner}/{repo}/collaborators', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    let collaborators = [];
    for (const i in response.data) {
        collaborators.push(response.data[i].login);
    }
    res.send(collaborators)
});

/* List repository invitations. */
// https://docs.github.com/en/rest/collaborators/invitations?apiVersion=2022-11-28#list-repository-invitations
router.get('/repo-invitations', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('GET /repos/{owner}/{repo}/invitations', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    const invitations = [];
    for (const i in response.data) {
        invitations.push({
            "invitation_id": response.data[i].id,
            "invitee": response.data[i].invitee.login
        });
    }
    res.send(invitations)
});

/* Add a repository collaborator. */
// https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#add-a-repository-collaborator
router.put('/add', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('PUT /repos/{owner}/{repo}/collaborators/{username}', {
        owner: req.query.owner,   // The account owner of the repository.
        repo: req.query.repo,   // The name of the repository without the .git extension.
        username: req.query.username,   // The handle for the GitHub user account.
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    res.send(response)
});

/* List repository invitations for the authenticated user. */
// https://docs.github.com/en/rest/collaborators/invitations?apiVersion=2022-11-28#list-repository-invitations-for-the-authenticated-user
router.get('/user-invitations', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('GET /user/repository_invitations', {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    const invitations = [];
    for (const i in response.data) {
        invitations.push({
            "invitation_id": response.data[i].id,
            "repo_name": response.data[i].repository.name,
            "repo_owner": response.data[i].repository.owner.login
        });
    }
    res.send(invitations)
});

/* Accept a repository invitation. */
// https://docs.github.com/en/rest/collaborators/invitations?apiVersion=2022-11-28#accept-a-repository-invitation
router.patch('/accept', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('PATCH /user/repository_invitations/{invitation_id}', {
        invitation_id: req.query.invitation_id,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    res.send(response)
});

/* Decline a repository invitation. */
// https://docs.github.com/en/rest/collaborators/invitations?apiVersion=2022-11-28#decline-a-repository-invitation
router.delete('/decline', async function (req, res, next) {
    const octokit = new Octokit({
        auth: req.query.token
    })
    const response = await octokit.request('DELETE /user/repository_invitations/{invitation_id}', {
        invitation_id: req.query.invitation_id,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'accept': 'application/vnd.github+json'
        }
    })
    res.send(response)
});

module.exports = router;
