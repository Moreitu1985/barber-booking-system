import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [barberStats, setBarberStats] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/dashboard/stats").then((res) => {
      setStats(res.data);
    });

    axios.get("http://localhost:5000/dashboard/monthly-barber-stats").then((res) => {
      setBarberStats(res.data);
    });
  }, []);


  const [newService, setNewService] = useState({
  name: "",
  description: "",
  fixed_price: "",
  duration_minutes: ""
});

const addService = async (e) => {
  e.preventDefault();

  const res = await axios.post("http://localhost:5000/services", newService);
  alert(res.data.message);

  setNewService({
    name: "",
    description: "",
    fixed_price: "",
    duration_minutes: ""
  });
};

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-cards">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{stats.total_bookings || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Finished Cuts</h3>
          <p>{stats.finished_cuts || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Weekly Revenue</h3>
          <p>R{stats.weekly_revenue || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <p>R{stats.monthly_revenue || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Weekly People</h3>
          <p>{stats.weekly_customers || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Monthly People</h3>
          <p>{stats.monthly_customers || 0}</p>
        </div>
      </div>


<h2>Add New Service</h2>

<form className="form" onSubmit={addService}>
  <input
    placeholder="Service name"
    value={newService.name}
    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
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
    placeholder="Price"
    value={newService.fixed_price}
    onChange={(e) =>
      setNewService({ ...newService, fixed_price: e.target.value })
    }
  />

  <input
    type="number"
    placeholder="Time in minutes"
    value={newService.duration_minutes}
    onChange={(e) =>
      setNewService({ ...newService, duration_minutes: e.target.value })
    }
  />

  <button>Add Service</button>
</form>
      <h2>Monthly Barber Performance</h2>

      <table>
        <thead>
          <tr>
            <th>Barber</th>
            <th>Total Bookings</th>
            <th>Total Revenue</th>
          </tr>
        </thead>

        <tbody>
          {barberStats.map((item, index) => (
            <tr key={index}>
              <td>{item.barber_name}</td>
              <td>{item.total_bookings}</td>
              <td>R{item.total_revenue || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;