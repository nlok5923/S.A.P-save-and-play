const express =  require("express") 
const bodyParser = require("body-parser")
const app =  express();
const multer = require("multer")
const path = require("path")
const fs = require('fs')
const mongodb = require('mongodb')
const ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose')
const {Readable} = require('stream')
const idModel =  require("./models/id")
const detailModel = require("./models/signup")
const axios = require('axios')

var usrEmail = "";

const MongoURI = 'mongodb+srv://creator:nnNN@@22@cluster0.bkrcv.mongodb.net/Images.Images'

const MongoClient  = mongodb.MongoClient;

mongoose.connect('mongodb+srv://creator:nnNN@@22@cluster0.bkrcv.mongodb.net/Images',{useNewUrlParser:true,useUnifiedTopology:true}).then(()=>{
  console.log("connected")
})
.catch((err)=>{
  console.log("not connected")
})


MongoClient.connect(MongoURI,{
  useNewUrlParser:true,
  useUnifiedTopology:true
},(err,client)=>{
  if(err)
  {
      console.log(err+ "aagayi bhai")
  }else
  { 
      db = client.db('Images');
      app.listen(4000,()=>console.log("mongo server listen at 4000"))
  }
})

app.use(bodyParser.urlencoded({extended:true}))
app.set("view engine","ejs")
app.use(express.static('static'))
app.use(express.json());

app.get("/alltracks",async (req,res)=>{

var arr = [];
var obj = await idModel.find({email:usrEmail}).then(async (doc)=>{
      await doc.map((data,index)=>arr.push({id:data.track_id,name:data.name}));
      console.log(arr);
  }).catch(err => console.log(err));
console.log(usrEmail);
console.log(arr);
var length  = arr.length;
console.log(length)
return res.render('list',{arr,length})
})

app.get("/track/:trackID",(req,res)=>{
  try{
    var trackID = new ObjectId(req.params.trackID)
    console.log(req)
  }
  catch(err){
    return res.status(400).json({
      message : "invalid track id"
    })
  }

  res.set('content-type','audio/mp3');
  res.set('accept-ranges','bytes')

  let bucket = new mongodb.GridFSBucket(db,{
    bucketName:'tracks'
  });

  let downloadStream = bucket.openDownloadStream(trackID)

  downloadStream.on('data',(chunk)=>{
    res.write(chunk)
  })

  downloadStream.on('error',()=>{
    res.sendStatus(404);
  });

  downloadStream.on('end',()=>{
    res.end();
  })

});

app.get("/playall",(req,res)=>{
    res.render('playall');
    var arr = [];
var obj = idModel.find({}).then(async (doc)=>{
      await doc.map(async (data,index)=>{
        const url = 'https://localhost:3000/track/data.track_id';
        await axios.get(url)
      });
  }).catch(err => console.log(err));
    
})

app.post("/track",(req,res)=>{
  var s_id;
  const storage = multer.memoryStorage()
  const upload = multer({storage:multer.memoryStorage(),limits:{fields:1,fileSize:60000000,files:1,parts:2}});
  upload.single('track')(req,res,(err)=>{
    if(err){
      return res.status(400).json({message:"upload req fail"})
    }
    else if(!req.body.music_name){
      console.log(req)
      return res.status(400).json({message:"no track name in req body"})
    }

    let trackName = req.body.music_name

    const readableTrackStream = new Readable();
    readableTrackStream.push(req.file.buffer)
    readableTrackStream.push(null)

    let bucket = new mongodb.GridFSBucket(db,{
      bucketName:'tracks'
    })

    let uploadStream = bucket.openUploadStream(trackName);
    let id = uploadStream.id;
    s_id = id;
    readableTrackStream.pipe(uploadStream);

    uploadStream.on('error',()=>{
      return res.status(500).json({message:"error uploading"})
    })

    uploadStream.on('finish',()=>{
       
      let  id_save = new idModel({
        name:req.body.music_name,
        track_id:id,
        email:usrEmail
      })

      id_save.save().then((doc)=>console.log(doc)).catch((err)=>console.log(err));

      return (
        res.render('image',{t_id:id})
        )
    })

  })

})

app.get("/signup",(req,res)=>{
  res.render('signup')
})

app.get("/",(req,res)=>{
  res.redirect('/signup')
})
app.post("/",async (req,res)=>{
usrEmail = await  req.body.email;
console.log(usrEmail+"usr email")
var obj1 = await detailModel.find({email:req.body.email,password:req.body.password}).then((doc)=>{(doc.length!=0)?res.render('index'):res.render('login')}).catch((err)=>console.log(err))

});
app.get("/login",(req,res)=>{res.render('login')})
app.post("/login",(req,res)=>{
  let  user_detail = new detailModel({
    first_name:req.body.fname,
    last_name:req.body.lname,
    email:req.body.usremail,
    password:req.body.psw
  })
  console.log(req.body)
  user_detail.save().then((doc)=>console.log(doc)).catch((err)=>console.log(err))
  res.render('login')
})

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));