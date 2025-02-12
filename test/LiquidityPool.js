const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Liquidity Pool Smart contract", function () {
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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [defaultAdmin.address, stableCoin.target, usdt.target, factory.target],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    const DEFAULT_ADMIN_ROLE = await liquidityPool.DEFAULT_ADMIN_ROLE();

    return {
      defaultAdmin,
      factory,
      DEFAULT_ADMIN_ROLE,
      stableCoin,
      liquidityPool,
      usdt,
    };
  }

  it("Should set the right DEFAULT_ADMIN_ROLE of the factory contract", async function () {
    const { defaultAdmin, liquidityPool, DEFAULT_ADMIN_ROLE } =
      await loadFixture(deployFactoryFixture);
    expect(
      await liquidityPool.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin)
    ).to.equal(true);
  });

  it("Should set the right USDN address", async function () {
    const { liquidityPool, stableCoin } = await loadFixture(
      deployFactoryFixture
    );
    expect(await liquidityPool.USDN()).to.equal(stableCoin);
  });

  it("Should set the right paired stable coin address", async function () {
    const { liquidityPool, usdt } = await loadFixture(deployFactoryFixture);
    expect(await liquidityPool.stablecoin()).to.equal(usdt);
  });

  it("Should set the right factory address", async function () {
    const { liquidityPool, factory } = await loadFixture(deployFactoryFixture);
    expect(await liquidityPool.factory()).to.equal(factory);
  });
});

describe("Add Liquidity Function", function () {
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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [defaultAdmin.address, stableCoin.target, usdt.target, factory.target],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    return { defaultAdmin, factory, stableCoin, liquidityPool, usdt };
  }

  it("Should be able to set liquidity to pool", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));
    expect(liquidityPool.totalLiquidityUSDN()).to.not.equal(0);
  });

  it("Should update the variables accordingly", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));
    const userUSDNLiq = await liquidityPool.liquidityProviderInfo(defaultAdmin);
    expect(BigInt(userUSDNLiq.liquidityUSDN)).to.equal(
      ethers.parseEther("100")
    );
  });

  it("Should revert if factory contract is paused", async function () {
    const { defaultAdmin, liquidityPool, factory } = await loadFixture(
      deployFactoryFixture
    );
    await factory.connect(defaultAdmin).pause();
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"))
    ).to.be.revertedWith("Liquidity Pools are paused");
  });

  it("Should revert if _amountUSDN value is zero", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .addLiquidity(0, ethers.parseEther("100"))
    ).to.be.revertedWith("Invalid Amount");
  });

  it("Should revert if _amountStablecoin value is zero", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .addLiquidity(ethers.parseEther("100"), 0)
    ).to.be.revertedWith("Invalid Amount");
  });

  it("Should allow users to add liquidity more than once", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));

    const userUSDNLiq = await liquidityPool.liquidityProviderInfo(defaultAdmin);
    expect(BigInt(userUSDNLiq.liquidityUSDN)).to.equal(
      ethers.parseEther("200")
    );
  });

  it("Should sent rewards to user if their reawrd period is complete during calling of this function", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    const rewardsBefore = await liquidityPool.calculateReward(defaultAdmin);
    expect(rewardsBefore).to.not.equal(0);

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));
    const rewardsAfter = await liquidityPool.calculateReward(defaultAdmin);
    expect(rewardsAfter).to.equal(0);
  });

  it("Should emit LiquidityAdded event", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"))
    ).to.emit(liquidityPool, "LiquidityAdded");
  });
});

