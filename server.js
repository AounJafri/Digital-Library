import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";


const app = express();
const port = 3000;
var bookId;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Books",
  password: "aoun123",
  port: 5432,
});

db.connect();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let current_user;

app.get("/",(req,res)=>{
  res.render("login.ejs");
})
// GET ROUTES
app.get("/login",(req,res)=>{
  res.render("login.ejs",{ sent: "login"})
})
app.get("/register",(req,res)=>{
  res.render("login.ejs", { sent: "register"})
})

app.get("/logout", (req,res)=>{
  current_user={};
  res.redirect("/");
})
// POST USER ROUTES

app.post("/register", async(req,res)=>{
  const { username, password, confirm_password } = req.body;
  
  if (!username || !password || !confirm_password) {
    return res.render("login.ejs", { sent: "register",error: "All field are required"});
  }
  if (password!==confirm_password) {
    return res.render("login.ejs", { sent: "register",error: "Passwords Must Match"});
  }
  const hashedPassword = await bcrypt.hash(password,10);

  try {
    const result = await db.query("INSERT INTO Users (username, password) VALUES ($1,$2) Returning *;",[username,hashedPassword]);
    current_user = result.rows[0];
    console.log(current_user)
    console.log(current_user.userid);
    // res.render("login.ejs", { sent: "register",error: "Registeration Successful! You'll be redirected to home page shortly."});
    res.redirect("/Home")
    // setTimeout(()=>{
    // res.redirect("/Home");
    // },2000)

  } catch (error) {
   console.log(error); 
  }
});
app.post("/login", async(req,res)=>{
    const {username, password } = req.body;
    if (!username || !password) {
      return res.render("login.ejs", { sent: "login",error: "All field are required"});
    }

    const result = await db.query("SELECT * FROM Users WHERE username = $1",[username]);
    if (!result.rows[0]) {
      return res.render("login.ejs", { sent: "login",error: "User does not exist"});
    }
    
    current_user = result.rows[0];
    if(!await bcrypt.compare(password,current_user.password)){
      return res.render("login.ejs", { sent: "register",error: "Incorrect Password"});
    }else{
      // res.render("login.ejs", { sent: "register",error: "Login Successfull! You'll be redirected to home page shortly"});
      res.redirect("/Home");
      // setTimeout(()=>{
      //   res.redirect("/Home");
      // },2000)
    }

})


// ROUTE TO RENDER THE MAIN PAGE
app.get("/Home", async (req, res) => {
  try {

    const result = await db.query("SELECT * FROM books WHERE userid = $1 ORDER BY id ASC",[current_user.userid]);

    return res.render("index.ejs", { books: result.rows,user:current_user.username });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});



// SORTING ROUTES
app.get("/rating",async (req,res)=>{
  try {

    const result = await db.query("SELECT * FROM books WHERE userid=$1 ORDER BY rating DESC",[current_user.userid]);

    res.render("index.ejs", { books: result.rows,user:current_user.username });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/latest",async (req,res)=>{
  try {
    const result = await db.query("SELECT * FROM books WHERE userid=$1 ORDER BY date DESC",[current_user.userid]);

    res.render("index.ejs", { books: result.rows,user:current_user.username });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/title",async(req,res)=>{
  try {
    const result = await db.query("SELECT * FROM books WHERE userid=$1 ORDER BY title ASC",[current_user.userid]);

    res.render("index.ejs", { books: result.rows,user:current_user.username });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});


// ROUTE TO RENDER TO ADD BOOK PAGE
app.get("/new", (req, res) => {
  res.render("modify.ejs", { heading: "New Book", submit: "Add Book" });
});

// ROUTE TO RENDER TO EDIT PAGE
app.get("/edit/:id", async (req, res) => {
  try {
    bookId = req.params.id;
     const response=await db.query("SELECT id,review,rating FROM books WHERE id=$1",[bookId]);
    res.render("modify.ejs", {
      heading: "Edit Review",
      submit: "Update Review",
      book: response.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});



// ROUTE TO ADD A NEW BOOK
app.post("/api/posts", async (req, res) => {
  try {

    var title = req.body.title;
    var review = req.body.review;
    var isbn = req.body.isbn;
    var rating = req.body.rating;
    var date= new Date();
    const result = await db.query("INSERT INTO books(title,isbn,review,rating,date,userid) VALUES($1,$2,$3,$4,$5,$6) RETURNING *;",[title,isbn,review,rating,date,current_user.userid]);
    res.redirect("/Home");
  } catch (error) {
    // res.status(500).json({ message: "Error creating post" });
    console.log(error);
    res.render("modify.ejs", { heading: "New Book", submit: "Add Book" , error:"Book already exists,Go back and create book with correct isbn" });
  }
});



// ROUTE TO UPDATE A BOOK REVIEW
app.post("/api/posts/:id", async (req, res) => {
  try {

    const response=await db.query("SELECT review,rating FROM books WHERE id=$1",[bookId]);

    var review = req.body.review || response.rows[0].review;
    var rating = req.body.rating || response.rows[0].rating;

    db.query("UPDATE books SET review = $1, rating = $2 WHERE id = $3 AND userid=$4",[review,rating,bookId,current_user.userid]);

    res.redirect("/Home");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});



// DELETE A BOOK
app.get("/api/posts/delete/:id", async (req, res) => {
  try {

    db.query("DELETE FROM books WHERE id=$1",[req.params.id]);
    res.redirect("/Home");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});


app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
