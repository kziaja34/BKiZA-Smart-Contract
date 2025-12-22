import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../contract"; 

export default function Home({ setView, connectWallet, account, contractRef }) {
  const [pendingAmount, setPendingAmount] = useState("0");

  const checkPendingReturns = async () => {
    let contract = contractRef.current;

    if (!contract && window.ethereum && account) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            contract = new ethers.Contract(contractAddress, contractABI, provider);
        } catch (e) {
            console.error("Błąd tworzenia tymczasowego kontraktu:", e);
        }
    }

    if (account && contract) {
      try {
        const zwrot = await contract.oczekujaceZwroty(account);
        console.log("Znaleziono zwrot:", ethers.formatEther(zwrot));
        setPendingAmount(ethers.formatEther(zwrot));
      } catch (error) {
        console.error("Błąd sprawdzania zwrotów:", error);
      }
    }
  };

  const withdraw = async () => {
    if (!contractRef.current) {
        alert("Poczekaj chwilę na pełne połączenie z portfelem...");
        return;
    }
    
    try {
      const tx = await contractRef.current.odbierzZwrot();
      await tx.wait();
      alert("Środki wypłacone pomyślnie! 💰");
      setPendingAmount("0");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas wypłaty.");
    }
  };

  useEffect(() => {
    checkPendingReturns();
  }, [account, contractRef]);

  const formatAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  return (
    <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center gap-4">
      
      {parseFloat(pendingAmount) > 0 && (
         <div className="container" style={{ maxWidth: '400px' }}>
           <div className="alert alert-warning shadow-lg border-warning d-flex flex-column align-items-center text-center animation-fade-in">
             <h4 className="alert-heading fw-bold">💰 Masz zwrot!</h4>
             <p className="mb-2">Ktoś przebił Twoje oferty. Masz do odebrania:</p>
             <h3 className="fw-bold text-dark display-6">{pendingAmount} ETH</h3>
             <button 
               onClick={withdraw} 
               className="btn btn-dark fw-bold w-100 mt-3"
             >
               Wypłać teraz na portfel
             </button>
           </div>
         </div>
      )}

      <div className="container" style={{ maxWidth: '400px' }}>
        <div className="card shadow-lg border-0 rounded-3">
          
          <div className="card-header bg-white border-bottom-0 pt-4 pb-0 text-center">
            {!account ? (
              <div>
                <p className="text-muted mb-3">Nie jesteś połączony</p>
                <button 
                  onClick={connectWallet} 
                  className="btn btn-warning text-white fw-bold rounded-pill px-4 shadow-sm"
                >
                  🦊 Połącz z MetaMask
                </button>
              </div>
            ) : (
              <div>
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 mb-2">
                  ● Połączono
                </span>
                <h5 className="font-monospace mt-2 text-dark">
                  {formatAddress(account)}
                </h5>
              </div>
            )}
          </div>

          <div className="card-body p-4">
            <div className="d-grid gap-3">
              <button 
                onClick={() => setView("dodaj")} 
                className="btn btn-primary btn-lg shadow-sm"
              >
                ➕ Dodaj ogłoszenie
              </button>

              <button 
                onClick={() => setView("lista")} 
                className="btn btn-outline-secondary btn-lg"
              >
                📄 Przeglądaj ogłoszenia
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}