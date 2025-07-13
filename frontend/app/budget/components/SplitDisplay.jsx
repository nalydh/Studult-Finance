import React from "react";

function SplitDisplay({ data }) {
  return (
    <div>
      <h2>Savings Split Breakdown</h2>
      {Object.entries(data).map(([key, value]) => (
        <p key={key}>
          {key.charAt(0).toUpperCase() + key.slice(1) + ": " + value}
        </p>
      ))}
    </div>
  );
}

export default SplitDisplay;
