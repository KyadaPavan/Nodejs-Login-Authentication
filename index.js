import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

mongoose
    .connect("mongodb://localhost:27017", {
        dbName: "backend",
    })
    .then(() => console.log("Dabatbase connected"))
    .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

// middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "ansionaoincnfasn");
        req.user = await User.findById(decoded._id);
        res.render("logout", { name: req.user.name });
    } else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/login", async (req, res) => {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.redirect("/register");

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) return res.render("login", { email, messege: "* Incorrect Password" })

    const token = jwt.sign({ _id: user._id }, "ansionaoincnfasn");

    res.cookie("token", token, {
        httpOnly: true, // to prevent client side access of cookie
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/");
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = jwt.sign({ _id: user._id }, "ansionaoincnfasn");

    res.cookie("token", token, {
        httpOnly: true, // to prevent client side access of cookie
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/");
});

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true, // to prevent client side access of cookie
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

app.listen(5000, (req, res) => {
    console.log("Server is Working");
});
