import { useEffect, useState } from "react";
import { ethers } from "ethers"; // Dodałem import, bo był potrzebny do formatEther

export default function Szczegoly({ id, setView, contractRef, account }) {
  const [item, setItem] = useState(null);
  const [bid, setBid] = useState("0.001");
  const [pendingReturn, setPendingReturn] = useState(0); 
  const [hasReceivedFunds, setHasReceivedFunds] = useState(false); 

  const load = async () => {
    try {
      // Pobieramy dane z nowego kontraktu (zwraca teraz 6 wartości)
      const og = await contractRef.current.pobierz(id);
      
      // Konwersja BigInt deadline na datę JS
      // og[5] to timestamp w sekundach, JS potrzebuje milisekund (* 1000)
      const deadlineTimestamp = Number(og[5]);
      const dataKonca = new Date(deadlineTimestamp * 1000);
      const czyZakonczona = Date.now() > dataKonca.getTime();

      setItem({
        autor: og[0],
        tresc: og[1],
        highestBid: og[2], // BigInt
        highestBidder: og[3],
        minimalnaKwota: ethers.formatEther(og[4]),
        deadline: deadlineTimestamp,
        dataKoncaString: dataKonca.toLocaleString(),
        czyZakonczona: czyZakonczona
      });

      if (account) {
          const zwrot = await contractRef.current.oczekujaceZwroty(account);
          setPendingReturn(ethers.formatEther(zwrot)); // Formatujemy na czytelne ETH
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
      setView("lista"); // Wracamy do listy, bo aukcja znika (zostaje usunięta ze stanu)
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
    // Opcjonalnie: odświeżanie statusu co minutę, żeby zaktualizować "czy zakończona"
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [account, id]);

  if (!item) return <div>Ładowanie danych z blockchaina...</div>;

  return (
    <div>
      <button onClick={() => setView("lista")}>⬅ Powrót</button>

      <h2>Ogłoszenie #{id}</h2>
      
      {/* NOWE: Wyświetlanie czasu */}
      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
          <p><b>Koniec aukcji:</b> {item.dataKoncaString}</p>
          {item.czyZakonczona ? (
              <p style={{ color: "red", fontWeight: "bold" }}>AUKCJA ZAKOŃCZONA</p>
          ) : (
              <p style={{ color: "green", fontWeight: "bold" }}>TRWA LICYTACJA</p>
          )}
      </div>

      <p><b>Treść:</b> {item.tresc}</p>
      <p><b>Autor:</b> {item.autor}</p>
      <p><b>Cena minimalna:</b> {item.minimalnaKwota} ETH</p>
      <p>
        <b>Aktualna najwyższa oferta:</b> {ethers.formatEther(item.highestBid)} ETH <br />
        <b>Najwyższy licytant:</b> {item.highestBidder === ethers.ZeroAddress ? "Brak ofert" : item.highestBidder}
      </p>

      <hr />

      {/* SEKCJA LICYTACJI (Tylko dla innych i gdy trwa) */}
      {item.autor.toLowerCase() !== account?.toLowerCase() && (
        <>
          <h3>Zalicytuj</h3>
          {!item.czyZakonczona ? (
              <>
                <input
                    type="text"
                    value={bid}
                    onChange={(e) => setBid(e.target.value)}
                    placeholder="Kwota ETH"
                />
                <button onClick={zalicytuj}>Wyślij ofertę</button>
              </>
          ) : (
              <p>Licytacja została zamknięta.</p>
          )}
        </>
      )}

      {/* SEKCJA AUTORA (Wypłata tylko po czasie) */}
      {account?.toLowerCase() === item.autor.toLowerCase() && (
        <>
          <h3>Panel Autora</h3>
          {item.czyZakonczona ? (
             <button onClick={wyplac}>Wypłać najwyższą ofertę i zamknij</button>
          ) : (
             <p>Będziesz mógł wypłacić środki po: {item.dataKoncaString}</p>
          )}
        </>
      )}

      <hr />

      {/* SEKCJA ZWROTÓW (Dla przegranych) */}
      {!hasReceivedFunds && parseFloat(pendingReturn) > 0 && (
        <div style={{backgroundColor: "#f0f0f0", padding: "10px", marginTop: "20px"}}>
          <h3>Twoje środki do odebrania (z przebitych ofert)</h3>
          <p>Kwota: {pendingReturn} ETH</p>
          <button onClick={odbierzZwrot}>Odbierz zwrot na portfel</button>
        </div>
      )}
    </div>
  );
}