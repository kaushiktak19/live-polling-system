import React from "react";
import { useNavigate } from "react-router-dom";
import stars from "../../assets/spark.svg";
import "./KickedOutPage.css";

const KickedOutPage = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate("/");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="kicked-out-container text-center">
        <button className="btn btn-sm intervue-btn mb-5">
          <img src={stars} className="px-1" alt="" />
          Intervue Poll
        </button>
        
        <div className="kicked-out-content">
          <h1 className="kicked-out-title">
            You've been Kicked out !
          </h1>
          <p className="kicked-out-message">
            Looks like the teacher had removed you from the poll system. Please Try again sometime.
          </p>
        </div>

        <button className="btn try-again-btn" onClick={handleTryAgain}>
          Try Again
        </button>
      </div>
    </div>
  );
};

export default KickedOutPage;
