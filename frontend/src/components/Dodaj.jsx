import { useState } from "react";
import { ethers } from "ethers";

export default function Dodaj({ setView, contractRef, connectWallet, account }) {
  const [tekst, setTekst] = useState("");
  const [minimalnaKwota, setMinimalnaKwota] = useState(""); 

  const submit = async () => {
    if (!account) {
      await connectWallet();
    }

    if (parseFloat(minimalnaKwota) <= 0) {
      alert("Minimalna kwota musi być większa niż 0!");
      return; 
    }

    await contractRef.current.dodajOgloszenie(tekst, ethers.parseEther(minimalnaKwota));
    alert("Dodano ogłoszenie!");
    setView("home");
  };

  return (
    <div>
      <button onClick={() => setView("home")}>⬅ Powrót</button>
      <h2>Dodaj ogłoszenie</h2>

      <textarea
        rows="4"
        cols="50"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
      />

      <br />

      <label>Minimalna kwota licytacji (ETH):</label>
      <input
        type="number"
        value={minimalnaKwota}
        onChange={(e) => setMinimalnaKwota(e.target.value)}
        min="0"
      />

      <br />

      <button onClick={submit}>Dodaj</button>
    </div>
  );
}
