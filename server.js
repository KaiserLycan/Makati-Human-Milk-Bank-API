import app from "./app.js";
import {redis} from "./lib/redis.lib.js";
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})