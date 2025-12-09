import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function Szczegoly({ id, setView, contractRef, account }) {
  const [item, setItem] = useState(null);
  const [bid, setBid] = useState("0.001");
  const [pendingReturn, setPendingReturn] = useState(0); 
  const [hasReceivedFunds, setHasReceivedFunds] = useState(false); 

  const load = async () => {
    try {
      const og = await contractRef.current.pobierz(id);
      
      const deadlineTimestamp = Number(og[5]);
      const dataKonca = new Date(deadlineTimestamp * 1000);
      const czyZakonczona = Date.now() > dataKonca.getTime();

      setItem({
        autor: og[0],
        tresc: og[1],
        highestBid: og[2], 
        highestBidder: og[3],
        minimalnaKwota: ethers.formatEther(og[4]),
        deadline: deadlineTimestamp,
        dataKoncaString: dataKonca.toLocaleString(),
        czyZakonczona: czyZakonczona
      });

      if (account) {
          const zwrot = await contractRef.current.oczekujaceZwroty(account);
          setPendingReturn(ethers.formatEther(zwrot)); 
      }
    } catch (error) {
      console.error("Błąd ładowania szczegółów:", error);
    }
  };

  const zalicytuj = async () => {
    if (item.czyZakonczona) {
        alert("Aukcja już się zakończyła!");
        return;
    }
    try {
      const tx = await contractRef.current.zalicytuj(id, {
        value: ethers.parseEther(bid)
      });
      await tx.wait();
      await load();
      alert("Nowa oferta została złożona!");
    } catch (error) {
      console.error(error);
      if (error.message.includes("Autor ogloszenia nie moze licytowac")) {
        alert("Autor ogłoszenia nie może licytować");
      } else if (error.message.includes("Za mala oferta")) {
        alert("Za mała oferta (musi być większa niż obecna)");
      } else if (error.message.includes("Aukcja juz sie zakonczyla")) {
        alert("Czas minął!");
      } else {
        alert("Wystąpił błąd transakcji");
      }
    }
  };

  const wyplac = async () => {
    try {
      const tx = await contractRef.current.wyplacWygrana(id);
      await tx.wait();
      alert("Wypłacono środki i zamknięto aukcję!");
      setView("lista"); 
    } catch (error) {
      console.error(error);
      if (error.message.includes("Nie jestes autorem")) {
        alert("Nie jesteś autorem ogłoszenia");
      } else if (error.message.includes("Aukcja jeszcze trwa")) {
        alert("Nie możesz wypłacić przed końcem czasu!");
      } else if (error.message.includes("Brak srodkow")) {
        alert("Brak ofert do wypłaty");
      } else {
        alert("Wypłata nie powiodła się");
      }
    }
  }

  const odbierzZwrot = async () => {
    try {
      const tx = await contractRef.current.odbierzZwrot();
      await tx.wait();
      alert("Środki zostały zwrócone na portfel!");
      setHasReceivedFunds(true);
      await load();
    } catch (error) {
      alert("Błąd zwrotu środków");
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [account, id]);

  if (!item) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-2 text-muted">Ładowanie szczegółów aukcji...</p>
    </div>
  );

  return (
    <div className="d-flex justify-content-center w-100">
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div className="card shadow-lg border-0 rounded-3 overflow-hidden">
          
          <div className="card-header bg-white border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-1">🔍 Aukcja #{id}</h4>
              <span className="text-muted small font-monospace">Autor: {item.autor.slice(0,6)}...{item.autor.slice(-4)}</span>
            </div>
            <button 
              onClick={() => setView("lista")} 
              className="btn btn-outline-secondary rounded-pill px-3 btn-sm"
            >
              ⬅ Wróć do listy
            </button>
          </div>

          <div className="card-body p-4">
            
            <div className={`alert ${item.czyZakonczona ? 'alert-danger' : 'alert-success'} d-flex justify-content-between align-items-center shadow-sm`}>
              <div>
                <strong>Status: </strong> 
                {item.czyZakonczona ? 'ZAKOŃCZONA 🔒' : 'TRWA LICYTACJA 🟢'}
              </div>
              <div className="text-end">
                <small>Koniec:</small><br/>
                <strong>{item.dataKoncaString}</strong>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-muted small fw-bold text-uppercase">Treść ogłoszenia</label>
              <p className="fs-5 mt-1">{item.tresc}</p>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <small className="text-muted d-block mb-1">Cena minimalna</small>
                  <span className="fw-bold fs-5 text-dark">{item.minimalnaKwota} ETH</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border border-primary bg-opacity-10">
                  <small className="text-primary d-block mb-1">Aktualna najwyższa oferta 🏆</small>
                  <span className="fw-bold fs-4 text-primary">{ethers.formatEther(item.highestBid)} ETH</span>
                  <div className="small text-muted mt-1 font-monospace">
                    Licytant: {item.highestBidder === ethers.ZeroAddress ? "Brak ofert" : `${item.highestBidder.slice(0,6)}...${item.highestBidder.slice(-4)}`}
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4"/>

            {item.autor.toLowerCase() !== account?.toLowerCase() && (
              <div className="mb-3">
                <h5 className="fw-bold mb-3">💰 Złóż ofertę</h5>
                {!item.czyZakonczona ? (
                   <div className="input-group input-group-lg">
                      <input
                          type="number"
                          className="form-control"
                          value={bid}
                          onChange={(e) => setBid(e.target.value)}
                          placeholder="Kwota ETH"
                          step="0.001"
                      />
                      <span className="input-group-text">ETH</span>
                      <button onClick={zalicytuj} className="btn btn-primary px-4 fw-bold">
                        Przebij ofertę 🚀
                      </button>
                   </div>
                ) : (
                    <div className="alert alert-secondary">Licytacja została zamknięta. Nie można już składać ofert.</div>
                )}
              </div>
            )}

            {account?.toLowerCase() === item.autor.toLowerCase() && (
              <div className="mb-3 p-3 border border-warning rounded-3 bg-warning bg-opacity-10">
                <h5 className="fw-bold text-dark">🛠 Panel Autora</h5>
                {item.czyZakonczona ? (
                   <div>
                     <p className="mb-2">Aukcja zakończona. Możesz wypłacić środki.</p>
                     <button onClick={wyplac} className="btn btn-warning text-dark fw-bold w-100">
                       💸 Wypłać najwyższą ofertę i zamknij
                     </button>
                   </div>
                ) : (
                   <p className="mb-0 text-muted">Aukcja trwa. Będziesz mógł wypłacić środki po: <b>{item.dataKoncaString}</b></p>
                )}
              </div>
            )}

            {!hasReceivedFunds && parseFloat(pendingReturn) > 0 && (
              <div className="mt-4 alert alert-warning shadow-sm border-warning">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="alert-heading fw-bold mb-1">💵 Zwrot środków!</h5>
                    <p className="mb-0">Ktoś przebił Twoją ofertę. Masz do odebrania: <strong>{pendingReturn} ETH</strong></p>
                  </div>
                  <button onClick={odbierzZwrot} className="btn btn-dark fw-bold">
                    Odbierz zwrot na portfel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}