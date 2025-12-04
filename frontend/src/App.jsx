import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

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

  // ------------------- Synchronizacja portfela -------------------

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

  // automatyczne przechwycenie istniejącego połączenia
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      });

      // zmiana konta
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
      });

      // zmiana sieci
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  // ------------------- Render paneli -------------------

  return (
    <div style={{ padding: 40 }}>
      <h1>📝 Tablica Ogłoszeń Web3 (z licytacją)</h1>

      <hr />

      {view === "home" && (
        <Home setView={setView} connectWallet={connectWallet} account={account} />
      )}

      {view === "lista" && (
        <Lista setView={setView} setSelectedId={setSelectedId} contractRef={contractRef} />
      )}

      {view === "dodaj" && (
        <Dodaj
          setView={setView}
          connectWallet={connectWallet}
          account={account}
          contractRef={contractRef}
        />
      )}

      {view === "szczegoly" && (
        <Szczegoly
          id={selectedId}
          setView={setView}
          contractRef={contractRef}
          account={account}
        />
      )}
    </div>
  );
}

export default App;
