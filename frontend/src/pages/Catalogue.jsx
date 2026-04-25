import { useEffect, useState } from "react";
import axios from "axios";

function Catalogue() {
  const [services, setServices] = useState([]);

  const catalogueImages = [
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6"
  ];

  useEffect(() => {
    axios.get("http://localhost:5000/services").then((res) => {
      setServices(res.data);
    });
  }, []);

  return (
    <div className="shop-page">
      <div className="shop-header">
        <p>SHOP BY SERVICE</p>
        <h1>Catalogue</h1>
        <span>Choose your look before booking.</span>
      </div>

      <div className="product-grid">
        {services.map((service, index) => (
          <div className="product-card" key={service.id}>
            <img
              src={catalogueImages[index % catalogueImages.length]}
              alt={service.name}
            />

            <div className="product-info">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <h4>R {service.fixed_price}</h4>
              <small>{service.duration_minutes} minutes</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalogue;