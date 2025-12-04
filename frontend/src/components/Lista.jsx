import { useState, useEffect } from "react";

export default function Lista({ setView, setSelectedId, contractRef, account }) {
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!contractRef.current) return;

    const total = Number(await contractRef.current.licznik());
    const arr = [];

    for (let i = 1; i <= total; i++) {
      const og = await contractRef.current.pobierz(i);
      if (og[1] !== "") {
        arr.push({
          id: i,
          autor: og[0],
          tresc: og[1],
          bid: og[2]
        });
      }
    }

    setItems(arr);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <button onClick={() => setView("home")}>⬅ Powrót</button>
      <h2>Lista ogłoszeń</h2>

      {items.map((i) => (
        <div
          key={i.id}
          style={{
            border: "1px solid gray",
            padding: 10,
            marginBottom: 10,
            cursor: "pointer"
          }}
          onClick={() => {
            setSelectedId(i.id);
            setView("szczegoly");
          }}
        >
          <b>#{i.id}</b> — {i.tresc}
          <br />
          Najwyższa oferta: {Number(i.bid) / 1e18} ETH
        </div>
          ))}
    </div>
  );
}
