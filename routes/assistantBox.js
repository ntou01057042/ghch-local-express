var express = require('express');
var router = express.Router();
const axios = require('axios');
const { openAiApiKey } = require('../config'); // 調整路徑以符合你的檔案結構

// 問答功能路由
router.post('/ask', async function (req, res) {
    try {
        // 檢查請求體是否包含 prompt
        if (!req.body || !req.body.prompt) {
            return res.status(400).send({ message: 'Prompt is required' });
        }

        console.log('Prompt:', req.body.prompt);

        // 使用者的問題
        const userInput = req.body.prompt;

        // 發送 API 請求到 OpenAI，並指定 AI 的角色是版本控制系統的小幫手
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '你是一個專業的版本控制系統問答小幫手，請你回答符合 GitHub Flow 的建議。'
                },
                {
                    role: 'user',
                    content: userInput
                }
            ],
            max_tokens: 500 // 可以根據需求調整
        }, {
            headers: {
                'Authorization': `Bearer ${openAiApiKey}`, // 使用導入的 API 密鑰
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
        res.status(500).send({ message: 'Error generating answer', error: error.message });
    }
});

module.exports = router;
