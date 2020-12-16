const express =  require("express") 
const bodyParser = require("body-parser")
const app =  express();
const multer = require("multer")
const path = require("path")
const fs = require('fs')

app.use(bodyParser.urlencoded({extended:true}))
app.set("view engine","ejs")
app.use(express.static('static'))

var storage = multer.diskStorage({
  destination:(req,file,cb)=> {
    cb(null,"./static/uploads");
  },
  filename:(req,file,cb) =>{
    console.log(req.body)
    cb(null,req.body.music_name+path.extname(file.originalname))
  }
})


var upload = multer({storage:storage})

app.get("/", (req,res,next)=>{
  res.render("index")
})

app.post("/upload",upload.single("music_file"),(req,res,next)=>{
  const file = req.file;
  if(!file){
    const err = new Error("upload file ")
    err.httpStatusCode = 400;
    return next(err);
  }
 
  var files = fs.readdirSync(__dirname+ '/static/uploads');
  var fileNames = [];
  for(var i=0;i<files.length;i++){
      var name = files[i].split('.').slice(0, -1).join('.')
      // if(name === filesearch){
      //     res.send(name);
      // }
      fileNames.push(name);
  }
  res.send(files);
})

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));