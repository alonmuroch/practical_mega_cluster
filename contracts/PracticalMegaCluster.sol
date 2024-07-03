// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;

import "ssv-network/contracts/interfaces/ISSVClusters.sol";
import "ssv-network/contracts/interfaces/ISSVOperators.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./libraries/UintArray.sol";
import "./libraries/EntityArray.sol";
import "./libraries/Shares.sol";
import "hardhat/console.sol";
import "./EntityProxy.sol";

contract PracticalMegaCluster is ERC20, ISSVOperators, ISSVClusters {
    using UintArray for uint[];
    using EntityArray for EntityArray.Entity[];
    using Shares for uint;

    address public ssv_network;
    address public ssv_token;

    uint public fee; // percent of 100

    uint256 public constant MAX_ENTITY = 6;
    uint256 public constant NEW_OPERATOR_CAPACITY = 500;
    uint256 public K;
    uint256 public C0;

    mapping(address => uint) public entity_address_to_index;
    EntityArray.Entity[] public entities;
    mapping(uint => uint) public operator_to_entity_index;

    modifier onlyEntity() {
        require(entities[entity_address_to_index[msg.sender]].owner == msg.sender, "entity not registered");
        _;
    }

    constructor(
        address _ssv_network,
        address _ssv_token,
        address[] memory _entities,
        uint _k,
        uint _C0
    ) ERC20("Mega Cluster Share", "PMC") {
        require(_entities.length <= MAX_ENTITY,"maxed out entities");
        require(_entities.length >= 4,"min 4 entities");

        // set globals
        ssv_network = _ssv_network;
        ssv_token = _ssv_token;
        K = _k;
        C0 = _C0;
        fee = 10; // TODO in constructor

        // initialize entities
        for (uint i=0 ; i < _entities.length; i++) {
            entity_address_to_index[_entities[i]] = i;

            EntityProxy proxy = new EntityProxy(address(this), ssv_network, ssv_token);

            entities.push(EntityArray.Entity({
                owner: _entities[i],
                proxy: address(proxy),
                capacity: 0
                })
            );
        }
    }

    // ##### IM rewards

    /**
        Requires a pre-claim from the merkle distributor to the proxy contract (see https://github.com/ssvlabs/ssv-rewards?tab=readme-ov-file)
    */
    function claimRewards(uint256 amount) external onlyEntity {
        uint entity_index = entity_address_to_index[msg.sender];

        // transfer from proxy to contract
        if (!EntityProxy(entities[entity_index].proxy).transferSSV(address(this), amount)) {
            revert("failed to transfer SSV amount");
        }

        // send to sender amount minus fee
        if (!ERC20(ssv_token).transfer(msg.sender, (amount*(100-fee)/100))) {
            revert("failed to transfer SSV amount");
        }
    }

    // ##### ERC20
    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        revert("shares are not transferable");
        return false;
    }

    // ##### Views
    function getEntities() public view returns (EntityArray.Entity[] memory) {
        return entities;
    }

    function getShareValue() public view returns (uint) {
        return getCapacity().shareValue(C0, K);
    }

    function getCapacity() public view returns (uint) {
        return entities.capacityArray().greedyClusterCalculation();
    }

    // ##### ISSVOperators

    /// @notice Registers a new operator
    /// @param publicKey The public key of the operator
    /// @param fee The operator's fee (SSV)
    function registerOperator(bytes calldata publicKey, uint256 fee) external onlyEntity returns (uint64) {
        uint entity_index = entity_address_to_index[msg.sender];
        // register operator
        uint64 operatorID = ISSVOperators(entities[entity_index].proxy).registerOperator(publicKey, fee);
        operator_to_entity_index[operatorID] = entity_index;

        // mint shares before updating capacity
        _mint(msg.sender, getShareValue());

        entities[entity_index].capacity += NEW_OPERATOR_CAPACITY;
    }

    /// @notice Removes an existing operator
    /// @param operatorId The ID of the operator to be removed
    function removeOperator(uint64 operatorId) pure external {
        revert("Function not implemented");
    }

    /// @notice Declares the operator's fee
    /// @param operatorId The ID of the operator
    /// @param fee The fee to be declared (SSV)
    function declareOperatorFee(uint64 operatorId, uint256 fee) pure external {
        revert("Function not implemented");
    }

    /// @notice Executes the operator's fee
    /// @param operatorId The ID of the operator
    function executeOperatorFee(uint64 operatorId) pure external {
        revert("Function not implemented");
    }

    /// @notice Cancels the declared operator's fee
    /// @param operatorId The ID of the operator
    function cancelDeclaredOperatorFee(uint64 operatorId) pure external {
        revert("Function not implemented");
    }

    /// @notice Reduces the operator's fee
    /// @param operatorId The ID of the operator
    /// @param fee The new Operator's fee (SSV)
    function reduceOperatorFee(uint64 operatorId, uint256 fee) pure external {
        revert("Function not implemented");
    }

    /// @notice Withdraws operator earnings
    /// @param operatorId The ID of the operator
    /// @param tokenAmount The amount of tokens to withdraw (SSV)
    function withdrawOperatorEarnings(uint64 operatorId, uint256 tokenAmount) pure external {
        revert("Function not implemented");
    }

    /// @notice Withdraws all operator earnings
    /// @param operatorId The ID of the operator
    function withdrawAllOperatorEarnings(uint64 operatorId) pure external {
        revert("Function not implemented");
    }

    /// @notice Sets the whitelist for an operator
    /// @param operatorId The ID of the operator
    /// @param whitelisted The address to be whitelisted
    function setOperatorWhitelist(uint64 operatorId, address whitelisted) pure external{
        revert("Function not implemented");
    }


    /// ##### ISSVClusters

    /// @notice Registers a new validator on the SSV Network
    /// @param publicKey The public key of the new validator
    /// @param operatorIds Array of IDs of operators managing this validator
    /// @param sharesData Encrypted shares related to the new validator
    /// @param amount Amount of SSV tokens to be deposited
    /// @param cluster Cluster to be used with the new validator
    function registerValidator(
        bytes calldata publicKey,
        uint64[] memory operatorIds,
        bytes calldata sharesData,
        uint256 amount,
        Cluster memory cluster
    ) pure external {
        revert("Function not implemented");
    }

    /// @notice Registers new validators on the SSV Network
    /// @param publicKeys The public keys of the new validators
    /// @param operatorIds Array of IDs of operators managing this validator
    /// @param sharesData Encrypted shares related to the new validators
    /// @param amount Amount of SSV tokens to be deposited
    /// @param cluster Cluster to be used with the new validator
    function bulkRegisterValidator(
        bytes[] calldata publicKeys,
        uint64[] memory operatorIds,
        bytes[] calldata sharesData,
        uint256 amount,
        Cluster memory cluster
    ) onlyEntity external {
        address proxy = entities[entity_address_to_index[msg.sender]].proxy;

        // transfer from user's account to contract
        if (!IERC20(ssv_token).transferFrom(msg.sender,address(this), amount)) {
            revert("failed to transfer SSV amount");
        }

        // transfer to proxy
        if (!IERC20(ssv_token).transfer(proxy, amount)) {
            revert("failed to transfer SSV amount");
        }

        // approve for ssv contract
        if (!EntityProxy(proxy).approveForSSV(amount)) {
            revert("failed to approve SSV amount");
        }

        // validate capacity
        EntityArray.Entity[] memory _entities =  new EntityArray.Entity[](4);
        for (uint i=0 ; i < operatorIds.length; i++) {
            _entities[i] = entities[operator_to_entity_index[operatorIds[i]]];
        }
        require(_entities.capacityArray().greedyClusterCalculation() >= sharesData.length, "not enough capacity");

        // register validators
        ISSVClusters(proxy).bulkRegisterValidator(
            publicKeys,
            operatorIds,
            sharesData,
            amount,
            cluster
        );

        // reduce capacity
        for (uint i=0 ; i < operatorIds.length; i++) {
            entities[operator_to_entity_index[operatorIds[i]]].capacity -= sharesData.length;
        }
    }

    /// @notice Removes an existing validator from the SSV Network
    /// @param publicKey The public key of the validator to be removed
    /// @param operatorIds Array of IDs of operators managing the validator
    /// @param cluster Cluster associated with the validator
    function removeValidator(bytes calldata publicKey, uint64[] memory operatorIds, Cluster memory cluster) onlyEntity view external {
        revert("Function not implemented");
    }

    /// @notice Bulk removes a set of existing validators in the same cluster from the SSV Network
    /// @notice Reverts if publicKeys contains duplicates or non-existent validators
    /// @param publicKeys The public keys of the validators to be removed
    /// @param operatorIds Array of IDs of operators managing the validator
    /// @param cluster Cluster associated with the validator
    function bulkRemoveValidator(
        bytes[] calldata publicKeys,
        uint64[] memory operatorIds,
        Cluster memory cluster
    ) external {
        require(operatorIds.length == 4, "registering validator requires 4 entities");

        // remove
        ISSVClusters(entities[entity_address_to_index[msg.sender]].proxy).bulkRemoveValidator(publicKeys, operatorIds, cluster);

        // increase capacity
        for (uint i=0 ; i < operatorIds.length; i++) {
            entities[operator_to_entity_index[operatorIds[i]]].capacity += publicKeys.length;
        }
    }

    /**************************/
    /* Cluster External Functions */
    /**************************/

    /// @notice Liquidates a cluster
    /// @param owner The owner of the cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param cluster Cluster to be liquidated
    function liquidate(address owner, uint64[] memory operatorIds, Cluster memory cluster) external {
        require(operatorIds.length == 4, "registering validator requires 4 entities");

        // liquidate
        address proxy = entities[entity_address_to_index[msg.sender]].proxy;
        ISSVClusters(proxy).liquidate(proxy, operatorIds, cluster);

        // increase capacity
        for (uint i=0 ; i < operatorIds.length; i++) {
            entities[operator_to_entity_index[operatorIds[i]]].capacity += cluster.validatorCount;
        }

        // transfer from contract to user's account to contract
        if (!EntityProxy(proxy).transferSSV(msg.sender, cluster.balance)) {
            revert("failed to transfer SSV amount back to user");
        }
    }

    /// @notice Reactivates a cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param amount Amount of SSV tokens to be deposited for reactivation
    /// @param cluster Cluster to be reactivated
    function reactivate(uint64[] memory operatorIds, uint256 amount, Cluster memory cluster) pure external {
        revert("Function not implemented");
    }

    /******************************/
    /* Balance External Functions */
    /******************************/

    /// @notice Deposits tokens into a cluster
    /// @param owner The owner of the cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param amount Amount of SSV tokens to be deposited
    /// @param cluster Cluster where the deposit will be made
    function deposit(address owner, uint64[] memory operatorIds, uint256 amount, Cluster memory cluster) pure external {
        revert("Function not implemented");
    }

    /// @notice Withdraws tokens from a cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param tokenAmount Amount of SSV tokens to be withdrawn
    /// @param cluster Cluster where the withdrawal will be made
    function withdraw(uint64[] memory operatorIds, uint256 tokenAmount, Cluster memory cluster) pure external {
        revert("Function not implemented");
    }

    /// @notice Fires the exit event for a validator
    /// @param publicKey The public key of the validator to be exited
    /// @param operatorIds Array of IDs of operators managing the validator
    function exitValidator(bytes calldata publicKey, uint64[] calldata operatorIds) pure external {
        revert("Function not implemented");
    }

    /// @notice Fires the exit event for a set of validators
    /// @param publicKeys The public keys of the validators to be exited
    /// @param operatorIds Array of IDs of operators managing the validators
    function bulkExitValidator(bytes[] calldata publicKeys, uint64[] calldata operatorIds) pure external {
        revert("Function not implemented");
    }
}
