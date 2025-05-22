import express from "express"; // Express.js framework to create the backend server 
import { Signup ,Login, Logout} from "../controller/authController.js";
import isLogin from "../middlewares/isLogin.js";

const app = express.Router();

// Signup Route
app.post("/signup", Signup);

// SignIn Route
app.post("/login", Login);

// Logout Route
app.post('/logout',isLogin,Logout)

export default app;