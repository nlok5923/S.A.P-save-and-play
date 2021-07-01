const mongoose =  require('mongoose')

let idSchema = new mongoose.Schema({
    name:String,
    track_id :String,
    email:String
});

module.exports = mongoose.model('id',idSchema);
