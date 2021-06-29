const express=require("express")
const mongoose=require('mongoose')
const schedule =require('node-schedule')
const nodemailer = require('nodemailer')
require('dotenv').config();
const puppeteer=require('puppeteer')

const Product =require('./models/product')
const transporter=require('./mail')

const app=express()

app.set('view engine','ejs')

//mongodb connection
const dBURI ="mongodb+srv://callbackcats:test1234@cluster0.sod7r.mongodb.net/pricetracker?retryWrites=true&w=majority"

mongoose.connect(dBURI,{useNewUrlParser:true,useUnifiedTopology:true})
.then((result)=>{
    console.log('connected to mongodb')
    app.listen(process.env.PORT || 3000)})
.catch((err)=>console.log(err))


//every 1 min price check using node-schedule
schedule.scheduleJob('* */12 * * *',()=>{

    Product.find()
    .then((results)=>{

      results.forEach((eachproduct)=>{

          const minprice = eachproduct.minprice
          const email=eachproduct.email
          const id=eachproduct._id
          var initialurl = eachproduct.url
          var spliturl = initialurl.split('ref')
          var url=spliturl[0]
          

          configureBrowser()

          async function configureBrowser() 
          {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            //console.log("new page created")
            await amazonwebpage(page)
          }

          
          async function amazonwebpage(page)
          {
            await page.goto(url)
            //console.log("in amazon web page")
            await checkPrice(page)
          }


async function checkPrice(page)
{
    //console.log("inside checkprice function")
    //let website_price=100

    let website_price = await page.evaluate(()=>document.getElementById('priceblock_ourprice').innerText)
    .catch((err)=>{console.log(err)})
    const commaprice = website_price.replace('₹', '')
    const current_price = parseFloat(commaprice.replace(',',''))

    if(current_price<minprice)
    {
        console.log(current_price)

        let mailOptions = {
            from: 'CallbackCats ',
            to: email,
            subject: 'PRICE DROPPED TO ' + current_price,
            text: `The price on ${url} has dropped below ${minprice} `
        };

        transporter.sendMail(mailOptions, function(err, data){
            if (err){
                console.log('Error Occurs',err);
            }else{
                console.log('Email sent!!!');
            }
                         });

         Product.findByIdAndDelete(id)
           .then((r)=>{
           })                


    }
}
     })
    })
})

//routes
app.set()

app.use(express.urlencoded({extended:true}))

app.use(express.static('public'))

app.get('/',(req,res)=>{
    res.redirect('/index')
})

app.get('/index',(req,res)=>{
    res.render("index",{title:'Home'})
})

app.get('/thanks',(req,res)=>{
    res.render('thanks',{title:'Thank You'})
})

app.post('/index',(req,res)=>{

    const product= new Product(req.body)
    product.save()
    .then((result)=>res.redirect('/thanks'))
    .catch((err)=>console.log(err))
    
})

app.use((req,res)=>{
    res.render('404',{title:'Not Found'})
})
 