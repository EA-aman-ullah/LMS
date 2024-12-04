import express from "express";

app = express();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listning on Port ${port}...`));