describe("Remove Liquidity Function", function () {
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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [defaultAdmin.address, stableCoin.target, usdt.target, factory.target],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));
    expect(liquidityPool.totalLiquidityUSDN()).to.not.equal(0);

    return { defaultAdmin, factory, stableCoin, liquidityPool, usdt };
  }

  it("Should be able to remove liquidity if user is a liquidity provider", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .removeLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));
    expect(await liquidityPool.totalLiquidityUSDN()).to.equal(
      ethers.parseEther("90")
    );
  });

  it("Should update the variables accordingly", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .removeLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));
    const userUSDNLiq = await liquidityPool.liquidityProviderInfo(defaultAdmin);
    expect(BigInt(userUSDNLiq.liquidityUSDN)).to.equal(ethers.parseEther("90"));
  });

  it("Should revert if factory contract is paused", async function () {
    const { defaultAdmin, liquidityPool, factory } = await loadFixture(
      deployFactoryFixture
    );
    await factory.connect(defaultAdmin).pause();
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .removeLiquidity(ethers.parseEther("100"), ethers.parseEther("100"))
    ).to.be.revertedWith("Liquidity Pools are paused");
  });

  it("Should revert if _amountUSDN value is zero", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .removeLiquidity(0, ethers.parseEther("100"))
    ).to.be.revertedWith("Invalid Amount");
  });

  it("Should revert if _amountStablecoin value is zero", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .removeLiquidity(ethers.parseEther("100"), 0)
    ).to.be.revertedWith("Invalid Amount");
  });

  it("Should allow users to remove liquidity more than once", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );

    await liquidityPool
      .connect(defaultAdmin)
      .removeLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await liquidityPool
      .connect(defaultAdmin)
      .removeLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    const userUSDNLiq = await liquidityPool.liquidityProviderInfo(defaultAdmin);
    expect(BigInt(userUSDNLiq.liquidityUSDN)).to.equal(ethers.parseEther("80"));
  });

  it("Should sent rewards to user if their reawrd period is complete during calling of this function", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    const rewardsBefore = await liquidityPool.calculateReward(defaultAdmin);
    expect(rewardsBefore).to.not.equal(0);

    await liquidityPool
      .connect(defaultAdmin)
      .removeLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));
    const rewardsAfter = await liquidityPool.calculateReward(defaultAdmin);
    expect(rewardsAfter).to.equal(0);
  });

  it("Should emit LiquidityRemoved event", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .removeLiquidity(ethers.parseEther("10"), ethers.parseEther("10"))
    ).to.emit(liquidityPool, "LiquidityRemoved");
  });
});

describe("Swap Function", function () {
  async function deployFactoryFixture() {
    const gas = (await ethers.provider.getFeeData()).gasPrice;
    const [defaultAdmin, addr1, addr2] = await ethers.getSigners();

    const factoryContract = await ethers.getContractFactory("NuChainFactory");
    const factory = await upgrades.deployProxy(
      factoryContract,
      [defaultAdmin.address, "1000000000000000", "300", "1"],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    // const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [
        defaultAdmin.address,
        await stableCoin.getAddress(),
        await usdt.getAddress(),
        await factory.getAddress(),
      ],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));
    expect(liquidityPool.totalLiquidityUSDN()).to.not.equal(0);

    await stableCoin
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("100"));
    await usdt.connect(defaultAdmin).transfer(addr1, ethers.parseEther("100"));

    return {
      defaultAdmin,
      factory,
      stableCoin,
      liquidityPool,
      usdt,
      addr1,
      addr2,
    };
  }

  it("Should be able to swap USDN for Stablecoin successfully", async function () {
    const { defaultAdmin, liquidityPool, addr1, stableCoin, usdt } =
      await loadFixture(deployFactoryFixture);

    const swapAmount = ethers.parseEther("10");
    await stableCoin.connect(addr1).approve(liquidityPool, swapAmount);
    await liquidityPool.connect(addr1).swap(stableCoin, usdt, swapAmount);
    expect(await stableCoin.balanceOf(addr1)).to.equal(ethers.parseEther("90"));
  });

  it("Should be able to swap Stablecoin for USDN successfully", async function () {
    const { defaultAdmin, liquidityPool, addr1, stableCoin, usdt } =
      await loadFixture(deployFactoryFixture);

    const swapAmount = ethers.parseEther("10");
    await usdt.connect(addr1).approve(liquidityPool, swapAmount);
    await liquidityPool.connect(addr1).swap(usdt, stableCoin, swapAmount);
    expect(await usdt.balanceOf(addr1)).to.equal(ethers.parseEther("90"));
  });

  it("Should revert for invalid token pair", async function () {
    const { defaultAdmin, liquidityPool, addr1, stableCoin, usdt } =
      await loadFixture(deployFactoryFixture);

    const swapAmount = ethers.parseEther("10");
    await stableCoin.connect(addr1).approve(liquidityPool, swapAmount);
    await expect(
      liquidityPool.connect(addr1).swap(stableCoin, defaultAdmin, swapAmount)
    ).to.be.revertedWith("Invalid token pair");
  });

  it("Should revert if factory contract is paused", async function () {
    const { defaultAdmin, liquidityPool, factory, stableCoin, addr1 } =
      await loadFixture(deployFactoryFixture);
    await factory.connect(defaultAdmin).pause();
    const swapAmount = ethers.parseEther("10");
    await stableCoin.connect(addr1).approve(liquidityPool, swapAmount);
    await expect(
      liquidityPool.connect(addr1).swap(stableCoin, defaultAdmin, swapAmount)
    ).to.be.revertedWith("Liquidity Pools are paused");
  });

  it("Should revert for insufficient liquidity in the pool", async function () {
    const { defaultAdmin, liquidityPool, stableCoin, usdt } = await loadFixture(
      deployFactoryFixture
    );

    const swapAmount = ethers.parseEther("10000");
    await stableCoin.connect(defaultAdmin).approve(liquidityPool, swapAmount);
    await expect(
      liquidityPool.connect(defaultAdmin).swap(stableCoin, usdt, swapAmount)
    ).to.be.revertedWith("Insufficient Liquidty for Stablecoin");
  });

  it("Should revert if token transfer fails", async function () {
    const { addr1, liquidityPool, stableCoin, usdt } = await loadFixture(
      deployFactoryFixture
    );

    const swapAmount = ethers.parseEther("10");
    await stableCoin.connect(addr1).approve(liquidityPool, swapAmount);
    expect(
      liquidityPool
        .connect(addr1)
        .swap(stableCoin, usdt, ethers.parseEther("20"))
    ).to.be.revertedWithCustomError;
  });

  it("Should apply the trading fee correctly", async function () {
    const { defaultAdmin, addr2, liquidityPool, stableCoin, usdt } =
      await loadFixture(deployFactoryFixture);

    const amountIn = ethers.parseEther("10");
    await stableCoin.connect(defaultAdmin).transfer(addr2, amountIn);
    await stableCoin
      .connect(addr2)
      .approve(await liquidityPool.getAddress(), amountIn);

    const fee = (amountIn * BigInt(300)) / BigInt(10000);
    const amountOut = amountIn - fee;
    await liquidityPool
      .connect(addr2)
      .swap(await stableCoin.getAddress(), await usdt.getAddress(), amountIn);
    const userStablecoinBalnace = await usdt.balanceOf(addr2);

    expect(amountOut).to.equal(userStablecoinBalnace);
  });

  it("Should emit event Swapped after successful Swapping", async function () {
    const { defaultAdmin, liquidityPool, addr1, stableCoin, usdt } =
      await loadFixture(deployFactoryFixture);

    const swapAmount = ethers.parseEther("10");
    await stableCoin.connect(addr1).approve(liquidityPool, swapAmount);
    await liquidityPool.connect(addr1).swap(stableCoin, usdt, swapAmount);
    expect(await stableCoin.balanceOf(addr1)).to.equal(ethers.parseEther("90"));
  });
});

