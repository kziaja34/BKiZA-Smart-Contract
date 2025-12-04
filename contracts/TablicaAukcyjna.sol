// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.8.20;

contract TablicaAukcyjna {
    struct Ogloszenie {
        address autor;
        string tresc;
        uint highestBid;
        address highestBidder;
    }

    uint public licznik;
    mapping(uint => Ogloszenie) public ogloszenia;

    event DodanoOgloszenie(uint indexed id, address indexed autor, string tresc);
    event NowaOferta(uint indexed id, address indexed licytant, uint kwota);

    // Dodanie ogłoszenia – bez opłaty
    function dodajOgloszenie(string memory tresc) public {
        require(bytes(tresc).length > 0, "Tresc nie moze byc pusta");

        licznik++;
        ogloszenia[licznik] = Ogloszenie({
            autor: msg.sender,
            tresc: tresc,
            highestBid: 0,
            highestBidder: address(0)
        });

        emit DodanoOgloszenie(licznik, msg.sender, tresc);
    }

    // Licytacja
    function zalicytuj(uint id) public payable {
        require(id > 0 && id <= licznik, "Bledny ID");
        Ogloszenie storage o = ogloszenia[id];

        require(msg.sender != o.autor, "Autor ogloszenia nie moze licytowac");

        require(msg.value > o.highestBid, "Za mala oferta");

        o.highestBid = msg.value;
        o.highestBidder = msg.sender;

        emit NowaOferta(id, msg.sender, msg.value);
    }

    // Wypłata środków przez autora ogłoszenia
    function wyplacWygrana(uint id) public {
        require(id > 0 && id <= licznik, "Bledny ID");
        Ogloszenie storage o = ogloszenia[id];

        require(msg.sender == o.autor, "Nie jestes autorem");
        require(o.highestBid > 0, "Brak srodkow do wyplaty");

        uint kwota = o.highestBid;
        o.highestBid = 0;

        delete ogloszenia[id];

        payable(msg.sender).transfer(kwota);
    }

    // Pobieranie ogłoszenia
    function pobierz(uint id)
        public
        view
        returns (address autor, string memory tresc, uint highestBid, address highestBidder)
    {
        Ogloszenie memory o = ogloszenia[id];
        return (o.autor, o.tresc, o.highestBid, o.highestBidder);
    }
}
