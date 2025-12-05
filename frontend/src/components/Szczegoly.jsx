import { useEffect, useState } from "react";

export default function Szczegoly({ id, setView, contractRef, account }) {
  const [item, setItem] = useState(null);
  const [bid, setBid] = useState("0.001");
  const [pendingReturn, setPendingReturn] = useState(0); 
  const [hasReceivedFunds, setHasReceivedFunds] = useState(false); 

  const load = async () => {
    const og = await contractRef.current.pobierz(id);
    setItem({
      autor: og[0],
      tresc: og[1],
      highestBid: og[2],
      highestBidder: og[3],
      minimalnaKwota: ethers.formatEther(og[4])
    });

    const zwrot = await contractRef.current.oczekujaceZwroty(account);
    setPendingReturn(zwrot.toString());
  };

  const zalicytuj = async () => {
    try {
      await contractRef.current.zalicytuj(id, {
        value: ethers.parseEther(bid)
      });
      await load();
      alert("Nowa oferta została złożona!");
    } catch (error) {
      if (error.message.includes("Autor ogloszenia nie moze licytowac")) {
        alert("Autor ogłoszenia nie może licytować");
      } else if (error.message.includes("Za mala oferta")) {
        alert("Za mała oferta");
      } else {
        alert("Wystąpił błąd");
      }
    }
  };

  const wyplac = async () => {
    try {
      await contractRef.current.wyplacWygrana(id);
      alert("Wypłacono środki!");
      await load();
    } catch (error) {
      if (error.message.includes("Nie jestes autorem")) {
        alert("Nie jesteś autorem ogłoszenia");
      } else if (error.message.includes("Brak srodkow do wyplaty")) {
        alert("Brak środków do wypłaty");
      } else {
        alert("Wyplata nie powiodła się");
      }
    }
  }

  const odbierzZwrot = async () => {
    try {
      await contractRef.current.odbierzZwrot();
      alert("Środki zostały zwrócone!");
      setHasReceivedFunds(true);
      await load();
    } catch (error) {
      alert("Brak srodkow do zwrotu");
    }
  };

  useEffect(() => {
    load();
  }, [account]);

  if (!item) return <div>Ładowanie...</div>;

  return (
    <div>
      <button onClick={() => setView("lista")}>⬅ Powrót</button>

      <h2>Ogłoszenie #{id}</h2>

      <p><b>Treść:</b> {item.tresc}</p>
      <p><b>Autor:</b> {item.autor}</p>
      <p>
        <b>Najwyższa oferta:</b> {Number(item.highestBid) / 1e18} ETH <br />
        <b>Najwyższy licytant:</b> {item.highestBidder}
      </p>

      {item.autor.toLowerCase() !== account?.toLowerCase() && (
        <>
          <h3>Zalicytuj</h3>
          <input
            type="text"
            value={bid}
            onChange={(e) => setBid(e.target.value)}
          />
          <button onClick={zalicytuj}>Wyślij ofertę</button>
        </>
      )}

      {account?.toLowerCase() === item.autor.toLowerCase() && (
        <>
          <h3>Wypłata dla autora</h3>
          <button onClick={wyplac}>Wypłać najwyższą ofertę</button>
        </>
      )}

      {!hasReceivedFunds && pendingReturn > 0 && (
        <>
          <h3>Odbierz zwrot</h3>
          <button onClick={odbierzZwrot}>Odbierz środki</button>
        </>
      )}
    </div>
  );
}
