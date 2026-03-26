import React from 'react'

function App() {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: '#f4f7f6',
    margin: 0,
    gap: '30px'
  };

  const titleStyle = {
    fontSize: '3rem',
    color: '#2c3e50',
    marginBottom: '10px',
    textAlign: 'center'
  };

  const subTitleStyle = {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    fontWeight: '400'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Pathology Lab Management System</h1>
      <p style={subTitleStyle}>A Professional Sponsored Project by Apeksha, Shami and Priya</p>
    </div>
  )
}

export default App