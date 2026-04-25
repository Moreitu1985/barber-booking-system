const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Barber Booking API is running");
});

/* AUTH */

app.post("/auth/register", (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    INSERT INTO users (full_name, email, password, role)
    VALUES (?, ?, ?, 'customer')
  `;

  db.query(sql, [full_name, email, password], (err) => {
    if (err) {
      return res.status(500).json({ message: "Email already exists" });
    }

    res.status(201).json({ message: "Account created successfully" });
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT id, full_name, email, role
    FROM users
    WHERE email = ? AND password = ?
  `;

  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ message: "Login error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: results[0]
    });
  });
});

/* SERVICES */

app.get("/services", (req, res) => {
  db.query("SELECT * FROM services", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching services" });
    res.json(results);
  });
});

/* BARBERS */

app.get("/barbers", (req, res) => {
  const sql = `
    SELECT 
      barbers.id,
      users.full_name AS name,
      barbers.specialty,
      barbers.location,
      barbers.current_status,
      barbers.house_call_available
    FROM barbers
    JOIN users ON barbers.user_id = users.id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching barbers" });
    res.json(results);
  });
});

app.get("/barbers/by-user/:userId", (req, res) => {
  const { userId } = req.params;

  db.query("SELECT * FROM barbers WHERE user_id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching barber" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Barber not found" });
    }

    res.json(results[0]);
  });
});

app.put("/barbers/:id/status", (req, res) => {
  const { current_status, house_call_available } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE barbers
    SET current_status = ?, house_call_available = ?
    WHERE id = ?
  `;

  db.query(sql, [current_status, house_call_available, id], (err) => {
    if (err) return res.status(500).json({ message: "Error updating status" });
    res.json({ message: "Barber status updated" });
  });
});

/* UNAVAILABLE SLOTS */

app.post("/barbers/unavailable", (req, res) => {
  const { barber_id, unavailable_date, start_time, end_time, reason } = req.body;

  const sql = `
    INSERT INTO unavailable_slots
    (barber_id, unavailable_date, start_time, end_time, reason)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [barber_id, unavailable_date, start_time, end_time, reason], (err) => {
    if (err) return res.status(500).json({ message: "Error saving unavailable slot" });
    res.status(201).json({ message: "Unavailable slot added" });
  });
});

app.get("/barbers/:barberId/unavailable", (req, res) => {
  const { barberId } = req.params;

  const sql = `
    SELECT * FROM unavailable_slots
    WHERE barber_id = ?
    ORDER BY unavailable_date DESC
  `;

  db.query(sql, [barberId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching unavailable slots" });
    res.json(results);
  });
});

/* CREATE BOOKING REQUEST */

app.post("/bookings", (req, res) => {
  const {
    customer_id,
    barber_id,
    service_id,
    booking_date,
    booking_time,
    booking_type,
    payment_method,
    customer_location,
    distance_km
  } = req.body;

  if (!customer_id || !barber_id || !service_id || !booking_date || !booking_time || !booking_type || !payment_method) {
    return res.status(400).json({ message: "All required fields must be completed" });
  }

  const serviceSql = "SELECT * FROM services WHERE id = ?";

  db.query(serviceSql, [service_id], (err, serviceResult) => {
    if (err || serviceResult.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service = serviceResult[0];

    const fixedPrice = Number(service.fixed_price);
    const bookingFee = 20;
    const travelFee = booking_type === "House Call" ? 50 : 0;
    const estimatedMinutes =
      booking_type === "House Call"
        ? Number(service.duration_minutes) + 30
        : Number(service.duration_minutes);

    const customerRequestedTotal = fixedPrice + bookingFee + travelFee;

    const unavailableSql = `
      SELECT * FROM unavailable_slots
      WHERE barber_id = ?
      AND unavailable_date = ?
      AND ? BETWEEN start_time AND end_time
    `;

    db.query(unavailableSql, [barber_id, booking_date, booking_time], (err, unavailable) => {
      if (err) return res.status(500).json({ message: "Error checking availability" });

      if (unavailable.length > 0) {
        return res.status(409).json({ message: "Barber is unavailable at that time" });
      }

      const checkSql = `
        SELECT * FROM bookings
        WHERE barber_id = ?
        AND booking_date = ?
        AND booking_time = ?
        AND status NOT IN ('Cancelled', 'Rejected By Barber')
      `;

      db.query(checkSql, [barber_id, booking_date, booking_time], (err, existing) => {
        if (err) return res.status(500).json({ message: "Error checking booking" });

        if (existing.length > 0) {
          return res.status(409).json({ message: "This barber is already booked at that time" });
        }

        const insertSql = `
          INSERT INTO bookings (
            customer_id,
            barber_id,
            service_id,
            booking_date,
            booking_time,
            booking_type,
            payment_method,
            customer_location,
            distance_km,
            fixed_service_price,
            booking_fee,
            travel_fee,
            customer_requested_total,
            estimated_minutes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [
            customer_id,
            barber_id,
            service_id,
            booking_date,
            booking_time,
            booking_type,
            payment_method,
            customer_location || null,
            distance_km || 0,
            fixedPrice,
            bookingFee,
            travelFee,
            customerRequestedTotal,
            estimatedMinutes
          ],
          (err, result) => {
            if (err) return res.status(500).json({ message: "Booking failed" });

            res.status(201).json({
              message: "Booking request sent to barber",
              bookingId: result.insertId,
              customerRequestedTotal
            });
          }
        );
      });
    });
  });
});

