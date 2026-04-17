import "dotenv/config";
import { configureDatabaseUrl } from "./src/config/env.js";

configureDatabaseUrl();

const [{ default: app }, { connectDB }] = await Promise.all([
  import("./src/app.js"),
  import("./src/config/db.js")
]);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
