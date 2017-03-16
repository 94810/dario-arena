// IT'S ME,DARIO!
var express = require('express');
var bodyP = require('body-parser');
var cookieP = require('cookie-parser');
var twig = require('twig');
var crypto = require('crypto');
var MongoClient = require ('mongodb').MongoClient
,   f=require ('util').format
,   assert =require ('assert');
var session= require ('express-session');


var db;
var dblogin=encodeURIComponent('RW');
var dbpassword= encodeURIComponent('gargamel');

var dburl=f('mongodb://%s:%s@ds129720.mlab.com:29720/dario-arena?authMechanism=DEFAULT',dblogin,dbpassword);

var app = express();
app
    .use(bodyP.urlencoded({ extended: false }))
    .use(cookieP());
app.use('/s', express.static('static'));
app.set('views', 'templates');
app.set("twig options", { autoescape: true });
app.use(session({
    secret :crypto.randomBytes(10).toString('base64'),
    resave :false,
    saveUninitialized:false,
}));



//CONFIG APPS
app.set('port', (process.env.PORT || 5000));



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
      //                      console.log("login failed!");
        //                    console.log("Password:"+docs[0]["Password"]);
         //                   console.log("Computed Password:"+hash.toString('hex'));
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
            lel.remove({_id:req.session.user},function(err,result)
                {
                    req.session.user=null;
                    res.redirect("/signup");
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
                        console.log(docs);
                        if (!docs[0]["admin"])
                            {
                                //res.writeHead(403);
                                res.render("error.twig",{"login":req.session.user,
                                                         "errorcode": 403 });
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
	res.send("Hello");
});

app.post('/admin_create',function(req,res)
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
            var salt=crypto.randomBytes(64).toString('hex');
            var iterations=1000;
            crypto.pbkdf2(req.body["pass"],salt,iterations,128,'sha512',function(err,hash)
                {
                        lel.insert([ { "_id": req.body["login"],"Password": hash.toString('hex'),"Kills": req.body["kills"],"Deaths":req.body["deaths"],"Salt":salt,"Played":req.body["played"],"Won":req.body["won"],"admin":adm}],function(err,result)
                            {
                                res.redirect("/userlist");
                            });
                });
        });
});

app.get('/admin_modify',function(req,res)
    {
    MongoClient.connect(dburl,function(err,db)
            {
                var lel=db.collection("users");
                lel.find({_id:req.query["login"]},{Password:0,Salt:0,lastModified:0}).toArray(function(err,docs)
                    {
                        console.log(docs[0]);
                        if(docs[0]["admin"]=1)
                        {
                            var adm="on";
                        }
                        else
                        {
                            var adm="";
                        }
                        res.render('modify.twig',{"old_won":docs[0]["Won"],
                                                  "old_played":docs[0]["Played"],
                                                  "old_kills":docs[0]["Kills"],
                                                  "old_deaths":docs[0]["Deaths"],
                                                  "old_admin":adm,
                                                  "login":req.session.user,
                                                  "old_login":req.query["login"]
                                                });

                    });
            });
    });

app.post('/admin_modify',function(req,res)
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
            lel.update({_id:req.body["login"]},{"Deaths":req.body["deaths"],"Kills":req.body["kills"],"Played":req.body["played"],"Won":req.body["won"],"admin":adm});
        res.redirect('/userlist');

            });

    });
app.post("/admin_delete",function(req,res)
    {
    MongoClient.connect(dburl,function(err,db)
            {
            var lel=db.collection("users");
            lel.remove({_id:req.body["login"]});
            res.redirect('/userlist'); 
            });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port '+app.get('port'));  
});


