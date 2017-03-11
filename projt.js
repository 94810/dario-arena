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

var dburl=f('mongodb://%s:%s@localhost:27017/test?authMechanism=DEFAULT',dblogin,dbpassword);

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

/*app.get('/style.css',function(req,res)
    {
        res.sendFile(__dirname+"/style.css");
    });*/

app.listen(2048);
