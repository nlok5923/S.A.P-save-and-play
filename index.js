const express =  require("express") 
const bodyParser = require("body-parser")
const app =  express();
const multer = require("multer")
const path = require("path")
const fs = require('fs')
const mongodb = require('mongodb')
const ObjectId = require('mongodb').ObjectID;
const {Readable} = require('stream')

const MongoURI = 'mongodb+srv://creator:nnNN@@22@cluster0.bkrcv.mongodb.net/Images.Images'



const MongoClient  = mongodb.MongoClient;

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

// var storage = multer.diskStorage({
//   destination:(req,file,cb)=> {
//     cb(null,"./static/uploads");
//   },
//   filename:(req,file,cb) =>{
//     console.log(req.body)
//     cb(null,req.body.music_name+path.extname(file.originalname))
//   }
// })


// var upload = multer({storage:storage})

app.get("/", (req,res,next)=>{
  res.render("index")
})

// app.post("/upload",upload.single("music_file"),(req,res,next)=>{
//   // const file = req.file;
//   // if(!file){
//   //   const err = new Error("upload file ")
//   //   err.httpStatusCode = 400;
//   //   return next(err);
//   // }
 
//   // var files = fs.readdirSync(__dirname+ '/static/uploads');
//   // //console.log(__dirname+'/static/uploads')
//   // var fileNames = [];
//  // console.log('../static/uploads'+files[0])
//   // res.render("image",{ src:files[0]} ) 
//   var img  =  fs.readFileSync(req.file.path)
//   var encodeImg = img.toString('base64')

//   var finalImg = {
//     contentType:req.file.mimetype,
//     path:req.file.path,
//     image: new Buffer(encodeImg,'base64')
//   };

//   db.collection('Images').insertOne(finalImg,(err,result)=>{
//     console.log(result)
//     if(err)
//    return console.log(err)
//    else
// console.log("saved o db");
// res.contentType(finalImg.contentType);
// res.send(finalImg.image);
// })

// })

app.get("/track/:trackID",(req,res)=>{
  try{
    var trackID = new ObjectId(req.params.trackID)
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
  const storage = multer.memoryStorage()
  const upload = multer({storage:multer.memoryStorage(),limits:{fields:1,fileSize:6000000,files:1,parts:2}});
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
    readableTrackStream.pipe(uploadStream);

    uploadStream.on('error',()=>{
      return res.status(500).json({message:"error uploading"})
    })

    uploadStream.on('finish',()=>{
      return res.status(201).json({message:"file upload success stored under object id"+id})
    })

  })

})

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));