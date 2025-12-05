import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Lista({ setView, setSelectedId, contractRef, account }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Stan do zarządzania ładowaniem

  const load = async () => {
    setLoading(true); // Rozpoczynamy ładowanie
    try {
      if (!contractRef.current) {
        console.error("Kontrakt nie jest załadowany");
        return;
      }

      const total = Number(await contractRef.current.licznik()); // Pobieramy liczbę ogłoszeń
      console.log("Liczba ogłoszeń:", total); // Logowanie liczby ogłoszeń

      if (total === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const arr = [];
      for (let i = 1; i <= total; i++) {
        const og = await contractRef.current.pobierz(i);
        console.log(`Ogłoszenie #${i}:`, og); // Logowanie szczegółów ogłoszenia

        // Jeśli ogłoszenie nie jest puste, dodajemy je do tablicy
        if (og[1] !== "") {
          // Sprawdzamy, czy minimalna kwota nie jest undefined lub null
          const minimalnaKwota = og[4] !== undefined && og[4] !== null ? ethers.utils.formatEther(og[4]) : "0";
          arr.push({
            id: i,
            autor: og[0],
            tresc: og[1],
            bid: og[2],
            minimalnaKwota: minimalnaKwota // Używamy bezpiecznego formatowania
          });
        }
      }

      setItems(arr); // Ustawiamy tablicę ogłoszeń
    } catch (error) {
      console.error("Błąd podczas ładowania ogłoszeń:", error); // Logowanie błędu
    } finally {
      setLoading(false); // Zatrzymujemy ładowanie
    }
  };

  useEffect(() => {
    load(); // Ładujemy ogłoszenia po załadowaniu komponentu
  }, [contractRef]); // Tylko gdy kontrakt jest załadowany

  if (loading) {
    return <div>Ładowanie...</div>; // Ekran ładowania
  }

  return (
    <div>
      <button onClick={() => setView("home")}>⬅ Powrót</button>
      <h2>Lista ogłoszeń</h2>

      {items.length === 0 ? (
        <div>Brak ogłoszeń do wyświetlenia.</div> // Jeśli brak ogłoszeń, informujemy użytkownika
      ) : (
        items.map((i) => (
          <div
            key={i.id}
            style={{
              border: "1px solid gray",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer"
            }}
            onClick={() => {
              setSelectedId(i.id); // Ustawiamy wybrane ogłoszenie
              setView("szczegoly"); // Zmieniamy widok na szczegóły ogłoszenia
            }}
          >
            <b>#{i.id}</b> — {i.tresc}
            <br />
            Najwyższa oferta: {Number(i.bid) / 1e18} ETH
            <br />
            Cena wywoławcza: {i.minimalnaKwota} ETH {/* Wyświetlanie minimalnej kwoty */}
          </div>
        ))
      )}
    </div>
  );
}
