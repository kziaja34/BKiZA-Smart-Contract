import { useState } from "react";
import { ethers } from "ethers";

export default function Dodaj({ setView, contractRef, connectWallet, account }) {
  const [tekst, setTekst] = useState("");
  const [minimalnaKwota, setMinimalnaKwota] = useState(""); 
  const [czasTrwania, setCzasTrwania] = useState(60); // Domyślnie 60 minut

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
      // Przeliczamy minuty na sekundy (Smart Contract operuje na sekundach)
      const czasWSekundach = parseInt(czasTrwania) * 60;

      // NOWE: Przekazujemy 3 argumenty: treść, kwotę i czas
      const tx = await contractRef.current.dodajOgloszenie(
        tekst, 
        ethers.parseEther(minimalnaKwota),
        czasWSekundach
      );
      
      await tx.wait(); // Czekamy na potwierdzenie transakcji
      alert("Dodano ogłoszenie!");
      setView("home");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas dodawania ogłoszenia.");
    }
  };

  return (
    <div>
      <button onClick={() => setView("home")}>⬅ Powrót</button>
      <h2>Dodaj ogłoszenie</h2>

      <label>Treść ogłoszenia:</label>
      <br />
      <textarea
        rows="4"
        cols="50"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
      />

      <br /><br />

      <label>Minimalna kwota licytacji (ETH):</label>
      <input
        type="number"
        value={minimalnaKwota}
        onChange={(e) => setMinimalnaKwota(e.target.value)}
        min="0"
        step="0.001"
      />

      <br /><br />

      {/* NOWE POLE: Czas trwania */}
      <label>Czas trwania aukcji (minuty):</label>
      <input
        type="number"
        value={czasTrwania}
        onChange={(e) => setCzasTrwania(e.target.value)}
        min="1"
      />

      <br /><br />

      <button onClick={submit}>Dodaj na Blockchain</button>
    </div>
  );
}