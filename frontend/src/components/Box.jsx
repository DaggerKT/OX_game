import React from "react";

// Css
import "./Box.css";

export default function Box({ value, onClick }) {
  const textColors = {
    X: "blue",
    O: "red",
  };
  return (
    <button
      className="box"
      onClick={onClick}
      style={{ color: textColors[value] }}
    >
      {value}
    </button>
  );
}
