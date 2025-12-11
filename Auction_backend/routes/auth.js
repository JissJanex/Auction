import express from "express";
import jwt from "jsonwebtoken"; 
import bcrypt from "bcrypt";
import { db } from "../conf/db.js";

const router = express.Router();

//Signup with bcrypt hashing
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email, name",
      [name, email, hash]
    );

    const newUser = result.rows[0];
    const secretKey = process.env.JWT_SECRET;
    const token = jwt.sign({ id: newUser.id }, secretKey, {
      expiresIn: "1d",
    });

    res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //Check if user exists
  const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  if (user.rows.length === 0) {
    return res.status(400).send("User not found");
  }

  //Compare password
  const validPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!validPassword) {
    return res.status(400).send("Invalid password");
  }

  const secrectKey = process.env.JWT_SECRET;
  const token = jwt.sign({ id: user.rows[0].id }, secrectKey, {
    expiresIn: "1d",
  });
  res.json({ token });
});

export default router;
