const express=require("express");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const fs=require("fs");
const path=require("path");
const multer=require("multer");
const app=express();
const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||"CHANGE_THIS_SECRET";
const ADMIN_ID=process.env.ADMIN_ID||"9345314633";
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"SANJU BLUE CRY @143";
const DB=path.join(__dirname,"data.json");
const upload=multer({dest:path.join(__dirname,"uploads")});
app.use(express.json({limit:"10mb"}));
app.get("/api/health",(req,res)=>res.json({ok:true,service:"gold-trade-market"}));
app.use(express.static(path.join(__dirname,"public")));
app.get("/admin/", (req,res)=>res.sendFile(path.join(__dirname,"admin.html")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"admin.html")));

function db(){if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify({users:[],payments:[],nextUser:1,nextPayment:1},null,2));return JSON.parse(fs.readFileSync(DB))}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}
function token(payload){return jwt.sign(payload,JWT_SECRET,{expiresIn:"7d"})}
function auth(req,res,next){try{req.auth=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),JWT_SECRET);next()}catch{res.status(401).json({error:"Authentication required"})}}
function admin(req,res,next){if(req.auth?.role!=="admin")return res.status(403).json({error:"Admin access only"});next()}
function publicUser(u){return {id:u.id,name:u.name,phone:u.phone,wallet:u.wallet,active:u.wallet>0,expiry:u.expiry,paymentStatus:u.paymentStatus}}
app.post("/api/register",async(req,res)=>{let {name,phone,password}=req.body;if(!name||!/^\d{10}$/.test(phone)||!password)return res.status(400).json({error:"Invalid registration details"});let d=db();if(d.users.some(u=>u.phone===phone))return res.status(409).json({error:"Phone already registered"});let u={id:d.nextUser++,name,phone,password:await bcrypt.hash(password,12),wallet:0,expiry:null,paymentStatus:"none"};d.users.push(u);save(d);res.json({ok:true})});
app.post("/api/login",async(req,res)=>{let d=db(),u=d.users.find(x=>x.phone===req.body.phone);if(!u||!(await bcrypt.compare(req.body.password||"",u.password)))return res.status(401).json({error:"Invalid phone or password"});res.json({token:token({role:"user",id:u.id}),user:publicUser(u)})});
app.get("/api/me",auth,(req,res)=>{let d=db(),u=d.users.find(x=>x.id===req.auth.id);if(!u)return res.status(404).json({error:"User not found"});if(u.wallet<=0){u.wallet=0;u.expiry=null}if(u.expiry&&Date.now()>=u.expiry){u.wallet=0;u.expiry=null;u.paymentStatus="expired";save(d)}res.json({user:publicUser(u)})});
app.post("/api/payment",auth,async(req,res)=>{let d=db(),u=d.users.find(x=>x.id===req.auth.id);if(!u)return res.status(404).json({error:"User not found"});if(!/^\d{12}$/.test(req.body.utr||""))return res.status(400).json({error:"UTR must be exactly 12 digits"});if(!req.body.proofData)return res.status(400).json({error:"Payment proof required"});if(d.payments.some(p=>p.utr===req.body.utr))return res.status(409).json({error:"UTR already submitted"});let p={id:d.nextPayment++,userId:u.id,amount:5000,utr:req.body.utr,proofName:req.body.proofName||"",proofData:req.body.proofData,status:"pending",createdAt:new Date().toISOString()};d.payments.push(p);u.paymentStatus="pending";save(d);res.json({ok:true})});
app.post("/api/admin/login",(req,res)=>{if(req.body.id===ADMIN_ID&&req.body.password===ADMIN_PASSWORD)return res.json({token:token({role:"admin"}),ok:true});res.status(401).json({error:"Invalid admin credentials"})});
app.get("/api/admin/requests",auth,admin,(req,res)=>{let d=db();res.json({requests:d.payments.map(p=>{let u=d.users.find(x=>x.id===p.userId);return {id:p.id,name:u?.name||"",phone:u?.phone||"",amount:p.amount,utr:p.utr,proofName:p.proofName,status:p.status,createdAt:p.createdAt}})})});
app.post("/api/admin/requests/:id",auth,admin,(req,res)=>{let d=db(),p=d.payments.find(x=>x.id===Number(req.params.id));if(!p)return res.status(404).json({error:"Request not found"});if(p.status!=="pending")return res.status(400).json({error:"Request already reviewed"});let u=d.users.find(x=>x.id===p.userId);if(req.body.action==="approve"){p.status="approved";u.wallet=Number(u.wallet||0)+5000;u.expiry=Date.now()+30*24*60*60*1000;u.paymentStatus="approved"}else if(req.body.action==="reject"){p.status="rejected";u.paymentStatus="rejected"}else return res.status(400).json({error:"Invalid action"});save(d);res.json({ok:true})});
app.listen(PORT,"0.0.0.0",()=>console.log("GOLD TRADE MARKET running on port "+PORT));