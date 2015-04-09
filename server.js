// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var User = require('./models/user');
var Task = require('./models/task');

var bodyParser = require('body-parser');
var router = express.Router();

//replace this with your Mongolab URL
mongoose.connect('mongodb://wtian4:westwood1@ds045021.mongolab.com:45021/cs498');

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", 'GET, POST, OPTIONS, PUT, DELETE');
  next();
};

app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));

// All our routes will start with /api
app.use('/api', router);

//Default route here
router.use(function(err, req, res, next){
    if (err)
        res.status(500).json({"message": "Error: Could Not Contact Server", "data": "[]"});
    else
	   next();
});

var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
    res.status(200).json({ message: 'Winfield Tian CS498 MP3 API' });
});

//User route
var UserRoute = router.route('/users');

UserRoute.options(function(req, res){
      res.writeHead(200);
      res.end();
});

UserRoute.post(function(req, res){
    if (!req.body.name){
        res.status(400).json({"message": "A Name is Required", "data": "[]"});
    }
    else if (!req.body.email){
        res.status(400).json({"message": "An Email is Required", "data": "[]"}); 
    }

    else {
        var isvalid = /\S+@\S+\.\S+/;
        if (!isvalid.test(req.body.email))
            res.status(400).json({"message": "Please enter a valid email", "data": "[]"}); 
        else {
        var emailcheck = User.findOne().where({"email": req.body.email});
        emailcheck.exec(function (err, email_user) {
            if (err){
                res.status(500).json({"message": "Error Fetching List of Emails", "data": err});
            }
            else if (email_user){
                res.status(400).json({"message": "This Email is Already in Use", "data": email_user});
            }
            else {
                var user = new User();
                user.name = req.body.name;
                user.email = req.body.email;

                user.save(function(err){
                    if (err)
                      res.status(500).json({"message": "Error Saving New User Data", "data": err});
                    else
                      res.status(201).json({"message": "New User Added", "data": user});
                });
            } 
        });
    }
    }
});


UserRoute.get(function(req, res) {
        var query = User.find();

        if (req.query.where){
            var obj = JSON.parse(req.query.where);
            query = query.where(obj);
        }
        if (req.query.sort){
            var obj = JSON.parse(req.query.sort);
            query = query.sort(obj);
        }
        if (req.query.select){
            var obj = JSON.parse(req.query.select);
            query = query.select(obj);
        }
        if (req.query.skip){
            var obj = JSON.parse(req.query.skip);
            query = query.skip(obj);
        }
        if (req.query.limit){
            var obj = JSON.parse(req.query.limit);
            query = query.limit(obj);
        }
        if (req.query.count){
            var obj = JSON.parse(req.query.count);
            query = query.count(obj);
        }
        query.exec(function (err, users) {
            if (err)
                res.status(500).json({"message": "Get Request for Users Failed. Error Fetching List of Users.", "data": err});
            else
                res.status(200).json({"message": "Get Request for Users Successful", "data": users});
        });

});



var UserIDRoute = router.route('/users/:user_id');

UserIDRoute.get(function(req, res) {
    User.findById(req.params.user_id, function(err, user) {

            if (err) {
                res.status(500).json({"message": "Get Request for User Failed. Invalid ID Hash / User Doesn't Exist.", "data": err});
            }
            else if (!user){
                res.status(404).json({"message": "Get Requested for User Failed. User Doesn't Exist.", "data": "[]"});
            }
            else { 
            res.status(200).json({"message": "Get Request for User Successful", "data": user});
            }
	});
});


UserIDRoute.put(function(req, res){
    User.findById(req.params.user_id, function(err, user) {
        if (err){
    		res.status(500).json({"message": "Put Request for Updating User Failed. Invalid ID Hash / User Doesn't Exist.", "data": err});
        }
        else if (!user){
            res.status(404).json({"message": "Put Request for Updating User Failed. User Doesn't Exist.", "data": "[]"});
        }
        else {
            if (req.body.name)
                user.name = req.body.name;
            if (req.body.email)
                user.email = req.body.email;

            user.save(function(err){
            	if (err)
                    res.status(500).json({"message": "Put Request for Updating User Failed. Error Saving User.", "data": err});

                else
            	   res.status(200).json({"message": "Put Request for Updating User Successful", "data": user});
            });
        }
	});
});

