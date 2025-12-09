import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./components/Home";
import Lista from "./components/Lista";
import Dodaj from "./components/Dodaj";
import Szczegoly from "./components/Szczegoly";

import { contractABI, contractAddress } from "./contract";

function App() {
  const [account, setAccount] = useState(null);
  const [view, setView] = useState("home");
  const [selectedId, setSelectedId] = useState(null);

  const providerRef = useRef(null);
  const signerRef = useRef(null);
  const contractRef = useRef(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Zainstaluj MetaMask!");
      return;
    }

    providerRef.current = new ethers.BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    setAccount(accounts[0]);

    signerRef.current = await providerRef.current.getSigner();
    contractRef.current = new ethers.Contract(
      contractAddress,
      contractABI,
      signerRef.current
    );
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      });

      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
      });

      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid justify-content-center">
          <span 
            className="navbar-brand mb-0 h1 fw-bold" 
            onClick={() => setView("home")}
            style={{ cursor: "pointer" }}
            title="Wróć do strony głównej"
          >
            📝 Tablica Ogłoszeń Web3
          </span>
        </div>
      </nav>

      <div className="flex-grow-1 d-flex flex-column">
        
        {view === "home" && (
          <Home setView={setView} connectWallet={connectWallet} account={account} />
        )}

        {view === "lista" && (
          <div className="container py-4 w-100">
             <Lista setView={setView} setSelectedId={setSelectedId} contractRef={contractRef} />
          </div>
        )}

        {view === "dodaj" && (
          <div className="container py-4 w-100">
            <Dodaj
              setView={setView}
              connectWallet={connectWallet}
              account={account}
              contractRef={contractRef}
            />
          </div>
        )}

        {view === "szczegoly" && (
          <div className="container py-4 w-100">
            <Szczegoly
              id={selectedId}
              setView={setView}
              contractRef={contractRef}
              account={account}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;