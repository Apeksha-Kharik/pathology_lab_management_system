import React, { useEffect, useState } from "react";

function Reports() {

  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/my-reports/${localStorage.getItem("userId")}`)
      .then(res => res.json())
      .then(setReports);
  }, []);

  return (
    <div>
      <h2 className="text-2xl mb-5">Reports 📄</h2>

      {reports.length === 0 ? (
        <p>No reports available</p>
      ) : (
        reports.map((r, index) => (
          <div key={index} className="bg-white/20 p-4 mb-3 rounded-xl">
            <a
              href={r.reportUrl}
              target="_blank"
              className="text-blue-300 underline"
            >
              View Report {index + 1}
            </a>
          </div>
        ))
      )}
    </div>
  );
}

export default Reports;