describe("Calculate Reward Function", function () {
  async function deployFactoryFixture() {
    const gas = (await ethers.provider.getFeeData()).gasPrice;
    const [defaultAdmin, addr1, addr2] = await ethers.getSigners();

    const factoryContract = await ethers.getContractFactory("NuChainFactory");
    const factory = await upgrades.deployProxy(
      factoryContract,
      [defaultAdmin.address, "1000000000000000", "300", "1"],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    // const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [
        defaultAdmin.address,
        await stableCoin.getAddress(),
        await usdt.getAddress(),
        await factory.getAddress(),
      ],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("10000"));

    await stableCoin
      .connect(addr1)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(addr1)
      .approve(liquidityPool, ethers.parseEther("10000"));

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    return {
      defaultAdmin,
      factory,
      stableCoin,
      liquidityPool,
      usdt,
      addr1,
      addr2,
    };
  }

  it("Should return zero if user has no added liqidity", async function () {
    const { defaultAdmin, liquidityPool, addr1 } = await loadFixture(
      deployFactoryFixture
    );

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));

    const reward = await liquidityPool.calculateReward(addr1);
    expect(reward).to.equal(0);
  });

  it("Should return zero if user reward period is not completed", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));
    const reward = await liquidityPool.calculateReward(addr1);
    expect(reward).to.equal(0);
  });

  it("Should not return zero if user reward period is completed", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    const reward = await liquidityPool.calculateReward(addr1);
    expect(reward).to.not.equal(0);
  });

  it("Should return the correct value of reward for a particular user", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    const reward = await liquidityPool.calculateReward(addr1);
    expect(reward).to.equal(ethers.parseEther("0.001"));
  });

  it("Should revert if there is no liquidity in the pool", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);
    await expect(liquidityPool.calculateReward(addr1)).to.be.revertedWith(
      "No Liquidity in Pool"
    );
  });

  it("Should return zero if user already claimed reward and calling before reward period", async function () {
    const { defaultAdmin, liquidityPool, addr1 } = await loadFixture(
      deployFactoryFixture
    );

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));
    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    await liquidityPool.connect(addr1).claimReward();

    const reward = await liquidityPool.calculateReward(addr1);
    expect(reward).to.equal(0);
  });
});

