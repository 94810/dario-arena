// IT'S ME,DARIO!
var http = require('http');
var express = require('express');
var bodyP = require('body-parser');
var cookieP = require('cookie-parser');
var twig = require('twig');
var crypto = require('crypto');
var MongoClient = require ('mongodb').MongoClient
,   f=require ('util').format
,   assert =require ('assert');
var session= require ('express-session');

var ws = require('ws');

var db;
var dblogin=encodeURIComponent('RW');
var dbpassword= encodeURIComponent('gargamel');

var dburl=f('mongodb://%s:%s@ds129720.mlab.com:29720/dario-arena?authMechanism=DEFAULT',dblogin,dbpassword);

var app = express();
app
    .use(bodyP.urlencoded({ extended: false }))
    .use(cookieP())
    .use(express.static('./static'));

app.use('/s', express.static('static'));

app.set('views', 'templates');

app.set("twig options", { autoescape: true });
app.set("port", process.env.PORT || 8080);


var sesP = session({
    secret :crypto.randomBytes(10).toString('base64'),
    resave :false,
    saveUninitialized:false,
});

app.use(sesP);

var server = http.createServer(app);

var wsS = new ws.Server({
	server : server,

	verifyClient: function(info, cb){
		sesP(info.req, {}, ()=>{	
			cb(info.req.session.user);
		});
	}
});


wsS.room = {}
wsS.roomC = {}

// ###### WebSocket Logic ########

wsS.on('connection', function(wsC){

	wsC.user = wsC.upgradeReq.session.user ;

	for( i in wsS.room) wsC.send(JSON.stringify({"newp" : i, "pos" : wsS.room[i].pos, "ctrl" : wsS.room[i].ctrl }));

	wsS.room[wsC.user] = { "pos" : { 'x' : 0, 'y' : 0}, "wsC" : wsC};

	wsC.send(JSON.stringify({"name" : wsC.user}));
	
	for( i in wsS.roomC ) if(i != wsC.user) wsS.room[i].wsC.send(JSON.stringify({ "newp" : wsC.user,'pos' : { 'x' : 0, 'y' : 0}}));

	wsC.on('message', function(data){
		var cltD = JSON.parse(data);

		wsS.room[wsC.user].pos = cltD.pos;

		for( i in wsS.roomC ) if(i != wsC.user) wsS.roomC[i].wsC.send(JSON.stringify(wsS.room));
	});
});
// ###### End #########

app.get('/signup',function(req,res){
 /*   if (req.query[0]==null)
    {
        res.render('login.twig',{ "e":0})
    }
    else*/
    res.render('signup.twig',{ "e":req.query["e"]})
});

app.post('/up',function(req,res)
    {
    MongoClient.connect(dburl,function(err,db)
        {
        var lel=db.collection("users")
        lel.find({_id:req.body["login"]},{_id:1}).toArray(function(err,docs)
            {
                if (!err)
                {
                    if (docs[0]==null)
                        {
                        var salt=crypto.randomBytes(64).toString('hex');
                        var iterations=1000;
                        crypto.pbkdf2(req.body["pass"],salt,iterations,128,'sha512',function(err,hash)
                            {
                        lel.insert([ { "_id": req.body["login"],"Password": hash.toString('hex'),"Kills": 0,"Deaths":0,"Salt":salt,"Played":0,"Won":0,"admin":0}],function(err,result)
                                {
                                });
                            });
                        req.session.user = req.body["login"];
                        res.redirect('/account');
                        }
                    else
                        {
                        res.redirect('/signup?e=1');
                        }
                }
            })
        })
    });

app.all('/account',function(req,res)
    {
        if(req.session.user)
        {
            MongoClient.connect(dburl,function(err,db)
            {
            var lel=db.collection("users")
            lel.find({_id:req.session.user},{"Password":0,"Salt":0}).toArray(function(err,docs)
                {
                console.log(docs[0])
                res.render('account.twig',{"login":req.session.user,
                                           "Won":docs[0]["Won"],
                                           "Killed":docs[0]["Kills"],
                                           "Played":docs[0]["Played"],
                                           "Deaths":docs[0]["Deaths"]
                                           });
                });
            });
        }
        else
        {
            res.redirect('/login');
        }
    });