UserIDRoute.delete(function(req, res) {
        var retdata;
        var query = Task.find().where({"assignedUser": req.params.user_id});
        query.exec(function(err, tasks) {
            var i;
            if (tasks){
                for (i = 0; i < tasks.length; i++){
                    tasks[i].assignedUser = "";
                    tasks[i].assignedUserName = "unassigned";
                    tasks[i].save();

                }
            }

        });
        User.remove({ _id: req.params.user_id}, function(err, user) {
            if (err){
               res.status(500).json({"message": "Remove Request for Deleting User Failed. Invalid ID Hash / User Doesn't Exist.", "data": err });
            }
            else if (!user){
                res.status(404).json({"message": "Remove Request for Deleting User Failed. User Doesn't Exist.", "data": "[]"});
            }
            else {
                res.status(200).json({"message": "Remove Request for Deleting User Successful", "data": retdata});
            }
        });
});



var TaskRoute = router.route('/tasks');

TaskRoute.options(function(req, res){
      res.writeHead(200);
      res.end();
});

TaskRoute.post(function(req, res){

    if (!req.body.name){
        res.status(400).json({"message": "A Name is Required.", "data": "[]"});
    }
    else if (!req.body.deadline){
        res.status(400).json({"message": "A Deadline is Required.", "data": "[]"}); 
    }

    else {
            var task = new Task();

            if (req.body.name)
               task.name = req.body.name;
            if (req.body.description)
               task.description = req.body.description;
            if (req.body.deadline)
               task.deadline = req.body.deadline;
            //DROPDOWN WILL PROVIDE RETURN ID
            if (req.body.assignedUser)
                task.assignedUser = req.body.assignedUser;

            
            var query = User.findOne().where({ "_id": task.assignedUser});
            query.exec(function(err, this_user){
                        if (this_user){
                            this_user.pendingTasks.push(task._id);
                            task.assignedUserName = this_user.name;
                    
                            this_user.save();

                        } 
                        task.save(function(err){
                           if (err)
                                res.status(500).json({"message": "Post Request for New Task Failed. Task Failed To Save.", "data": err}); 
                            else
                                res.status(201).json({"message": "Post Request for New Task Successful.", "data": task});
                        });                    
            }); 
            //console.log(this_user.name);
            //task.assignedUserName = "Nobody";

        }
});

TaskRoute.get(function(req, res) {
        var query = Task.find();

        if (req.query.where){
            var obj = JSON.parse(req.query.where);
            query = query.where(obj);
            //console.log(req.query.where);
        }
        if (req.query.sort){
            var obj = JSON.parse(req.query.sort);
            query = query.sort(obj);
        }
        if (req.query.select){
            var obj = JSON.parse(req.query.select);
            query = query.select(obj);
        }
        if (req.query.skip){
            var obj = JSON.parse(req.query.skip);
            query = query.skip(obj);
        }
        if (req.query.limit){
            var obj = JSON.parse(req.query.limit);
            query = query.limit(obj);
        }
        if (req.query.count){
            var obj = JSON.parse(req.query.count);
            query = query.count(obj);
        }
        query.exec(function (err, tasks) {
            if (err)
                res.status(500).json({"message": "Get Request for Tasks Failed. Error Fetching Tasks List", "data": tasks});
            else
                res.status(200).json({"message": "Get Request for Tasks Successful", "data": tasks});
        });

});



var TaskIDRoute = router.route('/tasks/:task_id');

TaskIDRoute.get(function(req, res) {
    Task.findById(req.params.task_id, function(err, task) {

            if (err)
               res.status(500).json({"message": "Get Request for Task Failed. Invalid ID Hash / Task Doesn't Exist", "data": task});
            if (!task)
               res.status(404).json({"message": "Get Request for Task Failed. Task Doesn't Exist", "data": task});
            else
               res.status(200).json({"message": "Get Request for Task Successful", "data": task}); 
	});
});


