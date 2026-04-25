import { useState } from "react";
import axios from "axios";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/auth/login", formData);

      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "customer") {
        window.location.href = "/customer-dashboard";
      } else if (res.data.user.role === "barber") {
        window.location.href = "/barber-dashboard";
      } else {
        window.location.href = "/admin-dashboard";
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container small">
      <h1>Login</h1>

      {message && <p className="error">{message}</p>}

      <form className="form" onSubmit={login}>
        <input
          placeholder="Email"
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        <button>Login</button>
      </form>

      <div className="login-box">
        <p><b>Customer:</b> customer@gmail.com / 12345</p>
        <p><b>Barber:</b> thabo@barber.com / 12345</p>
        <p><b>Admin:</b> admin@barber.com / 12345</p>
      </div>
    </div>
  );
}

export default Login;