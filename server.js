const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./filmer.db");

// Skapa tabell filmer med rätt kolumner
db.run(`
  CREATE TABLE IF NOT EXISTS filmer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titel TEXT NOT NULL,
    år INTEGER,
    genre TEXT NOT NULL,
    betyg INTEGER NOT NULL CHECK(betyg BETWEEN 1 AND 10)
  )
`);

// GET - hämta alla filmer
app.get("/filmer", (req, res) => {
  db.all("SELECT * FROM filmer", (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Kunde inte hämta filmer" });
    }
    res.json(rows);
  });
});

// GET - hämta en film via id
app.get("/filmer/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM filmer WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Fel vid hämtning" });
    }
    if (!row) {
      return res.status(404).json({ message: "Film hittades inte" });
    }
    res.json(row);
  });
});

// POST - skapa film
app.post("/filmer", (req, res) => {
  try {
    const { titel, år, genre, betyg } = req.body;

    if (!titel || !genre) {
      return res.status(400).json({ message: "Titel och genre krävs" });
    }
    if (typeof betyg !== "number" || betyg < 1 || betyg > 10) {
      return res.status(400).json({ message: "Betyg måste vara mellan 1 och 10" });
    }

    db.run(
      "INSERT INTO filmer (titel, år, genre, betyg) VALUES (?, ?, ?, ?)",
      [titel, år, genre, betyg],
      function (err) {
        if (err) throw err;
        res.json({ message: "Film skapad", id: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - uppdatera film
app.put("/filmer", (req, res) => {
  try {
    const { id, titel, år, genre, betyg } = req.body;

    if (!titel || !genre) {
      return res.status(400).json({ message: "Titel och genre krävs" });
    }
    if (typeof betyg !== "number" || betyg < 1 || betyg > 10) {
      return res.status(400).json({ message: "Betyg måste vara mellan 1 och 10" });
    }

    db.run(
      "UPDATE filmer SET titel = ?, år = ?, genre = ?, betyg = ? WHERE id = ?",
      [titel, år, genre, betyg, id],
      function (err) {
        if (err) throw err;
        if (this.changes === 0) return res.status(404).json({ message: "Film ej hittad" });
        res.json({ message: "Film uppdaterad" });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE - ta bort film
app.delete("/filmer/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM filmer WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "Fel vid borttagning" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Film ej hittad" });
    }
    res.json({ message: "Film borttagen" });
  });
});

app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});