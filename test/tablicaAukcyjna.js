const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");


describe("TablicaAukcyjna", function () {
  let Tablica, instance;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    Tablica = await ethers.getContractFactory("TablicaAukcyjna");
    instance = await Tablica.deploy();
    await instance.waitForDeployment();
  });

  // ---------------------------------------------------------
  // 1. DODAWANIE OGŁOSZEŃ
  // ---------------------------------------------------------
  it("Powinno dodawać ogłoszenie z poprawnymi parametrami", async function () {
    const tx = await instance.dodajOgloszenie("Rower", 100, 60);
    const receipt = await tx.wait();

    expect(await instance.licznik()).to.equal(1);

    const event = instance.interface.parseLog(receipt.logs[0]);
    expect(event.args.id).to.equal(1);
    expect(event.args.autor).to.equal(owner.address);
    expect(event.args.tresc).to.equal("Rower");
  });

  it("Nie powinno pozwolić na dodanie ogłoszenia z pustą treścią", async function () {
    await expect(instance.dodajOgloszenie("", 100, 60))
      .to.be.revertedWith("Tresc nie moze byc pusta");
  });

  it("Nie powinno pozwolić na minimalną kwotę = 0", async function () {
    await expect(instance.dodajOgloszenie("A", 0, 60))
      .to.be.revertedWith("Minimalna kwota musi byc wieksza od 0");
  });

  it("Nie powinno pozwolić na czas trwania = 0", async function () {
    await expect(instance.dodajOgloszenie("A", 1, 0))
      .to.be.revertedWith("Czas trwania musi byc dluzszy niz 0");
  });

  // ---------------------------------------------------------
  // 2. LICYTACJE
  // ---------------------------------------------------------
  it("Powinno pozwolić na poprawną licytację i emitować event", async function () {
    await instance.dodajOgloszenie("Rower", 100, 60);

    const tx = await instance.connect(user1).zalicytuj(1, { value: 150 });
    const receipt = await tx.wait();

    const event = instance.interface.parseLog(receipt.logs[0]);

    expect(event.args.id).to.equal(1);
    expect(event.args.licytant).to.equal(user1.address);
    expect(event.args.kwota).to.equal(150);
  });

  it("Autor nie może licytować własnego ogłoszenia", async function () {
    await instance.dodajOgloszenie("Rower", 100, 60);

    await expect(
      instance.connect(owner).zalicytuj(1, { value: 200 })
    ).to.be.revertedWith("Autor ogloszenia nie moze licytowac");
  });

  it("Nie można licytować poniżej minimalnej kwoty", async function () {
    await instance.dodajOgloszenie("Rower", 100, 60);

    await expect(
      instance.connect(user1).zalicytuj(1, { value: 50 })
    ).to.be.revertedWith("Oferta nie spelnia minimalnej kwoty");
  });

  it("Nie można licytować mniej niż aktualna oferta", async function () {
    await instance.dodajOgloszenie("Rower", 100, 60);

    await instance.connect(user1).zalicytuj(1, { value: 200 });

    await expect(
      instance.connect(user2).zalicytuj(1, { value: 150 })
    ).to.be.revertedWith("Za mala oferta");
  });

  it("Powinno zwiększyć saldo zwrotów dla poprzedniego licytanta", async function () {
    await instance.dodajOgloszenie("Rower", 100, 60);

    await instance.connect(user1).zalicytuj(1, { value: 200 });
    await instance.connect(user2).zalicytuj(1, { value: 300 });

    expect(await instance.oczekujaceZwroty(user1.address)).to.equal(200);
  });

  // ---------------------------------------------------------
  // 3. ZAKOŃCZENIE AUKCJI
  // ---------------------------------------------------------
  it("Nie można zakończyć aukcji przed deadlinem", async function () {
    await instance.dodajOgloszenie("Rower", 100, 1000);

    await expect(
      instance.wyplacWygrana(1)
    ).to.be.revertedWith("Aukcja jeszcze trwa!");
  });

  it("Tylko autor może zakończyć aukcję", async function () {
    await instance.dodajOgloszenie("Rower", 100, 1);

    await time.increase(2);

    await expect(
      instance.connect(user1).wyplacWygrana(1)
    ).to.be.revertedWith("Nie jestes autorem");
  });

  it("Zakończenie aukcji powinno wyczyścić ogłoszenie i wypłacić środki", async function () {
    await instance.dodajOgloszenie("Rower", 100, 1000);

    await instance.connect(user1).zalicytuj(1, { value: 400 });

    await time.increase(2000);

    const balansPrzed = await ethers.provider.getBalance(owner.address);

    const tx = await instance.wyplacWygrana(1);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;

    const balansPo = await ethers.provider.getBalance(owner.address);

    expect(balansPo).to.be.closeTo(balansPrzed + 400n - gas, 5n);

    const og = await instance.pobierz(1);
    expect(og.autor).to.equal(ethers.ZeroAddress);
  })

  it("Zakończenie aukcji bez żadnej oferty — powinno po prostu usunąć aukcję", async function () {
    await instance.dodajOgloszenie("Rower", 100, 1);
    await time.increase(2);

    await instance.wyplacWygrana(1);

    const og = await instance.pobierz(1);
    expect(og.autor).to.equal(ethers.ZeroAddress);
  });

  // ---------------------------------------------------------
  // 4. ODBIÓR ZWROTÓW
  // ---------------------------------------------------------
  it("Użytkownik może odebrać zwrot", async function () {
    await instance.dodajOgloszenie("Rower", 100, 60);
    await instance.connect(user1).zalicytuj(1, { value: 200 });
    await instance.connect(user2).zalicytuj(1, { value: 300 });

    const balansPrzed = await ethers.provider.getBalance(user1.address);

    const tx = await instance.connect(user1).odbierzZwrot();
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;

    const balansPo = await ethers.provider.getBalance(user1.address);

    expect(balansPo).to.be.closeTo(balansPrzed + 200n - gas, 5n);
  });

  it("Nie można odebrać zwrotu jeśli brak środków", async function () {
    await expect(
      instance.connect(user1).odbierzZwrot()
    ).to.be.revertedWith("Brak srodkow do zwrotu");
  });

  // ---------------------------------------------------------
  // 5. FUNKCJA 'pobierz'
  // ---------------------------------------------------------
  it("pobierz() powinno zwracać poprawne dane ogłoszenia", async function () {
    await instance.dodajOgloszenie("Rower", 123, 60);
    const og = await instance.pobierz(1);

    expect(og.autor).to.equal(owner.address);
    expect(og.tresc).to.equal("Rower");
    expect(og.minimalnaKwota).to.equal(123);
    expect(og.deadline).to.be.gt(0);
  });

  it("Wygenerowany deadline musi być większy niż timestamp rozpoczęcia", async function () {
    const now = await time.latest();
    await instance.dodajOgloszenie("Test", 100, 50);

    const og = await instance.pobierz(1);
    expect(og.deadline).to.be.closeTo(now + 50, 2);
  });

});
