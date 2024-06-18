import React from "react";

import "./ResetBtn.css";

export default function ResetBtn({ onClick }) {
  return (
    <button className="reset-btn" onClick={onClick}>
      Reset
    </button>
  );
}
