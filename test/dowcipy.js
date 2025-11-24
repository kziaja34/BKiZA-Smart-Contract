const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dowcipy", function () {
  let Dowcipy, instance;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    Dowcipy = await ethers.getContractFactory("Dowcipy");
    instance = await Dowcipy.deploy();
    await instance.waitForDeployment();
  });

  it("Zainicjuj kontrakt 3 dowcipami", async function () {
    const licznik = await instance.licznikDowcipow();
    expect(licznik).to.equal(3);
  });

  it("Przetestuj wartości początkowe dowcipów", async function () {
    const d1 = await instance.dowcipy(1);
    expect(d1.idDowcipu).to.equal(1);

    const d2 = await instance.dowcipy(2);
    expect(d2.idDowcipu).to.equal(2);

    const d3 = await instance.dowcipy(3);
    expect(d3.idDowcipu).to.equal(3);
  });

  it("Przetestuj ocenianie dowcipów", async function () {
    let tx = await instance.connect(owner).ocenDowcip(1, 5);
    let receipt = await tx.wait();

    expect(receipt.logs.length).to.equal(1);
    let event = instance.interface.parseLog(receipt.logs[0]);
    expect(event.args._idDowcipu).to.equal(1);
    expect(event.args.ocena).to.equal(5);

    await instance.connect(owner).ocenDowcip(2, 3);
    await instance.connect(user1).ocenDowcip(2, 1);

    expect(await instance.wyliczOceneDowcipu(1)).to.equal(5);
    expect(await instance.wyliczOceneDowcipu(2)).to.equal(2);
    expect(await instance.wyliczOceneDowcipu(3)).to.equal(0);
  });

  it("Przetestuj wyszukiwanie dowcipów", async function () {
    await instance.connect(owner).ocenDowcip(1, 5);

    const najlepszy = await instance.najlepszyDowcip();
    expect(najlepszy.id).to.equal(1);

    const d2 = await instance.nastepnyDowcip(1);
    expect(d2.id).to.equal(2);

    const d3 = await instance.nastepnyDowcip(2);
    expect(d3.id).to.equal(3);

    const d1 = await instance.nastepnyDowcip(3);
    expect(d1.id).to.equal(1);

    const rand = await instance.losowyDowcip();
    expect(rand.id).to.be.greaterThan(0);
  });

  it("Przetestuj błędną ocenę dowcipu", async function () {
    await instance.connect(owner).ocenDowcip(1, 5);
    await instance.connect(owner).ocenDowcip(2, 2);
    await expect(
      instance.connect(user1).ocenDowcip(3, 0)
    ).to.be.revertedWith("Niewłaściwa wartość oceny");

    expect(await instance.wyliczOceneDowcipu(3)).to.equal(0);

    await expect(
      instance.connect(user1).ocenDowcip(99, 4)
    ).to.be.reverted;

    expect(await instance.wyliczOceneDowcipu(1)).to.equal(5);
    expect(await instance.wyliczOceneDowcipu(2)).to.equal(2);
    expect(await instance.wyliczOceneDowcipu(3)).to.equal(0);
  });

  it("Przetestuj podwójną ocenę dowcipu", async function () {
    // Najpierw poprawna ocena
    await instance.connect(owner).ocenDowcip(2, 2);

    // Potem próba ponownej oceny
    await expect(
      instance.connect(owner).ocenDowcip(2, 6)
    ).to.be.revertedWith("Użytkownik już ocenił wybrany dowcip");

    expect(await instance.wyliczOceneDowcipu(2)).to.equal(2);
  });
});
