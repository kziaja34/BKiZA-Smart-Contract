import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Lista({ setView, setSelectedId, contractRef, account }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (!contractRef.current) {
        setLoading(false);
        return;
      }

      const totalBigInt = await contractRef.current.licznik();
      const total = Number(totalBigInt); 
      console.log("Liczba ogłoszeń:", total);

      if (total === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const arr = [];
      for (let i = 1; i <= total; i++) {
        const og = await contractRef.current.pobierz(i);
        
        if (og[0] !== ethers.ZeroAddress) {
            arr.push({
                id: i,
                autor: og[0],
                tresc: og[1],
                bid: og[2], 
                minimalnaKwota: ethers.formatEther(og[4]), 
                deadline: Number(og[5])
            });
        }
      }

      setItems(arr);
    } catch (error) {
      console.error("Błąd podczas ładowania ogłoszeń:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractRef.current) {
        load();
    }
  }, [contractRef, account, setView]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Ładowanie...</span>
        </div>
        <p className="mt-2 text-muted">Pobieranie ogłoszeń z blockchaina...</p>
      </div>
    );
  }

  return (
    <div className="w-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark mb-0">📋 Lista ogłoszeń</h2>
        <button 
          onClick={() => setView("home")}
          className="btn btn-outline-secondary rounded-pill px-4"
        >
          ⬅ Powrót
        </button>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info text-center shadow-sm" role="alert">
          📭 Brak aktywnych ogłoszeń. Bądź pierwszy i dodaj coś!
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {items.map((i) => (
            <div key={i.id} className="col">
              <div
                className="card h-100 shadow-sm border-0 hover-shadow transition-all"
                style={{ cursor: "pointer", transition: "transform 0.2s" }}
                onClick={() => {
                  setSelectedId(i.id);
                  setView("szczegoly");
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 pb-0">
                  <span className="badge bg-light text-dark border border-secondary">
                    #{i.id}
                  </span>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    📅 {new Date(i.deadline * 1000).toLocaleDateString()} 
                    {' '} {new Date(i.deadline * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </small>
                </div>

                <div className="card-body">
                  <h5 className="card-title fw-bold text-dark text-truncate-2-lines" style={{ minHeight: '3rem' }}>
                    {i.tresc.length > 50 ? i.tresc.substring(0, 50) + "..." : i.tresc}
                  </h5>
                  
                  <hr className="my-3 text-muted opacity-25"/>

                  <div className="d-flex justify-content-between align-items-end">
                    <div>
                      <p className="card-text text-muted mb-0 small">Aktualna oferta:</p>
                      <p className="card-text fw-bold text-primary fs-5 mb-0">
                        {ethers.formatEther(i.bid)} <span className="fs-6 text-dark">ETH</span>
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="card-text text-muted mb-0 small">Start:</p>
                      <p className="card-text fw-semibold mb-0">
                        {i.minimalnaKwota} ETH
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card-footer bg-light border-0 py-3">
                  <div className="d-grid">
                    <button className="btn btn-outline-primary btn-sm rounded-pill fw-semibold">
                      Zobacz szczegóły 🔍
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}