var express = require('express');
var router = express.Router();

var db = require('../models');
const Operator = require('sequelize').Op;

router.get('/', (req, res) => {
    res.send('Olá mundo');
});

// get unique question and answers question
router.get('/unique/:question_id', async (req, res) => {

    const {
        question_id
    } = req.params;
    try {
        var questions = await db.Question.findAll({
            include: [{
                model: db.Answer,
                include: [{
                    model: db.Profile,
                    attributes: ['id', 'name', 'birthday', 'status', 'user_id']
                }]
            }, {
                model: db.SkillQuestion,
                include: [{
                    model: db.Skill
                }]
            }, {
                model: db.Profile,
                attributes: ['id', 'name', 'birthday', 'status', 'user_id']
            }],
            where: {
                id: question_id
            }
        });
    } catch (err) {
        return res.status(400).send({
            error: err,
            status: false
        });
    }

    res.send({
        questions: questions,
        status: true
    });
});

// get feed no params
router.get('/feed', async (req, res) => {
    try {
        var question = await fillfeed(); // only 75 questions randomize
    } catch (err) {
        return res.status(400).send({
            error: err,
            status: false
        });
    }
    res.send({
        questions: question,
        status: true
    });
});

// feed
router.get('/feed/:profile_id', async (req, res) => {
    const {
        profile_id
    } = req.params;

    const skillprofile = await db.SkillProfile.findAll({
        where: {
            profile_id: profile_id
        }
    });

    var questions_id = [];
    var questions = [];
    var skills_id = [];

    try {

        if (skillprofile == 0)
            return res.send({
                questions: await fillfeed(),
                status: true
            });
        else
            skillprofile.forEach(element => skills_id.push(element.skill_id));


        var skillquestion = await db.SkillQuestion.findAll({
            where: {
                skill_id: {
                    [Operator.in]: skills_id
                }
            }
        });

        skillquestion.forEach(element => questions_id.push(element.question_id));

        questions = await db.Question.findAll({
            include: [{
                model: db.SkillQuestion,
                attributes: ['id', 'skill_id', 'question_id'],
                include: [{
                    model: db.Skill,
                    attributes: ['id', 'name', 'area_id']
                }],
                where: {
                    question_id: {
                        [Operator.in]: questions_id
                    }
                }
            }, {
                model: db.Answer,
                attributes: ['id', 'description']
            }, {
                model: db.Profile,
                attributes: ['id', 'name', 'birthday', 'user_id', 'status']
            }],
            limit: 75,
            order: [
                ['created_at', 'DESC']
            ]
        });

        if (questions == 0)
            return res.send({
                questions: await fillfeed(),
                status: true
            });

    } catch (err) {
        return res.status(400).send({
            error: err,
            status: false
        });
    }

    res.send({
        questions: questions,
        status: true
    });
});

// search question
router.get('/search/:phrase', async (req, res) => {
    const {
        phrase
    } = req.params;

    try {
        var questions = await db.Question.findAll({
            include: [{
                model: db.SkillQuestion,
                attributes: ['id', 'skill_id'],
                include: [{
                    model: db.Skill,
                    attributes: ['id', 'name', 'area_id']
                }]
            }, {
                model: db.Answer,
                attributes: ['id', 'description']
            }, {
                model: db.Profile,
                attributes: ['id', 'name', 'birthday', 'user_id', 'status']
            }],
            where: {
                [Operator.or]: [{
                        title: {
                            [Operator.like]: `${phrase}%`
                        }
                    },
                    {
                        description: {
                            [Operator.like]: `%${phrase}%`
                        }
                    }
                ]
            },
            limit: 75,
            order: [
                ['created_at', 'DESC']
            ]
        });
    } catch (err) {
        return res.status(400).send({
            error: err,
            status: false
        });
    }


    res.send({
        questions: questions,
        status: true
    });
});

router.post('/', async (req, res) => {
    const {
        title,
        profile_id,
        description
    } = req.body;

    try {

        if (!title)
            return res.status(400).send({
                error: 'Title is required',
                status: false
            });

        if (!description)
            return res.status(400).send({
                error: 'Description is required',
                status: false
            });

        if (!profile_id)
            return res.status(400).send({
                error: 'Profile id is required',
                status: false
            });


        var question = await db.Question.create({
            title: title,
            description: description,
            profile_id: profile_id
        });

    } catch (err) {
        res.status(400).send({
            error: err,
            status: false
        });
    }

    res.send({
        question: question,
        status: true
    });
});

router.post('/skillquestion', async (req, res) => {

    const {
        question_id,
        skill_id
    } = req.body;

    try {

        if (!question_id)
            return res.status(400).send({
                error: 'Question id is required',
                status: false
            });

        if (!skill_id)
            return res.status(400).send({
                error: 'Skill id is required',
                status: false
            });

        var skillquestion = await db.SkillQuestion.create({
            skill_id: skill_id,
            question_id: question_id
        });

    } catch (err) {
        res.status(400).send({
            error: err,
            status: false
        });
    }

    res.send({
        skillquestion: skillquestion,
        status: true
    })

});

router.post('/reactionquestion', async (req, res) => {

    const {
        question_id,
        reaction_id
    } = req.body;

    try {

        if (!reaction_id)
            return res.status(400).send({
                error: 'Reaction id is required',
                status: false
            });

        if (!question_id)
            return res.status(400).send({
                error: 'Question id is required',
                status: false
            });

        var reactionquestion = await db.ReactionQuestion.create({
            reaction_id: reaction_id,
            question_id: question_id
        });

    } catch (err) {
        res.status(400).send({
            error: err,
            status: false
        });
    }

    res.send({
        reactionquestion: reactionquestion,
        status: true
    })

});

router.delete('/:question_id', async (req, res) => {
    const {
        question_id
    } = req.params;

    try {
        const Question = await db.Question.findOne({
            where: {
                id: question_id
            }
        });

        if (!Question)
            return res.status(400).send({
                error: 'Answer not found',
                status: false
            });

        db.SkillQuestion.destroy({
            where: {
                question_id: question_id
            }
        });
        Question.destroy();

    } catch (err) {
        return res.status(400).send({
            error: err,
            status: false
        });
    }

    res.send({
        response: 'Question deleted',
        status: true
    });
});

/*
router.delete('/deleteall', async (req, res) => {
    db.Answer.destroy();
    db.SkillQuestion.destroy();
    db.Question.destroy();
});*/

async function fillfeed() {
    var q = await db.Question.findAll({
        include: [{
            model: db.SkillQuestion,
            attributes: ['id', 'skill_id', 'question_id'],
            include: [{
                model: db.Skill,
                attributes: ['id', 'name', 'area_id']
            }]
        }, {
            model: db.Answer,
            attributes: ['id', 'description']
        }, {
            model: db.Profile,
            attributes: ['id', 'name', 'birthday', 'user_id', 'status']
        }],
        limit: 75,
        order: [
            ['created_at', 'DESC']
        ]
    });

    if (!q)
        return 'No results';

    return q;
}

async function allquestions() {
    return await db.Question.findAll({
        include: {
            model: db.Profile
        },
        order: db.sequelize.random()
    });
}

module.exports = app => app.use('/question', router);