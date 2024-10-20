var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var indexRouter = require('./routes/index');
var repoRouter = require('./routes/repo');
var collaboratorRouter = require('./routes/collab');
var prRouter = require('./routes/pr');
var branchRouter = require('./routes/branch');
var assistantBoxRouter = require('./routes/assistantBox');

var app = express();

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/repo', repoRouter);
app.use('/collab', collaboratorRouter);
app.use('/pr', prRouter);
app.use('/branch', branchRouter);
app.use('/assistantBox', assistantBoxRouter);

module.exports = app;
