const express = require("express");
const customersRouter = require("./routes/addCustomers");
const app = express();
const PORT = 5002;

// Middleware and configuration

app.use(express.json());

// Mount routes
app.use("/addcustomer", customersRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
