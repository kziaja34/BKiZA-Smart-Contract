// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.8.20;

contract TablicaAukcyjna {
    struct Ogloszenie {
        address autor;
        string tresc;
        uint highestBid;
        address highestBidder;
        uint minimalnaKwota;
    }

    uint public licznik;
    mapping(uint => Ogloszenie) public ogloszenia;
    mapping(address => uint) public oczekujaceZwroty;

    event DodanoOgloszenie(uint indexed id, address indexed autor, string tresc);
    event NowaOferta(uint indexed id, address indexed licytant, uint kwota);

    function dodajOgloszenie(string memory tresc, uint minimalnaKwota) public {
        require(bytes(tresc).length > 0, "Tresc nie moze byc pusta");
         require(minimalnaKwota > 0, "Minimalna kwota musi byc wieksza od 0");

        licznik++;
        ogloszenia[licznik] = Ogloszenie({
            autor: msg.sender,
            tresc: tresc,
            highestBid: 0,
            highestBidder: address(0),
            minimalnaKwota: minimalnaKwota
        });

        emit DodanoOgloszenie(licznik, msg.sender, tresc);
    }

    function zalicytuj(uint id) public payable {
        require(id > 0 && id <= licznik, "Bledny ID");
        Ogloszenie storage o = ogloszenia[id];

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
        require(id > 0 && id <= licznik, "Bledny ID");
        Ogloszenie storage o = ogloszenia[id];

        require(msg.sender == o.autor, "Nie jestes autorem");
        require(o.highestBid > 0, "Brak srodkow do wyplaty");

        uint kwota = o.highestBid;

        o.highestBid = 0;
        o.highestBidder = address(0);
        o.tresc = "";

        (bool ok, ) = msg.sender.call{value: kwota}("");
        require(ok, "Wyplata nie powiodla sie");
    }

    function odbierzZwrot() public {
        uint kwota = oczekujaceZwroty[msg.sender];
        require(kwota > 0, "Brak srodkow do zwrotu");

        oczekujaceZwroty[msg.sender] = 0;
        payable(msg.sender).transfer(kwota);
    }

    function pobierz(uint id)
        public
        view
        returns (address autor, string memory tresc, uint highestBid, address highestBidder)
    {
        Ogloszenie memory o = ogloszenia[id];
        return (o.autor, o.tresc, o.highestBid, o.highestBidder);
    }
}