app.get('/login',function(req,res)
    {
        if(req.session.user)
        {
            res.redirect('/account');
        }
        else
        {
            res.render('login.twig',{"failed":req.query["failed"]});
        }
    });

app.post('/login',function(req,res)
    {
        MongoClient.connect(dburl,function(err,db)
            {
            var lel=db.collection("users")
            lel.find({_id:req.body["login"]},{_id:1,"Password":1,"Salt":1}).toArray(function(err,docs)
            {
                if (docs[0]==null)
                {
                    res.render('login.twig',{"failed":1});
                }
                else
                {
                    crypto.pbkdf2(req.body["pass"],docs[0]["Salt"],1000,128,'sha512',function(err,hash)
                    {
                        if (docs[0]["Password"]!=hash.toString('hex'))
                        {
                            res.render('login.twig',{"failed":2});
                        }
                        else
                        {
                            req.session.user=docs[0]["_id"];
                            res.redirect("/account");
                        }
                    });
                }
            });
        });
    });

app.all('/logout',function(req,res)
    {
        req.session.user=null;
        res.redirect("/login");
    });

app.get('/delete',function(req,res)
    {
        if(req.session.user)
        {
            res.render('dlt_confirm.twig',{"login":req.session.user});
        }
        else
        {
            res.redirect("/login");
        }
    });

app.post('/delete',function(req,res)
    {
        MongoClient.connect(dburl,function(err,db)
        {
            var lel=db.collection("users");
            lel.find({_id:req.session.user},{_id:1,"Password":1,"Salt":1}).toArray(function(err,docs)
            {
                if (docs[0]==null)
                {
                    res.render('dlt_confirm.twig',{"failed":1});
                    //cannot happen in normal state
                }
                else
                {
                    crypto.pbkdf2(req.body["pass"],docs[0]["Salt"],1000,128,'sha512',function(err,hash)
                    {
                        if (docs[0]["Password"]!=hash.toString('hex'))
                        {
                            res.render('dlt_confirm.twig',{"failed":1,
                                                           "login":req.session.user});
                        }
                        else
                        {

                            lel.remove({_id:req.session.user},function(err,result)
                                {
                                    req.session.user=null;
                                    res.redirect("/signup");
                                });
                        }
                    });
                }
        });
    });
});

app.get('/home',function(req,res)
    {
        res.render('home.twig',{"login":req.session.user});
    });

app.get('/userlist',function(req,res)
    {
            MongoClient.connect(dburl,function(err,db)
            {
                var lel=db.collection("users");
                lel.find({},{Password:0,Salt:0,admin:0,lastModified:0}).sort({Won:-1,Kills:-1}).toArray(function(err,docs)
                    {
                        res.render('userlist.twig',{"docs":docs,
                                                    "login":req.session.user
                                                    });
                    });
            });

    });

app.get ('/admin',function(req,res)
    {
    if (req.session.user)
        {
        MongoClient.connect(dburl,function(err,db)
            {
                var lel=db.collection("users");
                    lel.find({_id:req.session.user},{"admin":1}).toArray(function(err,docs)
                    {
                        if (docs[0]["admin"]==0)
                            {
                                res.redirect('/error'); 
                            }
                        else
                            {
                                lel.find({},{_id:1}).toArray(function(err,docs)
                                    {
                                        res.render("admin.twig",{"login":req.session.user,
                                                             "ulist":docs });
                                    });
                            }
                    });
                });
        }
        else 
        {   
            res.redirect('/login');
        }
    });

app.get('/', function(req, res){
	res.redirect("/home");
});