/* CUSTOMER BOOKINGS */

app.get("/customers/:customerId/bookings", (req, res) => {
  const { customerId } = req.params;

  const sql = `
    SELECT
      bookings.*,
      services.name AS service_name,
      barberUser.full_name AS barber_name
    FROM bookings
    JOIN services ON bookings.service_id = services.id
    JOIN barbers ON bookings.barber_id = barbers.id
    JOIN users barberUser ON barbers.user_id = barberUser.id
    WHERE bookings.customer_id = ?
    ORDER BY bookings.created_at DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching bookings" });
    res.json(results);
  });
});

/* BARBER BOOKINGS */

app.get("/barbers/:barberId/bookings", (req, res) => {
  const { barberId } = req.params;

  const sql = `
    SELECT
      bookings.*,
      customer.full_name AS customer_name,
      services.name AS service_name
    FROM bookings
    JOIN users customer ON bookings.customer_id = customer.id
    JOIN services ON bookings.service_id = services.id
    WHERE bookings.barber_id = ?
    ORDER BY bookings.booking_date DESC, bookings.booking_time DESC
  `;

  db.query(sql, [barberId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching barber bookings" });
    res.json(results);
  });
});

/* BARBER ACCEPTS, CHANGES PRICE, DISCOUNTS, OR REJECTS */

app.put("/bookings/:id/barber-response", (req, res) => {
  const { action, barber_extra_charge, barber_discount, barber_reason } = req.body;
  const { id } = req.params;

  if (action === "reject") {
    const rejectSql = `
      UPDATE bookings
      SET status = 'Rejected By Barber', barber_reason = ?
      WHERE id = ?
    `;

    db.query(rejectSql, [barber_reason || "Rejected by barber", id], (err) => {
      if (err) return res.status(500).json({ message: "Error rejecting booking" });
      res.json({ message: "Booking rejected" });
    });

    return;
  }

  const getSql = `
    SELECT fixed_service_price, booking_fee, travel_fee, customer_requested_total
    FROM bookings
    WHERE id = ?
  `;

  db.query(getSql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = results[0];

    const minimumTotal =
      Number(booking.fixed_service_price) +
      Number(booking.booking_fee) +
      Number(booking.travel_fee);

    const extra = Number(barber_extra_charge || 0);
    const discount = Number(barber_discount || 0);

    const finalTotal = minimumTotal + extra - discount;

    if (finalTotal < minimumTotal) {
      return res.status(400).json({
        message: "Final price cannot be less than the fixed price plus required fees"
      });
    }

    const status =
      finalTotal === Number(booking.customer_requested_total)
        ? "Confirmed"
        : "Awaiting Customer Confirmation";

    const updateSql = `
      UPDATE bookings
      SET
        barber_extra_charge = ?,
        barber_discount = ?,
        barber_reason = ?,
        barber_final_total = ?,
        status = ?
      WHERE id = ?
    `;

    db.query(updateSql, [extra, discount, barber_reason || null, finalTotal, status, id], (err) => {
      if (err) return res.status(500).json({ message: "Error updating booking" });

      res.json({
        message:
          status === "Confirmed"
            ? "Booking accepted and confirmed"
            : "Booking accepted with changes. Waiting for customer confirmation.",
        finalTotal
      });
    });
  });
});

/* CUSTOMER CONFIRMS FINAL PRICE */

app.put("/bookings/:id/customer-confirm", (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE bookings
    SET status = 'Confirmed'
    WHERE id = ?
    AND status = 'Awaiting Customer Confirmation'
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error confirming booking" });

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Booking cannot be confirmed" });
    }

    res.json({ message: "Booking confirmed successfully" });
  });
});

/* BARBER FINISHES BOOKING */

app.put("/bookings/:id/finish", (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE bookings
    SET status = 'Finished'
    WHERE id = ?
    AND status = 'Confirmed'
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error finishing booking" });

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Only confirmed bookings can be finished" });
    }

    res.json({ message: "Haircut marked as finished" });
  });
});

/* REVIEWS */

app.post("/reviews", (req, res) => {
  const { booking_id, customer_id, barber_id, rating, tip_amount, comment } = req.body;

  const sql = `
    INSERT INTO reviews
    (booking_id, customer_id, barber_id, rating, tip_amount, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [booking_id, customer_id, barber_id, rating || null, tip_amount || 0, comment || null],
    (err) => {
      if (err) return res.status(500).json({ message: "Review failed" });
      res.json({ message: "Review submitted successfully" });
    }
  );
});
app.post("/services", (req, res) => {
  const { name, description, fixed_price, duration_minutes } = req.body;

  if (!name || !fixed_price || !duration_minutes) {
    return res.status(400).json({ message: "Service name, price and time are required" });
  }

  const sql = `
    INSERT INTO services (name, description, fixed_price, duration_minutes)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, description || "", fixed_price, duration_minutes],
    (err) => {
      if (err) return res.status(500).json({ message: "Error adding service" });

      res.status(201).json({ message: "Service added successfully" });
    }
  );
});

app.get("/reviews/feed", (req, res) => {
  const sql = `
    SELECT
      reviews.rating,
      reviews.tip_amount,
      reviews.comment,
      reviews.created_at,
      customer.full_name AS customer_name,
      barberUser.full_name AS barber_name
    FROM reviews
    JOIN users customer ON reviews.customer_id = customer.id
    JOIN barbers ON reviews.barber_id = barbers.id
    JOIN users barberUser ON barbers.user_id = barberUser.id
    ORDER BY reviews.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching reviews" });
    res.json(results);
  });
});