TaskIDRoute.put(function(req, res){
    Task.findById(req.params.task_id, function(err, task) {
        var userIDinput = true;
        if (err){
           res.status(500).json({"message": "Update Request for Updating Task Failed. Invalid ID Hash / Task Doesn't Exist", "data": task});
        }
        else if (!task){
           res.status(404).json({"message": "Update Request for Updating Task Failed. Task Doesn't Exist", "data": task});
        }
        else {

            if (req.body.name)
               task.name = req.body.name;
            if (req.body.description)
               task.description = req.body.description;
            if (req.body.deadline)
               task.deadline = req.body.deadline;
            if (req.body.assignedUser || req.body.completed){
                if (req.body.assignedUser){
                var oldquery = User.findOne().where({"pendingTasks":req.params.task_id});
                oldquery.exec(function(err, old_user){
                    if (old_user){
                        var taskId = req.params.task_id;
                        var array = old_user.pendingTasks;
                        var index = array.indexOf(String(taskId));
                        array.splice(index, 1);
                        old_user.pendingTasks = array;
                        old_user.save();
                    }
                }); 
                
                task.assignedUser = req.body.assignedUser;
                }
                var query = User.findOne().where({"_id": req.body.assignedUser });
                query.exec(function(err, name_user){
                        if (name_user){
                            task.assignedUserName = name_user.name;
                            
                        }




                        if (req.body.completed){
                            task.completed = req.body.completed;
                            if (task.completed == true){
                                var truequery = User.findOne().where({"pendingTasks":req.params.task_id});
                                truequery.exec(function(err, user){
                                    if (user){
                                        var taskId = req.params.task_id;
                                        var array = user.pendingTasks;
                                        var index = array.indexOf(String(taskId));
                                        array.splice(index, 1);
                                        user.pendingTasks = array;
                                        user.save();


                                    }
                                    

                                });
                            }
                            if (task.completed == false){
                                if (req.body.assignedUser){
                                var submitquery = User.findOne().where({"_id":req.body.assignedUser});
                                submitquery.exec(function(err, user){
                                    if (user){
                                        user.pendingTasks.push(req.params.task_id);
                                        user.save();
                                    }

                                });
                                }
                            }

                    }



                        task.save(function(err){
                            if (err)
                                res.status(500).json({"message": "Update Request for Updating Task Failed. Connected Severed", "data": task});
                            else
                                res.status(200).json({"message": "Task Succesfully Updated", "data": task});


                        });
                    });
            }
            /*
            if (req.body.completed){
                task.completed = req.body.completed;
                if (task.completed == true){
                    var query = User.findOne().where({"pendingTasks":req.params.task_id});
                    query.exec(function(err, user){
                        if (err)
                            res.status(500).json({"message": "Update Request for Updating Task Failed. Error Removing Old User Task", "data": task});
                        else if (user){
                            var taskId = req.params.task_id;
                            var array = user.pendingTasks;
                            var index = array.indexOf(String(taskId));
                            array.splice(index, 1);
                            user.pendingTasks = array;
                            user.save();

                        }
                        

                    });
                }//iff false, put back into pendingTasks
                if (task.completed == false){
                    if (req.body.assignedUser)
                    var query = User.findOne().where({"assignedUser":req.body.assignedUser});
                    query.exec(function(err, user){
                        if (user){
                            user.pendingTasks.push(req.params.task_id);
                        }
                    });

                }

            }
           
*/

        }
        

    });
});

            /*

            if (req.body.name)
               task.name = req.body.name;
            if (req.body.description)
               task.description = req.body.description;
            if (req.body.deadline)
               task.deadline = req.body.deadline;
            if (req.body.completed){
                task.completed = req.body.completed;
                if (task.completed == "true"){
                    var query = User.findOne().where({"pendingTasks":req.params.task_id});
                    query.exec(function(err, user){
                        if (err)
                            res.status(500).json({"message": "Update Request for Updating Task Failed. Error Removing Old User Task", "data": task});
                        else if (user){
                            var taskId = req.params.task_id;
                            var array = user.pendingTasks;
                            var index = array.indexOf(String(taskId));
                            array.splice(index, 1);
                            user.pendingTasks = array;
                            user.save(function(err){
                                if (err)
                                    res.status(500).json({"message": "Put Request for Updating Tasks Failed. Failure Saving Task.", "data": err}); 
                                else 
                                    res.status(200).json({"message": "Put Request for Updating Task Successful", "data": task});

                            });

                        }
                        else 
                            res.status(200).json({"message": "Put Request for Updating Task Successful", "data": err}); 

                    });
                }
           }

            if (req.body.assignedUser)
                task.assignedUser = req.assignedUser;


    
            if (req.body.assignedUserName){
               task.assignedUserName = req.body.assignedUserName;
                var query = User.findOne().where({"pendingTasks":req.params.task_id});
                query.exec(function(err, user){
                    if (err)
                        res.status(500).json({"message": "Update Request for Updating Task Failed. Error Removing Old User Task", "data": task});
                    else if (!user)
                        res.status(404).json({"message": "Update Request for Updating Task Failed. Updated Name doesn't exist", "data": user});

                    else {
                        var taskId = req.params.task_id;
                        var array = user.pendingTasks;
                        var index = array.indexOf(String(taskId));
                        array.splice(index, 1);
                        user.pendingTasks = array;
                        user.save(function(err){
                            if (err)
                                res.status(500).json({"message": "Update Request for Updating Task Failed. Error Removing Old User Task", "data": task});
                            else {
                                task.save(function(err){
                                    if (err)
                                        res.status(500).json({"message": "Put Request for Updating Tasks Failed. Error Saving New Task", "data": err});
                                    else {
                                        var query_new = User.findOne().where({ "_id": task.assignedUser});
                                        query_new.exec(function(err, new_user){
                                            if (err){
                                                res.status(500).json({"message": "Put Request for Updating Tasks Failed. Finding Assigned User Failed.", "data": err}); 
                                            }
                                            else if (!new_user){
                                                res.status(404).json({"message": "Put Request for Updating Tasks Failed. User Doesn't Exist.", "data": "[]"});
                                            }
                                            else {
                                                new_user.pendingTasks.push(task._id);
                                               // console.log(this_user.pendingTasks[0]);
                                                new_user.save(function(err){
                                                    if (err)
                                                        res.status(500).json({"message": "Put Request for Updating Tasks Failed. Failure Saving Task.", "data": err}); 
                                                    else if (!userIDinput)
                                                        res.status(200).json({"message": "Put Request for Updating Task Successful. Your ID provided did not match your name, but the correct ID has been assigned.", "data": task});                                                        
                                                    else 
                                                        res.status(200).json({"message": "Put Request for Updating Task Successful", "data": task});
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
           }
           */

