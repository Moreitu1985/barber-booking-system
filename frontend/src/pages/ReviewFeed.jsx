import { useEffect, useState } from "react";
import axios from "axios";

function ReviewFeed() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/reviews/feed").then((res) => {
      setReviews(res.data);
    });
  }, []);

  return (
    <div className="container">
      <h1>Customer Review Feed</h1>

      {reviews.length === 0 && <p>No reviews yet.</p>}

      {reviews.map((review, index) => (
        <div className="booking-card" key={index}>
          <h3>{review.customer_name}</h3>
          <p><b>Barber:</b> {review.barber_name}</p>

          {review.rating && (
            <p><b>Rating:</b> {"⭐".repeat(review.rating)}</p>
          )}

          {review.comment && (
            <p><b>Comment:</b> {review.comment}</p>
          )}

          {Number(review.tip_amount) > 0 && (
            <p><b>Tip:</b> R{review.tip_amount}</p>
          )}

          <small>{review.created_at}</small>
        </div>
      ))}
    </div>
  );
}

export default ReviewFeed;