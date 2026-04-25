import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <section className="hero">
        <h1>FreshCut Barber Booking</h1>
        <p>
          Book in-house cuts or house calls with professional barbers near you.
        </p>
        <Link className="btn" to="/booking">Book Now</Link>
      </section>

      <section className="section">
        <h2>How It Works</h2>

        <div className="cards">
          <div className="card">
            <h3>1. Choose Service</h3>
            <p>Select haircut, fade, beard trim, or combo service.</p>
          </div>

          <div className="card">
            <h3>2. Send Booking</h3>
            <p>Choose barber, payment method, and in-house or house call.</p>
          </div>

          <div className="card">
            <h3>3. Barber Confirms</h3>
            <p>The barber accepts, rejects, or sends a final price offer.</p>
          </div>

          <div className="card">
            <h3>4. Review</h3>
            <p>After the cut, rate, tip, or leave a comment if you want.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;