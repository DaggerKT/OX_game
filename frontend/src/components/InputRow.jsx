import React from "react";

import "./InputRow.css";

export default function InputRow({ value, onChange, onClick }) {
  return (
    <div
        className="input-row-container"
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}
    >
      <input className="input-row" type="number" value={value} onChange={onChange} />
      <button className="btn-input-row" onClick={onClick}>
        Submin
      </button>
    </div>
  );
}