describe("Claim Reward Function", function () {
  async function deployFactoryFixture() {
    const gas = (await ethers.provider.getFeeData()).gasPrice;
    const [defaultAdmin, addr1, addr2] = await ethers.getSigners();

    const factoryContract = await ethers.getContractFactory("NuChainFactory");
    const factory = await upgrades.deployProxy(
      factoryContract,
      [defaultAdmin.address, "1000000000000000", "300", "1"],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    // const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [
        defaultAdmin.address,
        await stableCoin.getAddress(),
        await usdt.getAddress(),
        await factory.getAddress(),
      ],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("10000"));

    await stableCoin
      .connect(addr1)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(addr1)
      .approve(liquidityPool, ethers.parseEther("10000"));

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    return {
      defaultAdmin,
      factory,
      stableCoin,
      liquidityPool,
      usdt,
      addr1,
      addr2,
    };
  }

  it("Should revert if factory contract is paused", async function () {
    const { defaultAdmin, liquidityPool, addr1, factory } = await loadFixture(
      deployFactoryFixture
    );

    await factory.connect(defaultAdmin).pause();

    await expect(
      liquidityPool.connect(defaultAdmin).claimReward()
    ).to.be.revertedWith("Liquidity Pools are paused");
  });

  it("Should revert if user reward period is not completed", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));
    await expect(liquidityPool.connect(addr1).claimReward()).to.be.revertedWith(
      "Reward cooldown period not met"
    );
  });

  it("Should revert if there is no rewards to claim", async function () {
    const { liquidityPool, addr1, defaultAdmin } = await loadFixture(
      deployFactoryFixture
    );

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));

    await expect(liquidityPool.connect(addr1).claimReward()).to.revertedWith(
      "No rewards to claim"
    );
  });

  it("Should be able to claim reward successfully if all conditions meet", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    const beforeRewardClaim = await liquidityPool.calculateReward(addr1);
    expect(beforeRewardClaim).to.equal(ethers.parseEther("0.001"));

    await liquidityPool.connect(addr1).claimReward();
    const afterRewardClaim = await liquidityPool.calculateReward(addr1);
    expect(afterRewardClaim).to.equal(0);
  });

  it("Should update variables correctly after execution of this function", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    const beforeTotalLiquidityUSDN = await liquidityPool.totalLiquidityUSDN();
    expect(beforeTotalLiquidityUSDN).to.equal(ethers.parseEther("10"));

    await liquidityPool.connect(addr1).claimReward();
    const afterTotalLiquidityUSDN = await liquidityPool.totalLiquidityUSDN();
    const expectedValue = beforeTotalLiquidityUSDN - ethers.parseEther("0.001");
    expect(expectedValue).to.be.equal(afterTotalLiquidityUSDN);
  });

  it("Should emit event RewardClaimed after successful reawrd claim", async function () {
    const { liquidityPool, addr1 } = await loadFixture(deployFactoryFixture);

    await liquidityPool
      .connect(addr1)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [86402]); // Increase time by X seconds
    await ethers.provider.send("evm_mine", []);

    await expect(liquidityPool.connect(addr1).claimReward()).to.emit(
      liquidityPool,
      "RewardClaimed"
    );
  });
});

