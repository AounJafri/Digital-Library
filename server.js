import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


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


// ROUTE TO RENDER THE MAIN PAGE
app.get("/", async (req, res) => {
  try {

    const result = await db.query("SELECT * FROM books ORDER BY id ASC");

    res.render("index.ejs", { books: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});



// SORTING ROUTES
app.get("/rating",async (req,res)=>{
  try {

    const result = await db.query("SELECT * FROM books ORDER BY rating DESC");

    res.render("index.ejs", { books: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/latest",async (req,res)=>{
  try {
    const result = await db.query("SELECT * FROM books ORDER BY date DESC");

    res.render("index.ejs", { books: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/title",async(req,res)=>{
  try {
    const result = await db.query("SELECT * FROM books ORDER BY title ASC");

    res.render("index.ejs", { books: result.rows });
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
    const reslut = await db.query("INSERT INTO books(title,isbn,review,rating,date) VALUES($1,$2,$3,$4,$5) RETURNING *;",[title,isbn,review,rating,date]);
    res.redirect("/");
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

    db.query("UPDATE books SET review = $1, rating = $2 WHERE id = $3",[review,rating,bookId]);

    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});



// DELETE A BOOK
app.get("/api/posts/delete/:id", async (req, res) => {
  try {

    db.query("DELETE FROM books WHERE id=$1",[req.params.id]);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});


app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
