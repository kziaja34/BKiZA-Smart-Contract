export default function Home({ setView, connectWallet, account }) {
  const formatAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  return (
    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
      <div className="container" style={{ maxWidth: '400px' }}>
        <div className="card shadow-lg border-0 rounded-3">
          
          <div className="card-header bg-white border-bottom-0 pt-4 pb-0 text-center">
            {!account ? (
              <div>
                <p className="text-muted mb-3">Nie jesteś połączony</p>
                <button 
                  onClick={connectWallet} 
                  className="btn btn-warning text-white fw-bold rounded-pill px-4 shadow-sm"
                >
                  🦊 Połącz z MetaMask
                </button>
              </div>
            ) : (
              <div>
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 mb-2">
                  ● Połączono
                </span>
                <h5 className="font-monospace mt-2 text-dark">
                  {formatAddress(account)}
                </h5>
              </div>
            )}
          </div>

          <div className="card-body p-4">
            <div className="d-grid gap-3">
              <button 
                onClick={() => setView("dodaj")} 
                className="btn btn-primary btn-lg shadow-sm"
              >
                ➕ Dodaj ogłoszenie
              </button>

              <button 
                onClick={() => setView("lista")} 
                className="btn btn-outline-secondary btn-lg"
              >
                📄 Przeglądaj ogłoszenia
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}