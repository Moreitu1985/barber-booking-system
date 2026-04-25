import { useEffect, useState } from "react";
import axios from "axios";

function CustomerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bookings, setBookings] = useState([]);
  const [reviewData, setReviewData] = useState({
    rating: "",
    tip_amount: "",
    comment: ""
  });

  const fetchBookings = async () => {
    const res = await axios.get(
      `http://localhost:5000/customers/${user.id}/bookings`
    );
    setBookings(res.data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const confirmFinalPrice = async (bookingId) => {
    const res = await axios.put(
      `http://localhost:5000/bookings/${bookingId}/customer-confirm`
    );

    alert(res.data.message);
    fetchBookings();
  };

  const submitReview = async (booking) => {
    const res = await axios.post("http://localhost:5000/reviews", {
      booking_id: booking.id,
      customer_id: user.id,
      barber_id: booking.barber_id,
      rating: reviewData.rating || null,
      tip_amount: reviewData.tip_amount || 0,
      comment: reviewData.comment || null
    });

    alert(res.data.message);

    setReviewData({
      rating: "",
      tip_amount: "",
      comment: ""
    });
  };

  return (
    <div className="container">
      <h1>My Bookings</h1>

      {bookings.map((booking) => (
        <div className="booking-card" key={booking.id}>
          <h2>{booking.service_name}</h2>

          <p><b>Barber:</b> {booking.barber_name}</p>
          <p><b>Date:</b> {booking.booking_date}</p>
          <p><b>Time:</b> {booking.booking_time}</p>
          <p><b>Type:</b> {booking.booking_type}</p>
          <p><b>Payment:</b> {booking.payment_method}</p>
          <p><b>Status:</b> {booking.status}</p>

          {booking.booking_type === "House Call" && (
            <>
              <p><b>Your Location:</b> {booking.customer_location}</p>
              <p><b>Distance:</b> {booking.distance_km} km</p>
            </>
          )}

          <div className="summary-box">
            <p>Fixed Service Price: R{booking.fixed_service_price}</p>
            <p>Booking Fee: R{booking.booking_fee}</p>
            <p>Travel Fee: R{booking.travel_fee}</p>
            <p>Barber Extra Charge: R{booking.barber_extra_charge}</p>
            <p>Barber Discount: R{booking.barber_discount}</p>

            {booking.barber_reason && (
              <p><b>Barber Reason:</b> {booking.barber_reason}</p>
            )}

            <h3>
              Final Total: R
              {booking.barber_final_total || booking.customer_requested_total}
            </h3>
          </div>

          {booking.status === "Awaiting Customer Confirmation" && (
            <button onClick={() => confirmFinalPrice(booking.id)}>
              Confirm Final Price
            </button>
          )}

          {booking.status === "Finished" && (
            <div className="review-box">
              <h3>Rate Your Barber</h3>

              <select
                value={reviewData.rating}
                onChange={(e) =>
                  setReviewData({ ...reviewData, rating: e.target.value })
                }
              >
                <option value="">No Rating</option>
                <option value="1">⭐</option>
                <option value="2">⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
              </select>

              <input
                type="number"
                placeholder="Tip amount optional"
                value={reviewData.tip_amount}
                onChange={(e) =>
                  setReviewData({ ...reviewData, tip_amount: e.target.value })
                }
              />

              <textarea
                placeholder="Comment optional"
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData({ ...reviewData, comment: e.target.value })
                }
              />

              <button onClick={() => submitReview(booking)}>
                Submit Review
              </button>

              <button
                className="secondary"
                onClick={() =>
                  setReviewData({ rating: "", tip_amount: "", comment: "" })
                }
              >
                Skip Review
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default CustomerDashboard;