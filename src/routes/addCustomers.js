const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Add Customer API
router.post("/", async (req, res) => {
  const { name, phoneNumber, email } = req.body;

  // Input parameter validation
  if (!name || !phoneNumber || !email) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Phone number validation
  const phoneNumberRegex = /^[6-9]\d{9}$/;
  if (!phoneNumberRegex.test(phoneNumber)) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    // Start the transaction
    await connection.beginTransaction();

    // Check for duplicates within the transaction
    const result= await connection.query(
      "SELECT * FROM customers WHERE phoneNumber = ? OR email = ? FOR UPDATE",
      [phoneNumber, email]
    );

    console.log(result[0]);

    if (result[0].length > 0) {
      // Customer with the same phone number or email already exists
      await rollbackAndRespond(connection, res, "Customer already exists");
    } else {
      // Insert customer into the database within the transaction
      const [insertResult] = await connection.query(
        "INSERT INTO customers (name, phoneNumber, email) VALUES (?, ?, ?)",
        [name, phoneNumber, email]
      );

      // Commit the transaction
      await connection.commit();

      connection.release();

      res.status(201).json({ message: "Customer added successfully" });
    }
  } catch (err) {
    console.error("Error adding customer:", err);
    await rollbackAndRespond(connection, res, "Internal server error");
  }
});

// Rollback the transaction and respond with an error message
async function rollbackAndRespond(connection, res, errorMessage) {
  try {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: errorMessage });
  } catch (err) {
    console.error("Error rolling back transaction:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = router;
