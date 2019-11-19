const app = require("./src/mu");

app.init().catch(err => console.error(err.stack));
