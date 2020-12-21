const mongoose =  require('mongoose')

let userDetails = new mongoose.Schema({
    first_name:String,
    last_name :String,
    email:String,
    password:String
})
                               //plural of it is name of collection
module.exports = mongoose.model('UserDetail',userDetails);
