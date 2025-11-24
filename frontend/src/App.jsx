import { useState, useRef } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "./contract";

function App() {
  const [account, setAccount] = useState(null);
  const [joke, setJoke] = useState("");

  const providerRef = useRef(null);
  const signerRef = useRef(null);
  const contractRef = useRef(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Zainstaluj MetaMask!");
      return;
    }

    providerRef.current = new ethers.BrowserProvider(window.ethereum);
    const network = await providerRef.current.getNetwork();

    if (network.chainId !== BigInt(1337)) {
      alert("Użyj sieci Hardhat (chainId 1337)");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);

    signerRef.current = await providerRef.current.getSigner();
    contractRef.current = new ethers.Contract(
      contractAddress,
      contractABI,
      signerRef.current
    );

    console.log("Kontrakt podłączony:", contractRef.current);
  };

  const getRandomJoke = async () => {
    if (!contractRef.current) {
      alert("Połącz portfel!");
      return;
    }

    const total = Number(await contractRef.current.licznikDowcipow());
    if (total === 0) {
      setJoke("Brak dowcipów w kontrakcie!");
      return;
    }

    const randomId = Math.floor(Math.random() * total) + 1;
    const jokeData = await contractRef.current.pobierzDowcip(randomId);

    setJoke(jokeData[1]);
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Dowcipy — Web3 (losowanie po stronie frontu)</h1>

      {!account && (
        <button onClick={connectWallet}>Połącz z MetaMask</button>
      )}

      {account && (
        <>
          <p>Połączono jako: {account}</p>

          <button onClick={getRandomJoke}>Wylosuj dowcip</button>

          <h3 style={{ marginTop: 20 }}>{joke}</h3>
        </>
      )}
    </div>
  );
}

export default App;
