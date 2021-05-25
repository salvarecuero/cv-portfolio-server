const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3500;
const resolveCache = require("./handlers/resolveCache");

app.use(cors());

app.get("/api/get-tree/", resolveCache);

app.listen(PORT, () => {
  console.log(`Server running...`);
});
