import { useState } from "react";

export default function Dodaj({ setView, contractRef, connectWallet, account }) {
  const [tekst, setTekst] = useState("");

  const submit = async () => {
    if (!account) {
      await connectWallet();
    }

    await contractRef.current.dodajOgloszenie(tekst);
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

      <button onClick={submit}>Dodaj</button>
    </div>
  );
}
