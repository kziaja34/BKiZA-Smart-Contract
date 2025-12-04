export default function Home({ setView, connectWallet, account }) {
  return (
    <div>
      {!account && (
        <button onClick={connectWallet}>Połącz z MetaMask</button>
      )}

      {account && (
        <p>Połączono jako: {account}</p>
      )}

      <button onClick={() => setView("lista")}>📄 Przeglądaj ogłoszenia</button>
      <button onClick={() => setView("dodaj")}>➕ Dodaj ogłoszenie</button>
    </div>
  );
}