app.get('/arena', function(req, res){
	
	if(req.session.user) res.render("arena.twig");
	else res.redirect("/login");
});
app.post('/admin_create',function(req,res)
    {
        if (req.session.user)
        {
            if (req.body["admin"]==1)
                {
                    var adm=1;
                }
            else 
                {
                    var adm=0;
                }
            MongoClient.connect(dburl,function(err,db)
            {
                var lel=db.collection("users");
                lel.find({_id:req.session.user},{"admin":1}).toArray(function(err,docs)
                    {
                    if (docs[0]["admin"]==1)
                        {
                        var salt=crypto.randomBytes(64).toString('hex');
                        var iterations=1000;
                        crypto.pbkdf2(req.body["pass"],salt,iterations,128,'sha512',function(err,hash)
                        {
                            lel.insert([ { "_id": req.body["login"],"Password": hash.toString('hex'),"Kills": req.body["kills"],"Deaths":req.body["deaths"],"Salt":salt,"Played":req.body["played"],"Won":req.body["won"],"admin":adm}],function(err,result)
                                    {
                                        res.redirect("/userlist");
                                    });
                        });
                    }
                    else
                    {   
                        res.redirect('/error');
                    }
                });
            });
        }
        else
        {
            res.redirect('/error');
        }

    });

app.get('/admin_modify',function(req,res)
    {
    if (req.session.user)
        {
        MongoClient.connect(dburl,function(err,db)
                {
                    var lel=db.collection("users");
                    lel.find({_id:req.session.user},{"admin":1}).toArray(function(err,docs)
                        {
                        if (docs[0]["admin"]==1)
                            {
                            lel.find({_id:req.query["login"]},{Password:0,Salt:0,lastModified:0}).toArray(function(err,docs)
                                {
                                    console.log(docs[0]);
                                    if(docs[0]["admin"]==1)
                                    {
                                        var adm="1";
                            
                                    res.render('modify.twig',{"old_won":docs[0]["Won"],
                                                              "old_played":docs[0]["Played"],
                                                              "old_kills":docs[0]["Kills"],
                                                              "old_deaths":docs[0]["Deaths"],
                                                              "old_admin":adm,
                                                              "login":req.session.user,
                                                              "old_login":req.query["login"]
                                                             });
                                    }
                                    else
                                    {
                                    res.render('modify.twig',{"old_won":docs[0]["Won"],
                                                              "old_played":docs[0]["Played"],
                                                              "old_kills":docs[0]["Kills"],
                                                              "old_deaths":docs[0]["Deaths"],
                                                              "login":req.session.user,
                                                              "old_login":req.query["login"]
                                                             });

                                    }

                                });
                            }
                        else
                            {
                            res.redirect('/error');
                            }
                        });
            });
        }
        else
        {
            res.redirect('/login');
        }
    });

app.post('/admin_modify',function(req,res)
    {
        if (req.session.user)
        {
            if (req.body["admin"]==1)
            {
                var adm=1;
            }
            else
            {
                var adm=0;
            }
            MongoClient.connect(dburl,function(err,db)
                {
                var lel=db.collection("users");
                lel.find({_id:req.session.user},{"admin":1}).toArray(function(err,docs)
                    {
                    if (docs[0]["admin"])
                        {
                            lel.update({_id:req.body["login"]},{$set:{"Deaths":req.body["deaths"],"Kills":req.body["kills"],"Played":req.body["played"],"Won":req.body["won"],"admin":adm}});
                            res.redirect('/userlist');
                        }
                    else
                    {
                        res.redirect('/error');
                    }
                });
            });
        }
        else
        {
            res.redirect('/error');
        }
    });
app.post("/admin_delete",function(req,res)
    {
    if (req.session.user)
        {
        MongoClient.connect(dburl,function(err,db)
                {
                    var lel=db.collection("users");
                    lel.find({_id:req.session.user},{"admin":1}).toArray(function(err,docs)
                        {
                            if (docs[0]["admin"])
                            {
                                lel.remove({_id:req.body["login"]});
                                res.redirect('/userlist');
                            }
                            else
                            {
                                res.redirect('/error');
                            }
                        });
                    });
                }
        else
        {
            res.redirect('/error');
        }
    });


app.all('/error',function(req,res){
    res.render('error.twig',{"login":req.session.user});
});
        
server.listen(app.get('port'), function() {
  console.log('Node app is running on port '+app.get('port'));  
});

