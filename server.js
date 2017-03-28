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

// ###### WebSocket Logic ########

wsS.on('connection', function(wsC){

	wsC.user = wsC.upgradeReq.session.user ; //On se "désynchronise" de la session, le Ws prend en charge la suite

	for( i in wsS.room){
		wsC.send(JSON.stringify({"newp" : i, "pos" : wsS.room[i].pos, "color" :  wsS.room[i].color })); //On récupére la liste des joueur présent
		console.log(i+wsS.room[i].pos);
	}

	wsS.room[wsC.user] = {};
	wsS.room[wsC.user].pos = { 'x' : 0 , 'y' : 0 };
	wsS.room[wsC.user].wsC = wsC ;
	wsS.room[wsC.user].way = true;	
	wsS.room[wsC.user].g = false;	
	wsS.room[wsC.user].alive = true;
	wsS.room[wsC.user].color =  wsC.upgradeReq.session.color;

	wsC.send(JSON.stringify({"name" : wsC.user, "color" : wsS.room[wsC.user].color})); //On send notre propre nom
	
	for( i in wsS.room ) if(i != wsC.user) wsS.room[i].wsC.send(JSON.stringify({ "newp" : wsC.user, 'pos' : wsS.room[i].pos, "color" : wsS.room[wsC.user].color} )); //On averti les autres joueur de la connection

	//La connection a la room est compléte

	wsC.on('message', function(data){
		var cltD = JSON.parse(data);

		wsS.room[wsC.user].pos = cltD.pos;
		wsS.room[wsC.user].way = cltD.way;
		wsS.room[wsC.user].g = cltD.g;

		if('alive' in cltD) wsS.room[wsC.user].alive = cltD.alive;

		for( i in wsS.room ) if(i!=wsC.user){
	
			if( !wsS.room[wsC.user].g && wsS.room[i].alive){ //Player jumping
				wsS.room[i].alive=false;
				if(wsS.room[wsC.user].pos.y <= wsS.room[i].pos.y && wsS.room[wsC.user].pos.y+100 >= wsS.room[i].pos.y){ // Y box 100 is aprox Dario size
					if(wsS.room[wsC.user].pos.x <= wsS.room[i].pos.x+100 && wsS.room[wsC.user].pos.x >= wsS.room[i].pos.x){ //X box (please microsoft no sue !)	
						for( j in wsS.room ) wsS.room[j].wsC.send(JSON.stringify({"kill" : i}));
					}else if(wsS.room[wsC.user].pos.x+100 <= wsS.room[i].pos.x+100 && wsS.room[wsC.user].pos.x+100 >= wsS.room[i].pos.x){		
						for( j in wsS.room ) wsS.room[j].wsC.send(JSON.stringify({"kill" : i}));
					}else wsS.room[i].alive=true;
				}else  wsS.room[i].alive=true;
			}
			// On send a tout le monde le nouveaux positionnement

			obj = {};
			obj[wsC.user] = { 'pos' : wsS.room[wsC.user].pos, 'way' : wsS.room[wsC.user].way , 'g' : wsS.room[wsC.user].g };
			wsS.room[i].wsC.send(JSON.stringify(obj));

			//ON vérifie les kills	
		}
	});
	
	wsC.on('close', function(){
		delete wsS.room[wsC.user];
		for(i in wsS.room) wsS.room[i].wsC.send(JSON.stringify({ 'dsc' : wsC.user }));
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
                        lel.insert([ { "_id": req.body["login"],"Password": hash.toString('hex'), "color" : req.body.color, "Kills": 0,"Deaths":0,"Salt":salt,"Played":0,"Won":0,"admin":0}],function(err,result)
                                {
                                });
                            });
                        req.session.user = req.body["login"];
			req.session.color = req.body.color;
                        res.redirect('/account');
                        }
                    else
                        {
                        res.redirect('/signup?e=1');
                        }
                }
                else
                {
                    res.redirect('/error');
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
                    if (!err)
                    {
                        //console.log(docs[0]);
		                req.session.color=docs[0]["color"];
                        res.render('account.twig',{ "login":req.session.user,
                                                    "Won":docs[0]["Won"],
                                                    "Killed":docs[0]["Kills"],
                                                    "Played":docs[0]["Played"],
                                                    "Deaths":docs[0]["Deaths"],
                                                    "color":docs[0]["color"]
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

app.post('/modify_color',function(req,res)
    {
        if(req.session.user)
        {
            MongoClient.connect(dburl,function(err,db)
            {
                var lel=db.collection("users")
                lel.update({_id:req.session.user},{$set:{"color":req.body["color"]}});
                res.redirect('/account');
            });
        }
        else
        {
            res.redirect('/error');
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
                if (!err)
                {
                    if (docs[0]==null)
                    {
                        res.render('login.twig',{"failed":1});
                    }
                    else
                    {   
                        crypto.pbkdf2(req.body["pass"],docs[0]["Salt"],1000,128,'sha512',function(err,hash)
                        {
                            if (!err)
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
                            }
                            else
                            {
                                res.redirect('/error');
                            }
                        });
                    }
                }
                else
                {
                    res.redirect('/error');
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
                if (!err)
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
                            if (!err)
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
                                            if (!err)
                                            {
                                                req.session.user=null;
                                                res.redirect("/signup");
                                            }
                                            else 
                                            {
                                                res.redirect("/error");
                                            }
                                        });
                                }
                            }
                            else
                            {
                                res.redirect('/error');
                            }
                        });
                    }
                }
                else
                {
                    res.redirect('/error');
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
                lel.find({},{Password:0,Salt:0,admin:0,lastModified:0,color:0}).sort({Won:-1,Kills:-1}).toArray(function(err,docs)
                    {
                        if (!err)
                        {
                            res.render('userlist.twig',{"docs":docs,
                                                        "login":req.session.user
                                                        });
                        }
                        else
                        {
                            res.redirect('/error');
                        }
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
                            lel.insert([ { "_id": req.body["login"],"Password": hash.toString('hex'),"color":req.body["color"],"Kills": req.body["kills"],"Deaths":req.body["deaths"],"Salt":salt,"Played":req.body["played"],"Won":req.body["won"],"admin":adm}],function(err,result)
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
                                                              "old_color":docs[0]["color"],
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
                                                              "old_color":docs[0]["color"],
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
                            lel.update({_id:req.body["login"]},{$set:{"Deaths":req.body["deaths"],"Kills":req.body["kills"],"Played":req.body["played"],"Won":req.body["won"],"admin":adm,"color":req.body["color"]}});
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

