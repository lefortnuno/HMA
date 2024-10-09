import React from "react";
import "./loadingTable.css";

export default function LoadingTable() {
  return (
    <tr>
      <td colSpan="10" className="loadingRow"> 
            <div className="loadingLight"></div>
            <div className="loadingCell">Chargement des données...</div>
      </td>
    </tr>
  );
}
