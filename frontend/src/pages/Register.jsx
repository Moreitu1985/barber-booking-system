import { useState } from "react";
import axios from "axios";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const register = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/auth/register", formData);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container small">
      <h1>Create Account</h1>

      {message && <p className="message">{message}</p>}

      <form className="form" onSubmit={register}>
        <input
          placeholder="Full Name"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
        />

        <input
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        <button>Create Account</button>
      </form>
    </div>
  );
}

export default Register;