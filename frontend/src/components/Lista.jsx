import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Lista({ setView, setSelectedId, contractRef, account }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (!contractRef.current) {
        // Jeśli kontrakt się jeszcze nie załadował, spróbujmy ponownie za chwilę lub po prostu czekajmy
        setLoading(false);
        return;
      }

      const totalBigInt = await contractRef.current.licznik();
      const total = Number(totalBigInt); // Konwersja BigInt na Number
      console.log("Liczba ogłoszeń:", total);

      if (total === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const arr = [];
      for (let i = 1; i <= total; i++) {
        // Pobieramy krotkę (tuple) z kontraktu
        // Struktura: [autor, tresc, highestBid, highestBidder, minimalnaKwota, deadline]
        const og = await contractRef.current.pobierz(i);
        
        // Sprawdzamy czy ogłoszenie istnieje (czy ma autora)
        // Usunięte aukcje mają adres 0x000...
        if (og[0] !== ethers.ZeroAddress) {
            arr.push({
                id: i,
                autor: og[0],
                tresc: og[1],
                bid: og[2], // To jest BigInt
                // UWAGA: W ethers v6 nie ma "utils". Używamy bezpośrednio ethers.formatEther
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
    // Wywołaj load tylko jeśli contractRef jest gotowy
    if (contractRef.current) {
        load();
    }
  }, [contractRef, account, setView]); // Dodano zależności, żeby lista odświeżała się przy powrocie

  if (loading) {
    return <div>Ładowanie listy aukcji...</div>;
  }

  return (
    <div>
      <button onClick={() => setView("home")}>⬅ Powrót</button>
      <h2>Lista ogłoszeń</h2>

      {items.length === 0 ? (
        <div>Brak aktywnych ogłoszeń.</div>
      ) : (
        items.map((i) => (
          <div
            key={i.id}
            style={{
              border: "1px solid gray",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
              backgroundColor: "#f9f9f9"
            }}
            onClick={() => {
              setSelectedId(i.id);
              setView("szczegoly");
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <b>#{i.id}</b>
                <span style={{fontSize: '0.8em', color: '#666'}}>
                    {new Date(i.deadline * 1000).toLocaleString()}
                </span>
            </div>
            <p style={{margin: "5px 0", fontWeight: "bold"}}>{i.tresc}</p>
            
            <small>
                Najwyższa oferta: {ethers.formatEther(i.bid)} ETH <br />
                Min. kwota: {i.minimalnaKwota} ETH
            </small>
          </div>
        ))
      )}
    </div>
  );
}