const { User } = require("../model/User");
const crypto = require('crypto');
// const { sanitizeUser, sendMail } = require('../services/common');
const jwt = require("jsonwebtoken");
const { sendMail } = require("../services/common");
const SECRET_KEY = "SECRET_KEY";
exports.createUser = async (req, res) => {
  console.log("idr")
  const user = new User(req.body);
  console.log("hag",user)
  try {
    const doc = await user.save();
    req.login(doc, (err) => {
      if (err) {
        res.status(400).json(err);
      } else {
        const payload = {
          id: doc.id,
          role: doc.role,
        };
        const token = jwt.sign(payload, SECRET_KEY);
        res
          .cookie("jwt", token, {
            expires: new Date(Date.now() + 3600000),
            httpOnly: true,
          })
          .status(201)
          .json({
             token
          });
      }
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
};

exports.loginUser = async (req, res) => {
  res
  .cookie("jwt", req.user.token, {
    expires: new Date(Date.now() + 3600000),
    httpOnly: true,
  })
  .status(201)
  .json(
     req.user.token
  );
};

exports.logout = async (req, res) => {
  
  res.cookie('jwt', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .sendStatus(200)
};

exports.resetPasswordRequest = async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (user) {
    const token = crypto.randomBytes(48).toString('hex');
    user.resetPasswordToken = token;
    await user.save();

    // Also set token in email
    const resetPageLink =
      'http://localhost:3000/reset-password?token=' + token + '&email=' + email;
    const subject = 'reset password for e-commerce';
    const html = `<p>Click <a href='${resetPageLink}'>here</a> to Reset Password</p>`;

    // lets send email and a token in the mail body so we can verify that user has clicked right link

    if (email) {
      const response = await sendMail({ to: email, subject, html });
      res.json(response);
    } else {
      res.sendStatus(400);
    }
  } else {
    res.sendStatus(400);
  }
};

// exports.resetPasswordRequest  = async(req,res)=>{
//   const resetPage = "http://localhost:3000/reset-password"
//   const subject = "reset pw for e-commerce"
//   const html = `<p>Click <a href='${resetPage}'>here</a> to Reset Password</p>`;
//   if(req.body.email){
//     const response = await sendMail({to:req.body.email,subject,html})
//     res.json(response)
//   }
//   else{
//     res.sendStatus(400)
//   }
// }

exports.resetPassword = async (req, res) => {
  const { email, password, token } = req.body;
console.log(password)
console.log(token)
  const user = await User.findOne({ email: email, resetPasswordToken: token });
  console.log(user.password)
  if (user) {
        
        user.password = password;
        await user.save();

        console.log(user.password,"pap")
        const subject = 'password successfully reset for e-commerce';
        const html = `<p>Successfully able to Reset Password</p>`;
        if (email) {
          const response = await sendMail({ to: email, subject, html });
          res.json(response);
        } else {
          res.sendStatus(400);
        }
      
    
  } else {
    res.sendStatus(400);
  }
};