describe("Rebalance Peg Function", function () {
  async function deployFactoryFixture() {
    const gas = (await ethers.provider.getFeeData()).gasPrice;
    const [defaultAdmin, addr1, addr2] = await ethers.getSigners();

    const factoryContract = await ethers.getContractFactory("NuChainFactory");
    const factory = await upgrades.deployProxy(
      factoryContract,
      [defaultAdmin.address, "1000000000000000", "300", "1"],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    // const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [
        defaultAdmin.address,
        await stableCoin.getAddress(),
        await usdt.getAddress(),
        await factory.getAddress(),
      ],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .transfer(addr1, ethers.parseEther("10000"));

    await stableCoin
      .connect(addr1)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(addr1)
      .approve(liquidityPool, ethers.parseEther("10000"));

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    return {
      defaultAdmin,
      factory,
      stableCoin,
      liquidityPool,
      usdt,
      addr1,
      addr2,
    };
  }

  it("Should allow default admin to call this function", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .rebalancePeg(ethers.parseEther("100"), true);
    expect(await liquidityPool.totalLiquidityUSDN()).to.equal(
      ethers.parseEther("100")
    );
  });

  it("Should not allow other than default admin to call this function", async function () {
    const { addr1, liquidityPool } = await loadFixture(deployFactoryFixture);
    expect(
      liquidityPool.connect(addr1).rebalancePeg(ethers.parseEther("100"), true)
    ).to.be.revertedWithCustomError;
  });

  it("Should update the variables correctly", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .rebalancePeg(ethers.parseEther("200"), true);

    expect(await liquidityPool.totalLiquidityUSDN()).to.equal(
      ethers.parseEther("200")
    );
  });

  it("Should add liquidity in USDN if isAddLiquidityToUSDN is true", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .rebalancePeg(ethers.parseEther("200"), true);

    expect(await liquidityPool.totalLiquidityUSDN()).to.equal(
      ethers.parseEther("200")
    );
  });

  it("Should add liquidity in stablecoin if isAddLiquidityToUSDN is false", async function () {
    const { defaultAdmin, liquidityPool } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .rebalancePeg(ethers.parseEther("200"), false);

    expect(await liquidityPool.totalLiquidityStablecoin()).to.equal(
      ethers.parseEther("200")
    );
  });

  it("Should emit event PegRebalanced after successful reawrd claim", async function () {
    const { liquidityPool, defaultAdmin } = await loadFixture(
      deployFactoryFixture
    );

    await expect(
      liquidityPool
        .connect(defaultAdmin)
        .rebalancePeg(ethers.parseEther("200"), true)
    ).to.emit(liquidityPool, "PegRebalanced");
  });
});

describe("Withdraw Token Function", function () {
  async function deployFactoryFixture() {
    const gas = (await ethers.provider.getFeeData()).gasPrice;
    const [defaultAdmin, addr1, addr2] = await ethers.getSigners();

    const factoryContract = await ethers.getContractFactory("NuChainFactory");
    const factory = await upgrades.deployProxy(
      factoryContract,
      [defaultAdmin.address, "1000000000000000", "300", "1"],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

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

    const LiquidityPool = await ethers.getContractFactory("Liquiditypool");

    // const USDT = await ethers.getContractFactory("USDT");

    const usdt = await ethers.deployContract("USDT");

    const liquidityPool = await upgrades.deployProxy(
      LiquidityPool,
      [
        defaultAdmin.address,
        await stableCoin.getAddress(),
        await usdt.getAddress(),
        await factory.getAddress(),
      ],
      {
        gasPrice: gas,
        initializer: "initialize",
      }
    );

    await stableCoin
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));
    await usdt
      .connect(defaultAdmin)
      .approve(liquidityPool, ethers.parseEther("10000"));

    await liquidityPool
      .connect(defaultAdmin)
      .addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"));

    return {
      defaultAdmin,
      factory,
      stableCoin,
      liquidityPool,
      usdt,
      addr1,
      addr2,
    };
  }

  it("Should allow default admin to call this function", async function () {
    const { defaultAdmin, liquidityPool, stableCoin } = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool
      .connect(defaultAdmin)
      .withdrawToken(defaultAdmin,stableCoin,ethers.parseEther("10"));
    expect(await liquidityPool.totalLiquidityUSDN()).to.equal(
      ethers.parseEther("90")
    );
  });

  it("Should not allow other than default admin to call this function", async function () {
    const { defaultAdmin, liquidityPool, stableCoin } = await loadFixture(deployFactoryFixture);
    expect(
      liquidityPool.connect(defaultAdmin).withdrawToken(defaultAdmin,stableCoin,ethers.parseEther("10"))
    ).to.be.revertedWithCustomError;
  });

  it("Should update the variables correctly USDN liquidity", async function () {
    const { defaultAdmin, liquidityPool, stableCoin} = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool.connect(defaultAdmin).withdrawToken(defaultAdmin,stableCoin,ethers.parseEther("10"));

    expect(await liquidityPool.totalLiquidityUSDN()).to.equal(
      ethers.parseEther("90")
    );
  });

  it("Should update the variables correctly Stablecoin liquidity", async function () {
    const { defaultAdmin, liquidityPool, usdt} = await loadFixture(
      deployFactoryFixture
    );
    await liquidityPool.connect(defaultAdmin).withdrawToken(defaultAdmin,usdt,ethers.parseEther("10"));

    expect(await liquidityPool.totalLiquidityStablecoin()).to.equal(
      ethers.parseEther("90")
    );
  });

});
