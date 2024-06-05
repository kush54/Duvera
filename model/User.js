const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "user" },
    addresses: { type: [Schema.Types.Mixed] },
    name: { type: String },
    salt: Buffer,
    resetPasswordToken: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

const virtual = userSchema.virtual("id");
virtual.get(function () {
  return this._id;
});
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

exports.User = mongoose.model("User", userSchema);

// userSchema.pre("save",async function (next){
//   const user = this;
//   console.log(user.password)
//   if(!user.isModified("password")){
//     return next();
//   }
//   try {
//    const salt = await bcrypt.genSalt(10)
//    const hashedPassword = await bcrypt.hash(user.password,salt);
//    console.log(hashedPassword)
//    user.password = hashedPassword;
//    next();
//   } catch (error) {
//     return next(err);
//   }
// })

// userSchema.methods.comparePassword = async function(candidatePassword){
//   try {
//     const isMatch = await bcrypt.compare(candidatePassword,this.password)
//     return isMatch
//   } catch (error) {
//     throw error
//   }
// }
