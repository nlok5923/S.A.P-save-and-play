const mongoose =  require('mongoose')

let idSchema = new mongoose.Schema({
    name:String,
    track_id :String,
    email:String
})
                               //plural of it is name of collection
module.exports = mongoose.model('id',idSchema);
