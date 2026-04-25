import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Booking from "./pages/Booking";
import CustomerDashboard from "./pages/CustomerDashboard";
import BarberDashboard from "./pages/BarberDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewFeed from "./pages/ReviewFeed";
import Catalogue from "./pages/Catalogue";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      <nav className="navbar">
  <h2>IPS CUTS</h2>

  <div>
    <Link to="/">Home</Link>

    {user?.role === "customer" && <Link to="/catalogue">Catalogue</Link>}
    {user?.role === "customer" && <Link to="/booking">Book</Link>}
    {user?.role === "customer" && <Link to="/customer-dashboard">My Bookings</Link>}

    {user?.role === "barber" && <Link to="/barber-dashboard">Barber</Link>}
    {user?.role === "admin" && <Link to="/admin-dashboard">Admin</Link>}

    <Link to="/reviews">Reviews</Link>

    {!user && <Link to="/login">Login</Link>}
    {!user && <Link to="/register">Create Account</Link>}

    {user && <button onClick={logout}>Logout</button>}
  </div>
</nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reviews" element={<ReviewFeed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/barber-dashboard" element={<BarberDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/catalogue" element={<Catalogue />} />
      </Routes>
    </>
  );
}

export default App;