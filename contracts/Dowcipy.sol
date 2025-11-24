// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.8.20;

contract Dowcipy {
    struct Dowcip {
        uint idDowcipu;
        string trescDowcipu;
    }

    struct Ocena {
        uint idDowcipu;
        address idUzytkownika;
        uint ocena;
    }

    mapping(uint => Dowcip) public dowcipy;
    mapping(uint => Ocena) public oceny;
    mapping(address => mapping(uint => uint)) public ocenyUzytkownika;
    mapping(uint => mapping(uint => address)) public ocenyDowcipu;
    mapping(uint => uint) public licznikOcenDowcipu;

    uint public licznikDowcipow;
    uint public licznikOcen;

    event zdarzenieOcenionoDowcip (
        uint indexed _idDowcipu, 
        uint indexed ocena
    );

    constructor () public {
        dodajDowcip(unicode"Dlaczego informatycy mylą Halloween z Bożym Narodzeniem?\nDlatego, że 31 OCT to 25 DEC.\n");
        dodajDowcip(unicode"Czym różni się doświadczony informatyk od początkującego?\nPoczątkujący uważa, że 1 KB to 1000 B, a doświadczony jest pewien, że 1 km to 1024 m.\n");
        dodajDowcip(unicode"How many people can read hex if only you and dead people can read hex?\n57006.\n");
    }

    function dodajDowcip (string memory _tresc) public {
        licznikDowcipow ++;
        dowcipy[licznikDowcipow] = Dowcip(licznikDowcipow, _tresc);
    }

    function ocenDowcip (uint _idDowcipu, uint _ocena) public {
        require(_idDowcipu > 0 && _idDowcipu <= licznikDowcipow, unicode"Dowcip o podanym identyfikatorze nie istnieje");
        require(_ocena >= 1 && _ocena <= 6, unicode"Niewłaściwa wartość oceny");
        require(ocenyUzytkownika[msg.sender][_idDowcipu] == 0, unicode"Użytkownik już ocenił wybrany dowcip");

        licznikOcen ++;

        oceny[licznikOcen] = Ocena(_idDowcipu, msg.sender, _ocena);

        ocenyUzytkownika[msg.sender][_idDowcipu] = licznikOcen;

        licznikOcenDowcipu[_idDowcipu] ++;

        ocenyDowcipu[_idDowcipu][licznikOcenDowcipu[_idDowcipu]] = msg.sender;

        emit zdarzenieOcenionoDowcip(_idDowcipu, _ocena);
    }
    
    function pobierzOcene (address _a, uint _id) public view returns (uint) {
        return ocenyUzytkownika[_a][_id];
    }

    function losowyDowcip () public view returns (uint id, string memory tresc) {
        uint losowyNumer = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % licznikDowcipow + 1;
        return (dowcipy[losowyNumer].idDowcipu, dowcipy[losowyNumer].trescDowcipu);
    }

    function nastepnyDowcip (uint _aktualny) public view returns (uint id, string memory tresc) {
        uint kolejnyNumer = (_aktualny % licznikDowcipow) + 1;
        return (dowcipy[kolejnyNumer].idDowcipu, dowcipy[kolejnyNumer].trescDowcipu);
    }

    function najlepszyDowcip () public view returns (uint id, string memory tresc) {
        uint indeks;
        uint ocena;

        for (uint i = 1; i <= licznikDowcipow; i++) {
            uint o = wyliczOceneDowcipu(i);
            if (o > ocena) {
                ocena = o;
                indeks = i;
            }
        }

        return (dowcipy[indeks].idDowcipu, dowcipy[indeks].trescDowcipu);
    }

    function pobierzDowcip (uint _aktualny) public view returns (uint id, string memory tresc) {
        return (dowcipy[_aktualny].idDowcipu, dowcipy[_aktualny].trescDowcipu);
    }

    function wyliczOceneDowcipu (uint _aktualny) public view returns (uint) {
        uint suma;
        uint licznik;
        address o;
        uint idO;

        for (uint i = 1; i <= licznikOcenDowcipu[_aktualny]; i++) {
            o = ocenyDowcipu[_aktualny][i];
            if (o != address(0)) {
                idO = ocenyUzytkownika[o][_aktualny];
                if (idO > 0 && idO <= licznikOcen) {
                    suma += oceny[idO].ocena;
                    licznik++;
                }
            }
        }

        if (licznik == 0) return 0;
        return suma / licznik;
    }
}
