const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');


const JWT_SECRET = 'Rohitisagood$boy'

//ROUTE 1: Create user using : POST "/api/auth/createuser".

router.post("/createuser", [
    body('name','Enter the valid name ').isLength({min:3}),
    body('email','Enter the valid email').isEmail(),
    body('password','password must be atleast 5 charcter').isLength({min:5}),
],async(req, res) => {
  let success = false;
  // if there are errors , return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }
try{
    // check weather the user with this email exist alerady
    let user=await User.findOne({email:req.body.email});
if(user){
  return res.status(400).json( { success, errors:"sorry a user with this email already exists"})
}
const salt = await bcrypt.genSalt(10);
const secPass = await bcrypt.hash(req.body.password,salt);

    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      })
      
       const data ={
         user:{
           id:user.id
         }
       }
     const authtoken = jwt.sign(data,JWT_SECRET);

success=true;
res.json({success,authtoken})
   
}catch(error){
      console.error(error.message)
      res.status(500).send("some Error occured")
    }
});

// ROUTE 2: Authenticate a user using : POST "/api/auth/login".no login required

router.post("/login", [
  body('email','Enter the valid email').isEmail(),
  body('password','Password Canot be blank').exists(),
],async(req, res) => {
 let success = false;

  // if there are errors , return bad request and the errors
   const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const{email,password}=req.body;
  try{
    let user = await User.findOne({email});
    if(!user){
      success = false
    return res.status(400).json({error:"Please Try to llogin with correct credentials"});
    }
    const passwordCompare =await bcrypt.compare(password,user.password);
    if(!passwordCompare){
      success = false
    return res.status(400).json({success, error:"Please Try to llogin with correct credentials"});
   
    }
    const data ={
      user:{
        id:user.id
      }
    }
    const authtoken = jwt.sign(data,JWT_SECRET);
    success = true;
    res.json({success,authtoken})

  } catch(error){
    console.error(error.message)
    res.status(500).send(" Internal Server Error occured");
  }


})

// ROUTE 3: GET loggin user details using: POST "/api/auth/getuser".login required

router.post("/getuser", fetchuser, async(req, res) => {

try{
  userId=req.user.id
  const user = await User.findById(userId).select("-password")
  res.send(user)

}catch(error){
  console.error(error.message)
  res.status(500).send(" Internal Server Error occured");
}
})

module.exports = router;