TaskIDRoute.delete(function(req, res) {
        var rettask;
        var partialfail = false;
        var taskId = req.params.task_id;
        var query = User.findOne().where({"pendingTasks": taskId});
        query.exec(function (err, user) {
            if (err)
                res.status(500).json({"message": "Remove Request for Deleting Task Failed. Could Not Search for Tasks In Use", "data": err});
            else {
                if (user){
                    var array = user.pendingTasks;
                    var index = array.indexOf(String(taskId));
                    array.splice(index, 1);
                    user.pendingTasks = array;
                    user.save(function(err){
                        if (err)
                            partialfail = true;
                    });
                }
         
                if (partialfail){
                    res.status(500).json({"message": "Remove Request for Deleting Task Failed. Could Not Delete Task in User's Pending Task", "data": "[]"});
                }
                else {
                    Task.findById(req.params.task_id, function(err, task) {
                        if (err)
                            res.status(500).json({"message": "Remove Request for Deleting Task Failed. Could Not Search for Tasks In Use", "data": err});
                        else if (!task)
                            res.status(500).json({"message": "Remove Request for Deleting Task Failed. Task Doesn't Exist", "data": "[]"});
                        else {
                            rettask = task;
                            Task.remove({_id: req.params.task_id}, function(err, task) {
                            if (err)
                                res.status(500).json({"message": "Remove Request for Deleting Task Failed. Could Not Remove Task", "data": err});
                            else
                                res.status(200).json({"message": "Remove Request for Deleting Task Successful", "data": rettask});
                            });
                        }
                    });
                    
                }
                
            }
        });



      
});
//Add more routes here

// Start the server
app.listen(port);
console.log('Server running on port ' + port); 