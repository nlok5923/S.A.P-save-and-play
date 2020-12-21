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
const idModel =  require("./models/id.js/id")

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

app.get("/", (req,res,next)=>{
  res.render("index")
})

app.get("/alltracks",async (req,res)=>{

 var arr = [];
var obj = await idModel.find({}).then(async (doc)=>{
      await doc.map((data,index)=>arr.push({id:data.track_id,name:data.name}));
    //  arr.push(doc)
      console.log(arr);
  }).catch(err => console.log(err));

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
        track_id:id
      })

      id_save.save().then((doc)=>console.log(doc)).catch((err)=>console.log(err));

      return (
        res.render('image',{t_id:id})
        )
    })

  })

})

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));