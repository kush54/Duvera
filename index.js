const express = require("express");
const mongoose = require("mongoose");
const productRouters = require("./routes/Products");
const { createProduct } = require("./controller/Product");
const categoriesRouter = require("./routes/Categories");
const brandsRouter = require("./routes/Brands");
const usersRouter = require("./routes/Users");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const orderRouter = require("./routes/Order");
const cookieParser = require("cookie-parser");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const { User } = require("./model/User");
const { isAuth, cookieExtractor } = require("./services/common");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
app.use(express.static(path.resolve(__dirname,'build')));

// webhook

app.use(cookieParser());
const token = jwt.sign({ foo: "bar" }, SECRET_KEY);
const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = SECRET_KEY;


app.use(express.json());

app.use(
  session({
    secret: "your_secret_key", // Replace with your secret key
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: false } // Set to true if using HTTPS
  })
);
app.use(passport.authenticate("session"));

// routers
app.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);

passport.use(
  "local",
  new LocalStrategy(
    { usernameField: "email" }, // Use 'email' as the username field
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email }).exec();

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        } else if (await user.comparePassword(password)) {
          const payload = {
            id: user.id,
            role: user.role,
          };
          const token = jwt.sign(payload, SECRET_KEY);
          return done(null, { user: user, token: token });
        } else {
          return done(null, false, { message: "invalid credentials" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "jwt",
  new JwtStrategy(opts, async (jwt_payload, done) => {
    console.log("chlo");
    try {
      const id = jwt_payload.id;
      console.log(id, "iid");
      const user = await User.findById(id);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: "user not found" });
      }
    } catch (error) {
      return done(error);
    }
    // User.findOne({id: jwt_payload.id}, function(err, user) {
    //     if (err) {
    //         return done(err, false);
    //     }
    //     if (user) {
    //         return done(null, user);
    //     } else {
    //         return done(null, false);
    //         // or you could create a new account
    //     }
    // });
  })
);

// // this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
  console.log("serialize");
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

// this changes session variable req.user when called from authorized request

passport.deserializeUser(function (user, cb) {
  console.log("de-serialize");
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.authenticate("local");

// payments

// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/create-payment-intent", async (req, res) => {
  const { totalAmount } = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// webhook

app.use("/products", isAuth(), productRouters.router);
app.use("/categories", isAuth(), categoriesRouter.router);
app.use("/brands", isAuth(), brandsRouter.router);
app.use("/users", isAuth(), usersRouter.router);
app.use("/auth", authRouter.router);
app.use("/cart", isAuth(), cartRouter.router);
app.use("/orders", isAuth(), orderRouter.router);

// batabase server
main().catch((err) => console.log(err));
async function main() {
  // await mongoose.connect(process.env.SHELL_URL);
  await mongoose.connect(process.env.ATLAS_URL);

  console.log("database connected");
}

app.get("/", (req, res) => {
  res.send("home");
});
app.listen(8080, () => {
  console.log("server started");
});
