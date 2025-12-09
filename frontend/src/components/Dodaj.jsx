import { useState } from "react";
import { ethers } from "ethers";

export default function Dodaj({ setView, contractRef, connectWallet, account }) {
  const [tekst, setTekst] = useState("");
  const [minimalnaKwota, setMinimalnaKwota] = useState(""); 
  const [czasTrwania, setCzasTrwania] = useState(60);

  const submit = async () => {
    if (!account) {
      await connectWallet();
    }

    if (parseFloat(minimalnaKwota) <= 0) {
      alert("Minimalna kwota musi być większa niż 0!");
      return; 
    }

    if (parseInt(czasTrwania) <= 0) {
      alert("Czas trwania musi być dodatni!");
      return;
    }

    try {
      const czasWSekundach = parseInt(czasTrwania) * 60;

      const tx = await contractRef.current.dodajOgloszenie(
        tekst, 
        ethers.parseEther(minimalnaKwota),
        czasWSekundach
      );
      
      await tx.wait();
      alert("Dodano ogłoszenie!");
      setView("home");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas dodawania ogłoszenia.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center flex-grow-1">
      <div className="container" style={{ maxWidth: '500px' }}>
        
        <div className="card shadow-lg border-0 rounded-3">
          
          {/* NAGŁÓWEK KARTY */}
          <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
            <h4 className="fw-bold text-dark mb-0">📝 Nowe ogłoszenie</h4>
            <button 
              onClick={() => setView("home")} 
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            >
              ⬅ Powrót
            </button>
          </div>

          {/* TREŚĆ FORMULARZA */}
          <div className="card-body p-4">
            
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">TREŚĆ OGŁOSZENIA</label>
              <textarea
                className="form-control bg-light border-0"
                rows="4"
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                placeholder="Co chcesz sprzedać lub ogłosić?"
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted small">CENA STARTOWA</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={minimalnaKwota}
                    onChange={(e) => setMinimalnaKwota(e.target.value)}
                    min="0"
                    step="0.001"
                    placeholder="0.00"
                  />
                  <span className="input-group-text bg-white text-muted">ETH</span>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted small">CZAS TRWANIA</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={czasTrwania}
                    onChange={(e) => setCzasTrwania(e.target.value)}
                    min="1"
                    placeholder="60"
                  />
                  <span className="input-group-text bg-white text-muted">min</span>
                </div>
              </div>
            </div>

            <div className="d-grid">
              <button 
                onClick={submit} 
                className="btn btn-primary btn-lg shadow-sm fw-bold"
              >
                Dodaj na Blockchain 🚀
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}