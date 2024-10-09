import React from "react";
import { Spinner } from "react-bootstrap";
import "./loading.css";

export default function Loading() {
  return (
    <div className="loadingContainer">
      <Spinner
        animation="border"
        role="status"
        variant="primary"
        className="spinner"
      >
        <span className="sr-only"></span>
      </Spinner>
      <p className="loadingText">Chargement en cours...</p>
    </div>
  );
}
