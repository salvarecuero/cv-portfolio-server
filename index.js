const express = require("express");
const cors = require("cors");
const app = express();
const resolveCache = require("./handlers/resolveCache");

app.use(cors());

app.get("/api/get-tree/", resolveCache);

app.listen(process.env.PORT || 3500, () => {
  console.log(`Server running...`);
});
