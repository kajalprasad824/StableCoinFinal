# Reserve Auditor, NuChain Stablecoin, NuChain Stacking, NuChian Factory and Liquidity pool Contracts

## Overview

This repository contains Solidity smart contracts for the Reserve Auditor, NuChain Stablecoin, NuChain Staking, NuChain Factory and Liquidity pool. The environment is set up using Hardhat, a powerful development framework for Ethereum-based smart contracts.

### Key Components:

1. Reserve Auditor: It is designed to monitor and audit the reserves ensuring transparency and accountability. The smart contract allows for auditing the reserve balance and providing an easy-to-understand report of the current reserve status.

2. NuChain Stablecoin (USDN): The NuChainStablecoin is an asset-backed, feature-rich stablecoin adhering to modern security, compliance, and scalability standards.

3. NuChain Staking: It implements a staking system for USDN Stablecoin with the ability to claim rewards, stake, and withdraw tokens.

4. NuChain Factory: It is a factory that creates and manages liquidity pools for various stablecoins. It allows for the creation of new pools, as well as the updating of key parameters like trading fees, reward rates, and reward periods.

5. Liquidity pool: It facilitates the addition and removal of liquidity, swapping between USDN and a paired stablecoin, reward distribution for liquidity providers, and peg rebalancing.

### Contracts

### 1. Reserve Auditor (ReserveAuditor.sol)

The ReserveAuditor contract provides functions to record and verify stablecoin reserves, ensuring that reserves are sufficient for specific operations.

### Features:

* Reserve Recording: Allows the recording of reserve amounts associated with a specific stablecoin.

* Reserve Verification: Verifies if the recorded reserves are sufficient to cover a required amount.

* Role-Based Access Control: Only authorized users (e.g., managers or admins) can interact with certain functions.

* Upgradeable Architecture: Uses OpenZeppelin's Initializable and AccessControlUpgradeable for upgradeability and access control.

### Key Functions:

* initialize: Initializes the contract with a default admin role.

* recordReserve: Records a new reserve entry, adding the amount to the reserve history.

* setStableCoinAddress: Sets the stablecoin address that the reserves are associated with.

* verifyReserves: Verifies if the current reserve is sufficient to cover a specified required reserve.


### 2. NuChain Stablecoin (NuChainStablecoin.sol)

This smart contract is a asset-backed stablecoin implementation that uses multiple OpenZeppelin upgradeable contracts and integrates several security features, including role-based access control and freeze functionality.

### Features:

* Asset-Backed: USDN is minted and burned in accordance with the reserves held in the contract. Minting is tied to maintaining a specified reserve ratio.

* Max Supply: USDN is capped at a total supply of 2 billion tokens to ensure scarcity.

* Role-Based Access Control: Access control is implemented with specific roles to restrict minting, burning, pausing, and asset protection functionalities.

* Transaction Fee: A configurable transaction fee that can be deducted on each transfer, with the fee sent to the treasury wallet (If enabled).

* Pausing and Freezing: The contract supports pausing of all operations and freezing of accounts for compliance or security purposes.

* Reserve Auditing: The contract integrates with an external reserve auditor to verify that the contract maintains adequate reserves.

### Key Functions:

* initialize: Initializes the contract with a default admin role.

* mint: Mints new USDN tokens to a specified address. Minting is restricted by the reserve ratio and requires approval from the authorized roles.

* burn: Burns a specified amount of USDN tokens from the caller’s balance. Burning adjusts the reserve balance accordingly.

* freeze: Freezes a specific account, preventing it from making transactions until unfrozen.

* unfreeze: Unfreezes a previously frozen account, allowing it to resume transactions.

* wipeFrozenAddress: Burns the entire balance of a frozen address.

* setTransactionFee: Sets the transaction fee as a percentage (in basis points, e.g., 100 = 1%) to be deducted on each transfer.

* setTreasuryWallet: Sets the address of the treasury wallet where transaction fees are collected.

* pause: Pauses all token transfers and contract operations.

* unpause: Resumes token transfers and contract operations after a pause.


### 3. NuChain Staking (NuChainStaking.sol)

The NuChainStaking contract allows users to stake tokens and earn rewards over time. The contract ensures that rewards are calculated based on the amount staked, the time elapsed, and a configurable reward rate.

### Features:

* Staking: Users can stake tokens and start earning rewards based on the staking amount and time.

* Rewards: Earn daily rewards in the form of tokens. The reward rate is configurable by the admin.

* Claiming Rewards: Users can claim rewards based on the amount staked and the time elapsed since the last claim.

* Withdrawals: Users can withdraw staked tokens while maintaining their reward balance.

* Admin Control: The admin has the ability to change the reward rate and the minimum staking amount required.

* Security: The contract includes ReentrancyGuard and AccessControl for safe operations and role management.

### Key Functions:

