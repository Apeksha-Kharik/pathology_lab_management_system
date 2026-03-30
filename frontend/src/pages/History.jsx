import React, { useEffect, useState } from "react";

function History() {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/my-bookings/${localStorage.getItem("userId")}`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-2xl mb-5">History 📊</h2>

      <div className="grid gap-4">
        {data.map((item, index) => (
          <div key={index} className="bg-white/20 p-4 rounded-xl shadow">
            <p className="font-bold text-lg">{item.testName}</p>
            <p>Status: {item.status}</p>
            <p>Date: {item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;