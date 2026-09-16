// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EnergyTrading
/// @notice Records and settles peer-to-peer renewable energy trades.
/// @dev This contract does NOT move physical electricity. It only records
///      trade intent, energy quantities and payment settlement on-chain.
///      Physical electricity still flows through the normal grid.
contract EnergyTrading is ReentrancyGuard {
    enum Role {
        None,
        Producer,
        Consumer
    }

    struct User {
        address wallet;
        Role role;
        bool registered;
        uint256 registeredAt;
        uint256 energySold;
        uint256 energyPurchased;
        uint256 totalEarned;
        uint256 totalSpent;
    }

    struct EnergyOffer {
        uint256 id;
        address seller;
        uint256 energyAmount;    // original amount listed, in Wh (1 kWh = 1000)
        uint256 remainingEnergy; // Wh remaining, unsold
        uint256 pricePerKwh;     // price in wei, per kWh (1000 Wh)
        uint256 timestamp;
        bool active;
        bool cancelled;
    }

    struct Trade {
        uint256 id;
        uint256 offerId;
        address buyer;
        address seller;
        uint256 energyAmount; // Wh
        uint256 totalPrice;   // wei
        uint256 timestamp;
    }

    uint256 private nextOfferId = 1;
    uint256 private nextTradeId = 1;

    mapping(address => User) public users;
    address[] public registeredUsers;

    mapping(uint256 => EnergyOffer) public offers;
    uint256[] public offerIds;

    mapping(uint256 => Trade) public trades;
    uint256[] public tradeIds;

    mapping(address => uint256[]) private userTradeIds;
    mapping(address => uint256[]) private userOfferIds;

    event UserRegistered(address indexed wallet, Role role, uint256 timestamp);
    event EnergyOfferCreated(
        uint256 indexed offerId,
        address indexed seller,
        uint256 energyAmount,
        uint256 pricePerKwh,
        uint256 timestamp
    );
    event EnergyPurchased(
        uint256 indexed tradeId,
        uint256 indexed offerId,
        address indexed buyer,
        address seller,
        uint256 energyAmount,
        uint256 totalPrice,
        uint256 timestamp
    );
    event OfferCancelled(uint256 indexed offerId, address indexed seller, uint256 timestamp);

    modifier onlyRegistered() {
        require(users[msg.sender].registered, "Not a registered user");
        _;
    }

    modifier onlyProducer() {
        require(users[msg.sender].role == Role.Producer, "Only producers can do this");
        _;
    }

    modifier onlyConsumer() {
        require(users[msg.sender].role == Role.Consumer, "Only consumers can do this");
        _;
    }

    /// @notice Register the caller as a Producer or Consumer. One role per address.
    function registerUser(Role role) external {
        require(!users[msg.sender].registered, "Already registered");
        require(role == Role.Producer || role == Role.Consumer, "Invalid role");

        users[msg.sender] = User({
            wallet: msg.sender,
            role: role,
            registered: true,
            registeredAt: block.timestamp,
            energySold: 0,
            energyPurchased: 0,
            totalEarned: 0,
            totalSpent: 0
        });
        registeredUsers.push(msg.sender);

        emit UserRegistered(msg.sender, role, block.timestamp);
    }

    function getUser(address wallet) external view returns (User memory) {
        return users[wallet];
    }

    function getRegisteredUserCount() external view returns (uint256) {
        return registeredUsers.length;
    }

    /// @notice Create a new energy offer. energyAmount is in Wh, pricePerKwh in wei.
    function createEnergyOffer(uint256 energyAmount, uint256 pricePerKwh)
        external
        onlyRegistered
        onlyProducer
        returns (uint256)
    {
        require(energyAmount > 0, "Energy amount must be greater than 0");
        require(pricePerKwh > 0, "Price must be greater than 0");

        uint256 offerId = nextOfferId++;
        offers[offerId] = EnergyOffer({
            id: offerId,
            seller: msg.sender,
            energyAmount: energyAmount,
            remainingEnergy: energyAmount,
            pricePerKwh: pricePerKwh,
            timestamp: block.timestamp,
            active: true,
            cancelled: false
        });
        offerIds.push(offerId);
        userOfferIds[msg.sender].push(offerId);

        emit EnergyOfferCreated(offerId, msg.sender, energyAmount, pricePerKwh, block.timestamp);
        return offerId;
    }

    /// @notice Cancel an active offer. Only the seller may cancel their own offer.
    function cancelOffer(uint256 offerId) external onlyRegistered {
        EnergyOffer storage offer = offers[offerId];
        require(offer.id != 0, "Offer does not exist");
        require(offer.seller == msg.sender, "Not the offer owner");
        require(offer.active, "Offer is not active");

        offer.active = false;
        offer.cancelled = true;

        emit OfferCancelled(offerId, msg.sender, block.timestamp);
    }

    /// @notice Purchase `amount` Wh of energy from an active offer.
    /// @dev Follows checks-effects-interactions; payment forwarded to seller last.
    function buyEnergy(uint256 offerId, uint256 amount)
        external
        payable
        nonReentrant
        onlyRegistered
        onlyConsumer
    {
        EnergyOffer storage offer = offers[offerId];
        require(offer.id != 0, "Offer does not exist");
        require(offer.active, "Offer is not active");
        require(offer.seller != msg.sender, "Cannot buy your own offer");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= offer.remainingEnergy, "Insufficient energy remaining");

        uint256 totalPrice = (amount * offer.pricePerKwh) / 1000;
        require(msg.value == totalPrice, "Incorrect payment amount");

        // Effects
        offer.remainingEnergy -= amount;
        if (offer.remainingEnergy == 0) {
            offer.active = false;
        }

        address seller = offer.seller;

        User storage buyerUser = users[msg.sender];
        User storage sellerUser = users[seller];
        buyerUser.energyPurchased += amount;
        buyerUser.totalSpent += totalPrice;
        sellerUser.energySold += amount;
        sellerUser.totalEarned += totalPrice;

        uint256 tradeId = nextTradeId++;
        trades[tradeId] = Trade({
            id: tradeId,
            offerId: offerId,
            buyer: msg.sender,
            seller: seller,
            energyAmount: amount,
            totalPrice: totalPrice,
            timestamp: block.timestamp
        });
        tradeIds.push(tradeId);
        userTradeIds[msg.sender].push(tradeId);
        userTradeIds[seller].push(tradeId);

        // Interaction (last)
        (bool sent, ) = payable(seller).call{value: totalPrice}("");
        require(sent, "Payment transfer to seller failed");

        emit EnergyPurchased(tradeId, offerId, msg.sender, seller, amount, totalPrice, block.timestamp);
    }

    function getOffer(uint256 offerId) external view returns (EnergyOffer memory) {
        return offers[offerId];
    }

    function getAllOffers() external view returns (EnergyOffer[] memory) {
        EnergyOffer[] memory result = new EnergyOffer[](offerIds.length);
        for (uint256 i = 0; i < offerIds.length; i++) {
            result[i] = offers[offerIds[i]];
        }
        return result;
    }

    function getUserOffers(address wallet) external view returns (EnergyOffer[] memory) {
        uint256[] memory ids = userOfferIds[wallet];
        EnergyOffer[] memory result = new EnergyOffer[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = offers[ids[i]];
        }
        return result;
    }

    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    function getAllTrades() external view returns (Trade[] memory) {
        Trade[] memory result = new Trade[](tradeIds.length);
        for (uint256 i = 0; i < tradeIds.length; i++) {
            result[i] = trades[tradeIds[i]];
        }
        return result;
    }

    function getUserTrades(address wallet) external view returns (Trade[] memory) {
        uint256[] memory ids = userTradeIds[wallet];
        Trade[] memory result = new Trade[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = trades[ids[i]];
        }
        return result;
    }
}
