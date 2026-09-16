const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

// Roles enum mirrors the Solidity contract: None = 0, Producer = 1, Consumer = 2
const Role = { None: 0, Producer: 1, Consumer: 2 };

describe("EnergyTrading", function () {
  let energyTrading;
  let owner, producer, producer2, consumer, consumer2, stranger;

  beforeEach(async function () {
    [owner, producer, producer2, consumer, consumer2, stranger] = await ethers.getSigners();
    const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
    energyTrading = await EnergyTrading.deploy();
    await energyTrading.waitForDeployment();
  });

  describe("User registration", function () {
    it("allows a producer to register", async function () {
      await expect(energyTrading.connect(producer).registerUser(Role.Producer))
        .to.emit(energyTrading, "UserRegistered")
        .withArgs(producer.address, Role.Producer, anyValue);

      const user = await energyTrading.getUser(producer.address);
      expect(user.registered).to.equal(true);
      expect(user.role).to.equal(Role.Producer);
    });

    it("allows a consumer to register", async function () {
      await energyTrading.connect(consumer).registerUser(Role.Consumer);
      const user = await energyTrading.getUser(consumer.address);
      expect(user.registered).to.equal(true);
      expect(user.role).to.equal(Role.Consumer);
    });

    it("rejects duplicate registration", async function () {
      await energyTrading.connect(producer).registerUser(Role.Producer);
      await expect(
        energyTrading.connect(producer).registerUser(Role.Consumer)
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("Offer creation", function () {
    beforeEach(async function () {
      await energyTrading.connect(producer).registerUser(Role.Producer);
      await energyTrading.connect(consumer).registerUser(Role.Consumer);
    });

    it("lets a producer create an offer", async function () {
      const price = ethers.parseEther("0.006"); // per kWh
      await expect(energyTrading.connect(producer).createEnergyOffer(5000, price))
        .to.emit(energyTrading, "EnergyOfferCreated");

      const offer = await energyTrading.getOffer(1);
      expect(offer.seller).to.equal(producer.address);
      expect(offer.energyAmount).to.equal(5000);
      expect(offer.remainingEnergy).to.equal(5000);
      expect(offer.active).to.equal(true);
    });

    it("prevents a consumer from creating an offer", async function () {
      await expect(
        energyTrading.connect(consumer).createEnergyOffer(5000, ethers.parseEther("0.006"))
      ).to.be.revertedWith("Only producers can do this");
    });

    it("rejects zero energy amount", async function () {
      await expect(
        energyTrading.connect(producer).createEnergyOffer(0, ethers.parseEther("0.006"))
      ).to.be.revertedWith("Energy amount must be greater than 0");
    });

    it("rejects zero price", async function () {
      await expect(
        energyTrading.connect(producer).createEnergyOffer(5000, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Purchasing", function () {
    const price = ethers.parseEther("0.006"); // per kWh (1000 Wh)

    beforeEach(async function () {
      await energyTrading.connect(producer).registerUser(Role.Producer);
      await energyTrading.connect(consumer).registerUser(Role.Consumer);
      await energyTrading.connect(producer).createEnergyOffer(5000, price); // 5 kWh
    });

    it("lets a registered consumer buy energy", async function () {
      const amount = 3000n; // 3 kWh
      const totalPrice = (amount * price) / 1000n;

      const sellerBalanceBefore = await ethers.provider.getBalance(producer.address);

      await expect(
        energyTrading.connect(consumer).buyEnergy(1, amount, { value: totalPrice })
      ).to.emit(energyTrading, "EnergyPurchased");

      const sellerBalanceAfter = await ethers.provider.getBalance(producer.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(totalPrice);

      const offer = await energyTrading.getOffer(1);
      expect(offer.remainingEnergy).to.equal(2000n);

      const trade = await energyTrading.getTrade(1);
      expect(trade.buyer).to.equal(consumer.address);
      expect(trade.seller).to.equal(producer.address);
      expect(trade.energyAmount).to.equal(amount);
    });

    it("rejects buying more than the remaining energy", async function () {
      const amount = 10000n; // more than the 5 kWh listed
      const totalPrice = (amount * price) / 1000n;
      await expect(
        energyTrading.connect(consumer).buyEnergy(1, amount, { value: totalPrice })
      ).to.be.revertedWith("Insufficient energy remaining");
    });

    it("rejects incorrect payment amount", async function () {
      const amount = 2000n;
      await expect(
        energyTrading.connect(consumer).buyEnergy(1, amount, { value: 1n })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("updates remaining energy and records the trade", async function () {
      await energyTrading.connect(consumer).buyEnergy(1, 2000n, {
        value: (2000n * price) / 1000n,
      });
      const trades = await energyTrading.getAllTrades();
      expect(trades.length).to.equal(1);

      const buyerUser = await energyTrading.getUser(consumer.address);
      expect(buyerUser.energyPurchased).to.equal(2000n);

      const sellerUser = await energyTrading.getUser(producer.address);
      expect(sellerUser.energySold).to.equal(2000n);
    });

    it("prevents a producer from buying energy", async function () {
      await expect(
        energyTrading.connect(producer2).buyEnergy(1, 1000n, {
          value: (1000n * price) / 1000n,
        })
      ).to.be.revertedWith("Not a registered user");
    });
  });

  describe("Cancellation", function () {
    const price = ethers.parseEther("0.006");

    beforeEach(async function () {
      await energyTrading.connect(producer).registerUser(Role.Producer);
      await energyTrading.connect(consumer).registerUser(Role.Consumer);
      await energyTrading.connect(producer).createEnergyOffer(5000, price);
    });

    it("lets the seller cancel their own offer", async function () {
      await expect(energyTrading.connect(producer).cancelOffer(1))
        .to.emit(energyTrading, "OfferCancelled")
        .withArgs(1, producer.address, anyValue);

      const offer = await energyTrading.getOffer(1);
      expect(offer.active).to.equal(false);
      expect(offer.cancelled).to.equal(true);
    });

    it("prevents other users from cancelling someone else's offer", async function () {
      await expect(
        energyTrading.connect(consumer).cancelOffer(1)
      ).to.be.revertedWith("Not the offer owner");
    });

    it("prevents purchasing a cancelled offer", async function () {
      await energyTrading.connect(producer).cancelOffer(1);
      await expect(
        energyTrading.connect(consumer).buyEnergy(1, 1000n, {
          value: (1000n * price) / 1000n,
        })
      ).to.be.revertedWith("Offer is not active");
    });
  });

  describe("Access control", function () {
    it("blocks unregistered users from creating offers", async function () {
      await expect(
        energyTrading.connect(stranger).createEnergyOffer(1000, ethers.parseEther("0.006"))
      ).to.be.revertedWith("Not a registered user");
    });

    it("blocks unregistered users from buying energy", async function () {
      await energyTrading.connect(producer).registerUser(Role.Producer);
      await energyTrading.connect(producer).createEnergyOffer(1000, ethers.parseEther("0.006"));
      await expect(
        energyTrading.connect(stranger).buyEnergy(1, 500, { value: ethers.parseEther("0.003") })
      ).to.be.revertedWith("Not a registered user");
    });
  });
});
