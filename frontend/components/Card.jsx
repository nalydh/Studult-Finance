import React from "react";

function Card({ title, description, value, icon, goal, colour }) {
  const percentage = goal ? Math.round((value / goal) * 100) : null;

  return (
    <div className={`${colour} rounded-xl p-4 shadow border text-center`}>
      <div className="flex justify-center text-3xl">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-2xl text-primary font-semibold">${value}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {goal && (
        <div className="w-full bg-gray-200 h-2 rounded mt-2">
          <div
            className="bg-primary h-2 rounded"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default Card;
