const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    console.log('username: '+ req.body)
    // Validate input
    if (!username || !email || !password) {
      return res
        .status(400)
        .send({ message: "Username, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .send({ message: "Failed! Username or email is already in use!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Assign roles
    let userRoles = [];
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ name: { $in: roles } });
      userRoles = foundRoles.map((role) => role._id);
    } else {
      const defaultRole = await Role.findOne({ name: "user" });
      userRoles = [defaultRole._id];
    }

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      roles: userRoles,
    });

    // Save user
    await newUser.save();

    res.status(201).send({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username })
      .populate("roles", "-__v")
      .exec();

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid Password!" });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400, // 24 hours
    });

    const authorities = user.roles.map(
      (role) => "ROLE_" + role.name.toUpperCase()
    );

    req.session.token = token;

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
    });
  } catch (err) {
    console.error("Error in signin:", err);
    res.status(500).send({ message: "Internal server error" });
  }
};


exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    this.next(err);
  }
};
