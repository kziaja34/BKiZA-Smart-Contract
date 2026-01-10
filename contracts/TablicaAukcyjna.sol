// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract TablicaAukcyjna {
    struct Ogloszenie {
        address autor;
        string tresc;
        uint highestBid;
        address highestBidder;
        uint minimalnaKwota;
        uint deadline; 
    }

    uint public licznik;
    mapping(uint => Ogloszenie) public ogloszenia;
    mapping(address => uint) public oczekujaceZwroty;

    event DodanoOgloszenie(uint indexed id, address indexed autor, string tresc, uint deadline);
    event NowaOferta(uint indexed id, address indexed licytant, uint kwota);
    event AukcjaZakonczona(uint indexed id, address indexed zwyciezca, uint kwota);

    function dodajOgloszenie(string memory tresc, uint minimalnaKwota, uint czasTrwania) public {
        require(bytes(tresc).length > 0, "Tresc nie moze byc pusta");
        require(minimalnaKwota > 0, "Minimalna kwota musi byc wieksza od 0");
        require(czasTrwania > 0, "Czas trwania musi byc dluzszy niz 0");

        licznik++;
        ogloszenia[licznik] = Ogloszenie({
            autor: msg.sender,
            tresc: tresc,
            highestBid: 0,
            highestBidder: address(0),
            minimalnaKwota: minimalnaKwota,
            deadline: block.timestamp + czasTrwania 
        });

        emit DodanoOgloszenie(licznik, msg.sender, tresc, block.timestamp + czasTrwania);
    }

    function zalicytuj(uint id) public payable {
        Ogloszenie storage o = ogloszenia[id];

        require(o.autor != address(0), "Aukcja nie istnieje lub zakonczona");
        require(block.timestamp < o.deadline, "Aukcja juz sie zakonczyla");

        require(msg.sender != o.autor, "Autor ogloszenia nie moze licytowac");
        require(msg.value > o.highestBid, "Za mala oferta");
        require(msg.value >= o.minimalnaKwota, "Oferta nie spelnia minimalnej kwoty"); 

        if (o.highestBid > 0) {
            oczekujaceZwroty[o.highestBidder] += o.highestBid;
        }

        o.highestBid = msg.value;
        o.highestBidder = msg.sender;

        emit NowaOferta(id, msg.sender, msg.value);
    }

    function wyplacWygrana(uint id) public {
        Ogloszenie storage o = ogloszenia[id];

        require(o.autor != address(0), "Aukcja nie istnieje");
        require(msg.sender == o.autor, "Nie jestes autorem");
        require(block.timestamp >= o.deadline, "Aukcja jeszcze trwa!");

        uint kwota = o.highestBid;
        address zwyciezca = o.highestBidder; 

        delete ogloszenia[id]; 

        emit AukcjaZakonczona(id, zwyciezca, kwota);

        if (kwota > 0) {
            (bool ok, ) = payable(msg.sender).call{value: kwota}("");
            require(ok, "Wyplata nie powiodla sie");
        }
    }

    function odbierzZwrot() public {
        uint kwota = oczekujaceZwroty[msg.sender];
        require(kwota > 0, "Brak srodkow do zwrotu");

        oczekujaceZwroty[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: kwota}("");
        require(ok, "Zwrot srodkow nie powiodl sie");
    }

    function pobierz(uint id)
        public
        view
        returns (address autor, string memory tresc, uint highestBid, address highestBidder, uint minimalnaKwota, uint deadline)
    {
        Ogloszenie memory o = ogloszenia[id];
        return (o.autor, o.tresc, o.highestBid, o.highestBidder, o.minimalnaKwota, o.deadline);
    }
}