/* DASHBOARD STATS */

app.get("/dashboard/stats", (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total_bookings,

      SUM(CASE WHEN status = 'Finished' THEN 1 ELSE 0 END) AS finished_cuts,

      SUM(CASE
        WHEN YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE(), 1)
        AND status = 'Finished'
        THEN barber_final_total ELSE 0
      END) AS weekly_revenue,

      SUM(CASE
        WHEN MONTH(booking_date) = MONTH(CURDATE())
        AND YEAR(booking_date) = YEAR(CURDATE())
        AND status = 'Finished'
        THEN barber_final_total ELSE 0
      END) AS monthly_revenue,

      SUM(CASE
        WHEN YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE(), 1)
        THEN 1 ELSE 0
      END) AS weekly_customers,

      SUM(CASE
        WHEN MONTH(booking_date) = MONTH(CURDATE())
        AND YEAR(booking_date) = YEAR(CURDATE())
        THEN 1 ELSE 0
      END) AS monthly_customers

    FROM bookings
    WHERE status != 'Cancelled'
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Stats error" });
    res.json(results[0]);
  });
});

app.get("/dashboard/monthly-barber-stats", (req, res) => {
  const sql = `
    SELECT
      barberUser.full_name AS barber_name,
      COUNT(bookings.id) AS total_bookings,
      SUM(CASE WHEN bookings.status = 'Finished' THEN bookings.barber_final_total ELSE 0 END) AS total_revenue
    FROM bookings
    JOIN barbers ON bookings.barber_id = barbers.id
    JOIN users barberUser ON barbers.user_id = barberUser.id
    WHERE MONTH(bookings.booking_date) = MONTH(CURDATE())
    AND YEAR(bookings.booking_date) = YEAR(CURDATE())
    GROUP BY barberUser.full_name
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Barber stats error" });
    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});