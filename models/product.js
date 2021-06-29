const mongoose=require('mongoose')

const Schema=mongoose.Schema

const productSchema = new  Schema({
    url : {
        type: String,
        required: true
    },
    minprice : {
        type: String,
        required: true

    },
    email:{
        type: String,
        required: true
    }

}, {timestamps: true})

const Product = mongoose.model('Product', productSchema)

module.exports= Product