* initialize: Initializes the contract with the stablecoin USDN address, admin address, reward rate per day, and minimum staking amount.

* stake: Allows users to stake a specified amount of tokens in the contract and earn rewards over time.

* withdraw: Allows users to withdraw a specified amount of their staked tokens while claiming any pending rewards.

* claimReward: Allows users to claim their pending rewards if available.

* updateRewardRate: Allows the admin to update the daily reward rate.

* updateTransactionAmount: Allows the admin to update the minimum staking amount required.

* viewPendingReward: Allows users to check the amount of rewards they can claim.

### 4. NuChain Factory (NuChainFactory.sol)

The NuChainFactory contract is a factory that creates and manages liquidity pools for stablecoins. It provides functions for creating new pools, updating configuration parameters such as trading fees and reward rates, and managing the contract's paused state.

### Features:

* Pool Creation: Allows the creation of liquidity pools for stablecoins by the default admin.

* Admin Control: The contract provides functionality for the admin to update trading fees, reward rates, and the reward period.

* Pause and Unpause: The contract supports pausing and unpausing to temporarily halt operations when needed.

* Normalize/Denormalize: Functions to normalize and denormalize amounts of stablecoins with different decimal places.

* Role-based Access Control: The contract uses OpenZeppelin's AccessControl to ensure secure permissions, with roles for admins and pausers.

### Key Functions:

* initialize: Initializes the factory contract with default admin, reward rate, trading fee, and reward period.

* createPool: Creates a new liquidity pool for a stablecoin and assigns it to the corresponding stablecoin address.

* updateTradingFee: Allows the admin to update the trading fee, ensuring it does not exceed 10%.

* updateRewardRate: Allows the admin to update the reward rate for liquidity pool participants.

* updateRewardPeriod: Allows the admin to update the reward period, after which users can claim rewards.

* pause: Pauses the contract, temporarily halting operations (only callable by admin or pauser).

* unpause: Unpauses the contract, resuming operations (only callable by admin or pauser).

* normalize: Normalizes an amount by adjusting for the decimal places of a stablecoin.

* denormalize: Denormalizes an amount by adjusting for the decimal places of a stablecoin.

* allPoolAddresses: Returns all deployed liquidity pool addresses.

* allStablecoinAddresses: Returns all stablecoin addresses for which liquidity pools have been created.


### 5. Liquidity Pool (LiquidityPool.sol)

The LiquidityPool contract facilitates the management of liquidity between USDN and a paired stablecoin, allowing liquidity providers to add/remove liquidity, swap tokens, and earn rewards based on their contributions.

### Features:

* Liquidity Management: Allows users to add or remove liquidity to/from the pool in USDN and a paired stablecoin.

* Token Swapping: Facilitates swapping between USDN and the paired stablecoin, applying trading fees and adjusting pool balances.

* Reward Calculation and Claiming: Liquidity providers earn rewards based on their liquidity and the time their funds remain in the pool. They can claim rewards once the cooldown period is met.

* Peg Rebalancing: The admin can rebalance the liquidity pool by adding liquidity to USDN or the paired stablecoin.

* Role-Based Access Control: Only authorized users (such as the admin) can access sensitive functions, ensuring security.

* Upgradeable Architecture: The contract uses OpenZeppelin's Initializable and AccessControlUpgradeable to support upgrades and manage roles effectively.

### Key Functions:

* initialize: Initializes the contract with the addresses of the default admin, USDN, paired stablecoin, and the factory contract.

* addLiquidity: Allows a user to add liquidity in the form of USDN and the paired stablecoin to the pool.

* removeLiquidity: Allows a user to remove liquidity from the pool, including any earned rewards.

* swap: Facilitates the swapping of USDN and paired stablecoin within the pool, applying a trading fee.

* calculateReward: Calculates the reward a liquidity provider is entitled to, based on their share of the total liquidity.

* claimReward: Allows a liquidity provider to claim their earned rewards after the cooldown period.

* rebalancePeg: Allows the admin to rebalance the liquidity pool by adding liquidity to USDN or the paired stablecoin.


## Getting Started

### Prerequisites:

* Node.js: Install the latest version of Node.js.
* Hardhat: Install Hardhat using npm.

```bash
npm install --save-dev hardhat
```

### Install Dependencies:

* To set up the project, clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/BlockonVentures/nuchain-stablecoin-contract.git
cd nuchain-stablecoin-contract
npm install
```

### Compile Contracts:

* Compile the smart contracts using Hardhat

```bash
npx hardhat compile
```

### Run Tests:

* Execute the test cases to validate the functionality of the contracts

```bash
npx hardhat test
```

### Deployment Script:

* Execute the deployment script to deploy the smart contract on the blockchain.

```bash
npx hardhat run --network "blockhain network" ignition/modules/"deploymentFile"
```

## License
This project is licensed under the MIT License.