import { useEffect, useState } from "react";
import axios from "axios";

function Booking() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    customer_id: user?.id,
    barber_id: "",
    service_id: "",
    booking_date: "",
    booking_time: "",
    booking_type: "In-house",
    payment_method: "Cash",
    customer_location: "",
    distance_km: ""
  });

  useEffect(() => {
    axios.get("http://localhost:5000/services").then((res) => setServices(res.data));
    axios.get("http://localhost:5000/barbers").then((res) => setBarbers(res.data));
  }, []);

  const selectedService = services.find(
    (service) => service.id === Number(formData.service_id)
  );

  const bookingFee = 20;
  const travelFee = formData.booking_type === "House Call" ? 50 : 0;
  const estimatedTotal = selectedService
    ? Number(selectedService.fixed_price) + bookingFee + travelFee
    : 0;

  const estimatedMinutes = selectedService
    ? formData.booking_type === "House Call"
      ? Number(selectedService.duration_minutes) + 30
      : Number(selectedService.duration_minutes)
    : 0;

  const submitBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("Please login first");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/bookings", formData);
      alert(
  `${res.data.message}\n\nEstimated Total: R${res.data.customerRequestedTotal}\n\nThe barber will review your request.`
);

window.location.href = "/customer-dashboard";
    } catch (err) {
      setMessage(err.response?.data?.message || "Booking failed");
    }
  };

  if (!user) {
    return <div className="container">Please login to book.</div>;
  }

  return (
    <div className="container">
      <h1>Book a Service</h1>

      {message && <p className="message">{message}</p>}

      <form className="form" onSubmit={submitBooking}>
        <label>Choose Service</label>
        <select
          value={formData.service_id}
          onChange={(e) =>
            setFormData({ ...formData, service_id: e.target.value })
          }
        >
          <option value="">Select Service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - R{service.fixed_price} - {service.duration_minutes} mins
            </option>
          ))}
        </select>

        <label>Choose Barber</label>
        <select
          value={formData.barber_id}
          onChange={(e) =>
            setFormData({ ...formData, barber_id: e.target.value })
          }
        >
          <option value="">Select Barber</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name} | {barber.specialty} | {barber.location} | {barber.current_status}
            </option>
          ))}
        </select>

        <label>Booking Type</label>
        <select
          value={formData.booking_type}
          onChange={(e) =>
            setFormData({ ...formData, booking_type: e.target.value })
          }
        >
          <option value="In-house">In-house</option>
          <option value="House Call">House Call</option>
        </select>

        {formData.booking_type === "House Call" && (
          <>
            <input
              placeholder="Your location / area"
              value={formData.customer_location}
              onChange={(e) =>
                setFormData({ ...formData, customer_location: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Estimated distance in KM"
              value={formData.distance_km}
              onChange={(e) =>
                setFormData({ ...formData, distance_km: e.target.value })
              }
            />
          </>
        )}

        <label>Payment Method</label>
        <select
          value={formData.payment_method}
          onChange={(e) =>
            setFormData({ ...formData, payment_method: e.target.value })
          }
        >
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
        </select>

        <label>Date</label>
        <input
          type="date"
          value={formData.booking_date}
          onChange={(e) =>
            setFormData({ ...formData, booking_date: e.target.value })
          }
        />

        <label>Time</label>
        <input
          type="time"
          value={formData.booking_time}
          onChange={(e) =>
            setFormData({ ...formData, booking_time: e.target.value })
          }
        />

        <div className="summary-box">
          <h3>Estimated Price</h3>
          <p>Service Fee: R{selectedService?.fixed_price || 0}</p>
          <p>Booking Fee: R{bookingFee}</p>
          <p>Travel Fee: R{travelFee}</p>
          <p>Estimated Time: {estimatedMinutes} minutes</p>
          <h2>Total: R{estimatedTotal}</h2>
          <small>
            Final price may change if the barber adds an extra charge or discount.
          </small>
        </div>

        <button>Send Booking Request</button>
      </form>
    </div>
  );
}

export default Booking;