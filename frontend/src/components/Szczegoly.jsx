import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function Szczegoly({ id, setView, contractRef, account }) {
  const [item, setItem] = useState(null);
  const [bid, setBid] = useState("0.001");

  const load = async () => {
    const og = await contractRef.current.pobierz(id);
    setItem({
      autor: og[0],
      tresc: og[1],
      highestBid: og[2],
      highestBidder: og[3]
    });
  };

  const zalicytuj = async () => {
    await contractRef.current.zalicytuj(id, {
      value: ethers.parseEther(bid)
    });

    await load();
  };

  const wyplac = async () => {
    await contractRef.current.wyplacWygrana(id);
    alert("Wypłacono środki!");
    await load();
  };

  useEffect(() => {
    load();
  }, []);

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
    </div>
  );
}
