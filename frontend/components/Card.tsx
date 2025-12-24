/*
Card Component:
  A reusable card component to display financial data with 
  optional icon, goal progress, and split badge.
*/

import React from "react";

interface CardProps {
  title?: string;
  description?: string;
  value?: number;
  icon?: React.ReactNode;
  goal?: number;
  colour?: string;
  split?: string;
}

function Card({ title, description, value, icon, goal, colour, split }: CardProps) {
  const percentage = goal ? Math.round((value / goal) * 100) : null;

  return (
    <div
      className={`rounded p-4 shadow border text-center flex flex-col items-center ${colour}`}
    >
      {/* Top row: badge */}
      {split && (
        <div className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full shadow self-start">
          {split}
        </div>
      )}

      {/* Icon */}
      <div className="text-3xl">{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-bold">{title}</h3>

      {/* Value */}
      <p className="text-2xl text-primary font-semibold font-mono">
        $
        {Number.isFinite(value) ? value.toFixed(2) : "0.00"}
      </p>

      {/* Description */}
      {description && <p className="text-sm text-gray-500">{description}</p>}

      {/* Optional goal progress bar */}
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
