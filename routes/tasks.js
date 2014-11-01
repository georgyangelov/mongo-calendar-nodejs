var express = require('express'),
    moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router();

function from_database(task) {
    task.id = task._id;
    delete task._id;

    return task;
}

function to_database(task) {
    task._id  = new ObjectID(task.id);
    task.date = moment(task.date).toDate();

    delete task.id;

    return task;
}

module.exports = function(database) {

    var tasks = database.collection('tasks');

    router.get('/', function(req, res) {
        tasks.find({}).toArray(function(err, tasks) {
            if (err) {
                console.error('Cannot get tasks', err);
                return res.status(500).send();
            }

            res.json(tasks.map(from_database));
        });
    });

    router.get('/:id', function(req, res) {
        var id = new ObjectID(req.param('id'));

        tasks.findOne({_id: id}, function(err, task) {
            if (err) {
                console.error('Cannot get task', err);
                return res.status(500).send();
            }

            res.json(from_database(task));
        });
    });

    router.get('/for_date/:date', function(req, res) {
        var start_date = moment(req.param('date')),
            end_date = start_date.clone().add(1, 'days');

        tasks.find({
            date: {
                $gte: start_date.toDate(),
                $lt: end_date.toDate()
            }
        }).sort({
            completed: 1,
            priority: -1
        }).toArray(function(err, tasks) {
            if (err) {
                console.error('Cannot get tasks', err);
                return res.status(500).send();
            }

            res.json(tasks.map(from_database));
        });
    });

    router.post('/', function(req, res) {
        var task = to_database(req.body);

        tasks.insert(task, function(err) {
            if (err) {
                console.error('Cannot insert task', err);
                return res.status(500).send();
            }

            res.status(200).send();
        });
    });

    router.put('/', function(req, res) {
        var task = to_database(req.body);

        tasks.update({_id: task._id}, task, function(err) {
            if (err) {
                console.error('Cannot update task', err);
                return res.status(500).send();
            }

            res.status(200).send();
        });
    });

    router.delete('/:id', function(req, res) {
        var id = new ObjectID(req.param('id'));

        tasks.remove({_id: id}, function(err, task) {
            if (err) {
                console.error('Cannot remove task', err);
                return res.status(500).send();
            }

            res.status(200).send();
        });
    });

    return router;
};
