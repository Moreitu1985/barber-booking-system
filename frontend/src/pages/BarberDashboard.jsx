import { useEffect, useState } from "react";
import axios from "axios";

function BarberDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [barber, setBarber] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [unavailable, setUnavailable] = useState({
    unavailable_date: "",
    start_time: "",
    end_time: "",
    reason: ""
  });

  const [statusData, setStatusData] = useState({
    current_status: "In-house",
    house_call_available: true
  });

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    fixed_price: "",
    duration_minutes: ""
  });

  const [priceInputs, setPriceInputs] = useState({});

  const loadBarber = async () => {
    const res = await axios.get(`http://localhost:5000/barbers/by-user/${user.id}`);
    setBarber(res.data);

    setStatusData({
      current_status: res.data.current_status,
      house_call_available: Boolean(res.data.house_call_available)
    });

    loadBookings(res.data.id);
  };

  const loadBookings = async (barberId) => {
    const res = await axios.get(`http://localhost:5000/barbers/${barberId}/bookings`);
    setBookings(res.data);
  };

  useEffect(() => {
    loadBarber();
  }, []);

  const requests = bookings.filter(
    (booking) => booking.status === "Pending Barber Approval"
  );

  const confirmedBookings = bookings.filter(
    (booking) => booking.status !== "Pending Barber Approval"
  );

  const updateStatus = async () => {
    const res = await axios.put(
      `http://localhost:5000/barbers/${barber.id}/status`,
      statusData
    );

    alert(res.data.message);
    loadBarber();
  };

  const addUnavailableSlot = async (e) => {
    e.preventDefault();

    const res = await axios.post("http://localhost:5000/barbers/unavailable", {
      barber_id: barber.id,
      ...unavailable
    });

    alert(res.data.message);

    setUnavailable({
      unavailable_date: "",
      start_time: "",
      end_time: "",
      reason: ""
    });
  };

  const addService = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/services", newService);
      alert(res.data.message);

      setNewService({
        name: "",
        description: "",
        fixed_price: "",
        duration_minutes: ""
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add service");
    }
  };

  const respondToBooking = async (bookingId, action) => {
    const input = priceInputs[bookingId] || {};

    try {
      const res = await axios.put(
        `http://localhost:5000/bookings/${bookingId}/barber-response`,
        {
          action,
          barber_extra_charge: input.barber_extra_charge || 0,
          barber_discount: input.barber_discount || 0,
          barber_reason: input.barber_reason || ""
        }
      );

      alert(res.data.message);
      loadBookings(barber.id);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const finishBooking = async (bookingId) => {
    try {
      const res = await axios.put(`http://localhost:5000/bookings/${bookingId}/finish`);
      alert(res.data.message);
      loadBookings(barber.id);
    } catch (err) {
      alert(err.response?.data?.message || "Could not finish booking");
    }
  };

  const handlePriceInput = (bookingId, field, value) => {
    setPriceInputs({
      ...priceInputs,
      [bookingId]: {
        ...priceInputs[bookingId],
        [field]: value
      }
    });
  };

  if (!barber) {
    return <div className="container">Loading barber dashboard...</div>;
  }

  return (
    <div className="container">
      <h1>Barber Dashboard</h1>

      <div className="dashboard-cards">
        <div className="stat-card">
          <h3>New Requests</h3>
          <p>{requests.length}</p>
        </div>

        <div className="stat-card">
          <h3>My Status</h3>
          <p>{barber.current_status}</p>
        </div>

        <div className="stat-card">
          <h3>Location</h3>
          <p>{barber.location}</p>
        </div>
      </div>

      {/* PRIORITY SECTION FIRST */}
      <h2>New Booking Requests</h2>

      {requests.length === 0 && (
        <p className="message">No new booking requests right now.</p>
      )}

      {requests.map((booking) => (
        <div className="booking-card request-card" key={booking.id}>
          <h3>{booking.service_name}</h3>

          <p><b>Customer:</b> {booking.customer_name}</p>
          <p><b>Date:</b> {booking.booking_date}</p>
          <p><b>Time:</b> {booking.booking_time}</p>
          <p><b>Type:</b> {booking.booking_type}</p>
          <p><b>Payment:</b> {booking.payment_method}</p>

          {booking.booking_type === "House Call" && (
            <>
              <p><b>Customer Location:</b> {booking.customer_location}</p>
              <p><b>Distance:</b> {booking.distance_km} km</p>
            </>
          )}

          <div className="summary-box">
            <p>Fixed Price: R{booking.fixed_service_price}</p>
            <p>Booking Fee: R{booking.booking_fee}</p>
            <p>Travel Fee: R{booking.travel_fee}</p>
            <p>Estimated Time: {booking.estimated_minutes} minutes</p>
            <h3>Customer Offer: R{booking.customer_requested_total}</h3>
          </div>

          <div className="price-box">
            <input
              type="number"
              placeholder="Extra charge if needed"
              onChange={(e) =>
                handlePriceInput(booking.id, "barber_extra_charge", e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Discount if you want"
              onChange={(e) =>
                handlePriceInput(booking.id, "barber_discount", e.target.value)
              }
            />

            <input
              placeholder="Reason for price change"
              onChange={(e) =>
                handlePriceInput(booking.id, "barber_reason", e.target.value)
              }
            />

            <button onClick={() => respondToBooking(booking.id, "accept")}>
              Accept / Send Offer
            </button>

            <button
              className="delete"
              onClick={() => respondToBooking(booking.id, "reject")}
            >
              Reject Request
            </button>
          </div>
        </div>
      ))}

      {/* SERVICE MANAGEMENT */}
      <h2>Add New Service</h2>

      <form className="form" onSubmit={addService}>
        <input
          placeholder="Service name e.g. Chiskop"
          value={newService.name}
          onChange={(e) =>
            setNewService({ ...newService, name: e.target.value })
          }
        />

        <input
          placeholder="Description"
          value={newService.description}
          onChange={(e) =>
            setNewService({ ...newService, description: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Price e.g. 80"
          value={newService.fixed_price}
          onChange={(e) =>
            setNewService({ ...newService, fixed_price: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Time in minutes e.g. 30"
          value={newService.duration_minutes}
          onChange={(e) =>
            setNewService({ ...newService, duration_minutes: e.target.value })
          }
        />

        <button>Add Service</button>
      </form>

      {/* STATUS */}
      <h2>Update Availability Status</h2>

      <div className="form">
        <select
          value={statusData.current_status}
          onChange={(e) =>
            setStatusData({ ...statusData, current_status: e.target.value })
          }
        >
          <option value="In-house">In-house</option>
          <option value="House Call">House Call</option>
          <option value="Unavailable">Unavailable</option>
        </select>

        <select
          value={statusData.house_call_available ? "true" : "false"}
          onChange={(e) =>
            setStatusData({
              ...statusData,
              house_call_available: e.target.value === "true"
            })
          }
        >
          <option value="true">House Call Available</option>
          <option value="false">House Call Not Available</option>
        </select>

        <button onClick={updateStatus}>Update Status</button>
      </div>

      {/* UNAVAILABLE */}
      <h2>Choose Unavailable Time</h2>

      <form className="form" onSubmit={addUnavailableSlot}>
        <input
          type="date"
          value={unavailable.unavailable_date}
          onChange={(e) =>
            setUnavailable({ ...unavailable, unavailable_date: e.target.value })
          }
        />

        <input
          type="time"
          value={unavailable.start_time}
          onChange={(e) =>
            setUnavailable({ ...unavailable, start_time: e.target.value })
          }
        />

        <input
          type="time"
          value={unavailable.end_time}
          onChange={(e) =>
            setUnavailable({ ...unavailable, end_time: e.target.value })
          }
        />

        <input
          placeholder="Reason"
          value={unavailable.reason}
          onChange={(e) =>
            setUnavailable({ ...unavailable, reason: e.target.value })
          }
        />

        <button>Add Unavailable Slot</button>
      </form>

      {/* CALENDAR */}
      <h2>Booking Calendar</h2>

      {confirmedBookings.map((booking) => (
        <div className="booking-card" key={booking.id}>
          <h3>{booking.service_name}</h3>

          <p><b>Customer:</b> {booking.customer_name}</p>
          <p><b>Date:</b> {booking.booking_date}</p>
          <p><b>Time:</b> {booking.booking_time}</p>
          <p><b>Type:</b> {booking.booking_type}</p>
          <p><b>Status:</b> {booking.status}</p>

          <div className="summary-box">
            <p>Final Total: R{booking.barber_final_total || booking.customer_requested_total}</p>
            <p>Estimated Time: {booking.estimated_minutes} minutes</p>
          </div>

          {booking.status === "Confirmed" && (
            <button onClick={() => finishBooking(booking.id)}>
              Mark as Finished
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default BarberDashboard;