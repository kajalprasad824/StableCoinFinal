const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Nuchain Factory Smart Contract Deployment", function () {
  async function deployFactoryFixture() {
    const gas = (await ethers.provider.getFeeData()).gasPrice;
    const [defaultAdmin] = await ethers.getSigners();

    const factoryContract = await ethers.getContractFactory("NuChainFactory");
    const factory = await upgrades.deployProxy(
      factoryContract,
      [defaultAdmin.address, "1000000000000000", "300", "1"],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();

    return { defaultAdmin, factory, DEFAULT_ADMIN_ROLE };
  }

  it("Should set the right DEFAULT_ADMIN_ROLE of the factory contract", async function () {
    const {defaultAdmin,factory,DEFAULT_ADMIN_ROLE} = await loadFixture(deployFactoryFixture);
    expect(await factory.hasRole(DEFAULT_ADMIN_ROLE,defaultAdmin)).to.equal(true);

  });

  it("Should set the right reward rate", async function () {
    const {factory} = await loadFixture(deployFactoryFixture);
    expect(await factory.rewardRate()).to.equal("1000000000000000");

  });

  it("Should set the right trading fee", async function () {
    const {factory} = await loadFixture(deployFactoryFixture);
    expect(await factory.tradingFee()).to.equal("300");
  });

  it("Should set the right reward period", async function () {
    const {factory} = await loadFixture(deployFactoryFixture);
    expect(await factory.rewardPeriod()).to.equal("86400");
  });
});

  describe("Create Pool Function", function () {
    async function deployFactoryFixture() {
      const gas = (await ethers.provider.getFeeData()).gasPrice;
      const [defaultAdmin, addr1] = await ethers.getSigners();
  
      const factoryContract = await ethers.getContractFactory("NuChainFactory");
      const factory = await upgrades.deployProxy(
        factoryContract,
        [defaultAdmin.address, "1000000000000000", "300", "1"],
        {
          gasPrice: gas,
          initializer: "initialize",
        }
      );

      const USDTToken = await ethers.deployContract("USDT");

      const reserveAuditorContract = await ethers.getContractFactory(
        "ReserveAuditor"
      );
      const reserveAuditor = await upgrades.deployProxy(
        reserveAuditorContract,
        [defaultAdmin.address],
        {
          gasPrice: gas,
          initializer: "initialize",
        }
      );
  
      const stableCoinContract = await ethers.getContractFactory(
        "NuChainStablecoin"
      );
  
      const reserveAuditorAddress = await reserveAuditor.getAddress();
      const stableCoin = await upgrades.deployProxy(
        stableCoinContract,
        [defaultAdmin.address, reserveAuditorAddress, defaultAdmin.address],
        {
          gasPrice: gas,
          initializer: "initialize",
        }
      );
  
      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
  
      return { defaultAdmin, factory, DEFAULT_ADMIN_ROLE, addr1, USDTToken, stableCoin };
    }
  
    it("Should allow the default admin to call this function", async function () {
      const {defaultAdmin,factory, USDTToken, stableCoin} = await loadFixture(deployFactoryFixture);
      expect (await factory.connect(defaultAdmin).createPool(defaultAdmin,stableCoin,USDTToken));  
    });
  
    it("Should not allow other than the default admin to call this function", async function () {
        const {addr1,factory, USDTToken, stableCoin} = await loadFixture(deployFactoryFixture);
      expect (factory.connect(addr1).createPool(addr1,stableCoin,USDTToken)).to.be.revertedWithCustomError;
     
    });
  
    it("Should revert if contract is paused", async function () {
        const {defaultAdmin,factory, USDTToken, stableCoin} = await loadFixture(deployFactoryFixture);
        await factory.connect(defaultAdmin).pause();
        expect (factory.connect(defaultAdmin).createPool(defaultAdmin,stableCoin,USDTToken)).to.be.revertedWithCustomError;

    });
  
    it("Should revert if the pool for the stablecoin already exists", async function () {
      const {defaultAdmin,factory, USDTToken, stableCoin} = await loadFixture(deployFactoryFixture);
      await (factory.connect(defaultAdmin).createPool(defaultAdmin,stableCoin,USDTToken)); 
      await expect (factory.connect(defaultAdmin).createPool(defaultAdmin,stableCoin,USDTToken)).to.be.revertedWith("Pool already exists");
    });

    it("Should deploy the liquidity pool successfully", async function () {
      const {defaultAdmin,factory, USDTToken, stableCoin} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).createPool(defaultAdmin,stableCoin,USDTToken); 
      const poolAddress = await factory.poolInfo(USDTToken);
      expect(poolAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should emit the PoolCreated event", async function () {
      const {defaultAdmin,factory, USDTToken, stableCoin} = await loadFixture(deployFactoryFixture);
      expect (factory.connect(defaultAdmin).createPool(defaultAdmin,stableCoin,USDTToken)).to.emit(factory, "PoolCreated"); 
      
    });
  });

  describe("Update Trading Fee Function", function () {
    async function deployFactoryFixture() {
      const gas = (await ethers.provider.getFeeData()).gasPrice;
      const [defaultAdmin, addr1] = await ethers.getSigners();
  
      const factoryContract = await ethers.getContractFactory("NuChainFactory");
      const factory = await upgrades.deployProxy(
        factoryContract,
        [defaultAdmin.address, "1000000000000000", "300", "1"],
        {
          gasPrice: gas,
          initializer: "initialize",
        }
      );
  
      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
  
      return { defaultAdmin, factory, DEFAULT_ADMIN_ROLE, addr1 };
    }
  
    it("Should allow the default admin to call this function", async function () {
      const {defaultAdmin,factory} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).updateTradingFee("100");
      expect(await factory.tradingFee()).to.equal("100");
  
    });
  
    it("Should set the right trading fee", async function () {
        const {defaultAdmin,factory} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).updateTradingFee("100");
      expect(await factory.tradingFee()).to.equal("100");
    });
  
    it("Should not allow other than default admin to call this function", async function () {
        const {factory,addr1} = await loadFixture(deployFactoryFixture);
        expect(factory.connect(addr1).updateTradingFee("100")).to.be.revertedWithCustomError;

    });
  
    it("Should not allow to set the trading fee more than 10%", async function () {
        const {factory,defaultAdmin} = await loadFixture(deployFactoryFixture);
        expect(factory.connect(defaultAdmin).updateTradingFee("1100")).to.be.revertedWith("Fee too high");
    });
  });

  describe("Update Reward Rate Function", function () {
    async function deployFactoryFixture() {
      const gas = (await ethers.provider.getFeeData()).gasPrice;
      const [defaultAdmin, addr1] = await ethers.getSigners();
  
      const factoryContract = await ethers.getContractFactory("NuChainFactory");
      const factory = await upgrades.deployProxy(
        factoryContract,
        [defaultAdmin.address, "1000000000000000", "300", "1"],
        {
          gasPrice: gas,
          initializer: "initialize",
        }
      );
  
      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
  
      return { defaultAdmin, factory, DEFAULT_ADMIN_ROLE, addr1 };
    }
  
    it("Should allow the default admin to call this function", async function () {
      const {defaultAdmin,factory} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).updateRewardRate("100000000000000");
      expect(await factory.rewardRate()).to.equal("100000000000000");
  
    });
  
    it("Should set the right reward rate", async function () {
        const {defaultAdmin,factory} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).updateRewardRate("100000000000000");
      expect(await factory.rewardRate()).to.equal("100000000000000");
    });
  
    it("Should not allow other than default admin to call this function", async function () {
        const {factory,addr1} = await loadFixture(deployFactoryFixture);
        expect(factory.connect(addr1).updateRewardRate("100000000000")).to.be.revertedWithCustomError;

    });
  
    it("Should not allow to set the trading fee equal to zero", async function () {
        const {factory,defaultAdmin} = await loadFixture(deployFactoryFixture);
        expect(factory.connect(defaultAdmin).updateRewardRate(0)).to.be.revertedWith("Reward Rate cannot be equal to zero");
    });
  });


  describe("Update Reward Period Function", function () {
    async function deployFactoryFixture() {
      const gas = (await ethers.provider.getFeeData()).gasPrice;
      const [defaultAdmin, addr1] = await ethers.getSigners();
  
      const factoryContract = await ethers.getContractFactory("NuChainFactory");
      const factory = await upgrades.deployProxy(
        factoryContract,
        [defaultAdmin.address, "1000000000000000", "300", "1"],
        {
          gasPrice: gas,
          initializer: "initialize",
        }
      );
  
      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
  
      return { defaultAdmin, factory, DEFAULT_ADMIN_ROLE, addr1 };
    }
  
    it("Should allow the default admin to call this function", async function () {
      const {defaultAdmin,factory} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).updateRewardPeriod("2");
      expect(await factory.rewardPeriod()).to.equal("172800");
  
    });
  
    it("Should set the right reward period", async function () {
        const {defaultAdmin,factory} = await loadFixture(deployFactoryFixture);
      await factory.connect(defaultAdmin).updateRewardPeriod("2");
      expect(await factory.rewardPeriod()).to.equal("172800");
    });
  
    it("Should not allow other than default admin to call this function", async function () {
        const {factory,addr1} = await loadFixture(deployFactoryFixture);
        expect(factory.connect(addr1).updateRewardPeriod("2")).to.be.revertedWithCustomError;

    });
  
    it("Should not allow to set the reward period equal to zero", async function () {
        const {factory,defaultAdmin} = await loadFixture(deployFactoryFixture);
        expect(factory.connect(defaultAdmin).updateRewardPeriod("2")).to.be.revertedWith("Reward Period can not be equal to zero");
    });
  });