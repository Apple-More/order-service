import app from "./app";
import { PORT } from "./config";

app.listen(PORT, () => {
  console.log(`Order Service is running on port ${PORT}`);
});
