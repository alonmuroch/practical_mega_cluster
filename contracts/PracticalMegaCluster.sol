pragma solidity ^0.8.9;

import "ssv-network/contracts/interfaces/ISSVClusters.sol";
import "ssv-network/contracts/interfaces/ISSVOperators.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./libraries/UintArray.sol";
import "./libraries/EntityArray.sol";
import "./libraries/Shares.sol";
import "hardhat/console.sol";

contract PracticalMegaCluster is ERC20, ISSVOperators, ISSVClusters {
    using UintArray for uint[];
    using EntityArray for EntityArray.Entity[];
    using Shares for uint;

    address public ssv_network;
    address public ssv_token;

    uint256 public constant MAX_ENTITY = 6;
    uint256 public constant NEW_OPERATOR_CAPACITY = 500;
    uint256 public K;
    uint256 public C0;

    mapping(address => uint) public entity_address_to_index;
    EntityArray.Entity[] public entities;
    mapping(uint => uint) public operator_to_entity_index;
    uint public capacity;

    modifier onlyEntity() {
        require(entities[entity_address_to_index[msg.sender]].owner == msg.sender, "entity not registered");
        _;
    }

    event RegisteredOperator(bytes publicKey, uint operatorID);
    event RegisteredCluster(uint[4] entities, uint count, uint newCapacity);

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

        // initialize entities
        for (uint i=0 ; i < _entities.length; i++) {
            entity_address_to_index[_entities[i]] = i;

            entities.push(EntityArray.Entity({
                owner: _entities[i],
                capacity: 0
                })
            );
        }
    }

    // ##### Views
    function getEntities() public view returns (EntityArray.Entity[] memory) {
        return entities;
    }

    function getShareValue() public view returns (uint) {
        return capacity.shareValue(C0, K);
    }

    // ##### ISSVOperators

    /// @notice Registers a new operator
    /// @param publicKey The public key of the operator
    /// @param fee The operator's fee (SSV)
    function registerOperator(bytes calldata publicKey, uint256 fee) external onlyEntity returns (uint64) {
        // register operator
        uint64 operatorID = ISSVOperators(ssv_network).registerOperator(publicKey, fee);
        operator_to_entity_index[operatorID] = entity_address_to_index[msg.sender];

        // mint shares before updating capacity
        _mint(msg.sender, getShareValue());

        entities[entity_address_to_index[msg.sender]].capacity += NEW_OPERATOR_CAPACITY;
        capacity = entities.capacityArray().greedyClusterCalculation();

        emit RegisteredOperator(publicKey,operatorID);
    }

    /// @notice Removes an existing operator
    /// @param operatorId The ID of the operator to be removed
    function removeOperator(uint64 operatorId) external {
        revert("Function not implemented");
    }

    /// @notice Declares the operator's fee
    /// @param operatorId The ID of the operator
    /// @param fee The fee to be declared (SSV)
    function declareOperatorFee(uint64 operatorId, uint256 fee) external {
        revert("Function not implemented");
    }

    /// @notice Executes the operator's fee
    /// @param operatorId The ID of the operator
    function executeOperatorFee(uint64 operatorId) external {
        revert("Function not implemented");
    }

    /// @notice Cancels the declared operator's fee
    /// @param operatorId The ID of the operator
    function cancelDeclaredOperatorFee(uint64 operatorId) external {
        revert("Function not implemented");
    }

    /// @notice Reduces the operator's fee
    /// @param operatorId The ID of the operator
    /// @param fee The new Operator's fee (SSV)
    function reduceOperatorFee(uint64 operatorId, uint256 fee) external {
        revert("Function not implemented");
    }

    /// @notice Withdraws operator earnings
    /// @param operatorId The ID of the operator
    /// @param tokenAmount The amount of tokens to withdraw (SSV)
    function withdrawOperatorEarnings(uint64 operatorId, uint256 tokenAmount) external {
        revert("Function not implemented");
    }

    /// @notice Withdraws all operator earnings
    /// @param operatorId The ID of the operator
    function withdrawAllOperatorEarnings(uint64 operatorId) external {
        revert("Function not implemented");
    }

    /// @notice Sets the whitelist for an operator
    /// @param operatorId The ID of the operator
    /// @param whitelisted The address to be whitelisted
    function setOperatorWhitelist(uint64 operatorId, address whitelisted) external{
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
    ) external {
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
    ) external {
        require(operatorIds.length == 4, "registering validator requires 4 entities");
        // TODO - require operators are from 4 unique entities

        // approve for ssv contract
        if (!IERC20(ssv_token).approve(ssv_network, amount)) {
            revert("failed to approve SSV amount");
        }

        // validate capacity
        EntityArray.Entity[] memory _entities =  new EntityArray.Entity[](4);
        _entities[0] = entities[operator_to_entity_index[operatorIds[0]]];
        _entities[1] = entities[operator_to_entity_index[operatorIds[1]]];
        _entities[2] = entities[operator_to_entity_index[operatorIds[2]]];
        _entities[3] = entities[operator_to_entity_index[operatorIds[3]]];
        require(_entities.capacityArray().greedyClusterCalculation() >= sharesData.length, "not enough capacity");

        // register validators
        ISSVClusters(ssv_network).bulkRegisterValidator(
            publicKeys,
            operatorIds,
            sharesData,
            amount,
            cluster
        );

        // reduce capacity
        entities[operator_to_entity_index[operatorIds[0]]].capacity -= sharesData.length;
        entities[operator_to_entity_index[operatorIds[1]]].capacity -= sharesData.length;
        entities[operator_to_entity_index[operatorIds[2]]].capacity -= sharesData.length;
        entities[operator_to_entity_index[operatorIds[3]]].capacity -= sharesData.length;

        // recalculate capacity
        capacity = entities.capacityArray().greedyClusterCalculation();

        emit RegisteredCluster([
            operator_to_entity_index[operatorIds[0]],
            operator_to_entity_index[operatorIds[1]],
            operator_to_entity_index[operatorIds[2]],
            operator_to_entity_index[operatorIds[3]]
        ], sharesData.length, capacity);
    }

    /// @notice Removes an existing validator from the SSV Network
    /// @param publicKey The public key of the validator to be removed
    /// @param operatorIds Array of IDs of operators managing the validator
    /// @param cluster Cluster associated with the validator
    function removeValidator(bytes calldata publicKey, uint64[] memory operatorIds, Cluster memory cluster) external {
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
        revert("Function not implemented");
    }

    /**************************/
    /* Cluster External Functions */
    /**************************/

    /// @notice Liquidates a cluster
    /// @param owner The owner of the cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param cluster Cluster to be liquidated
    function liquidate(address owner, uint64[] memory operatorIds, Cluster memory cluster) external {
        revert("Function not implemented");
    }

    /// @notice Reactivates a cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param amount Amount of SSV tokens to be deposited for reactivation
    /// @param cluster Cluster to be reactivated
    function reactivate(uint64[] memory operatorIds, uint256 amount, Cluster memory cluster) external {
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
    function deposit(address owner, uint64[] memory operatorIds, uint256 amount, Cluster memory cluster) external {
        revert("Function not implemented");
    }

    /// @notice Withdraws tokens from a cluster
    /// @param operatorIds Array of IDs of operators managing the cluster
    /// @param tokenAmount Amount of SSV tokens to be withdrawn
    /// @param cluster Cluster where the withdrawal will be made
    function withdraw(uint64[] memory operatorIds, uint256 tokenAmount, Cluster memory cluster) external {
        revert("Function not implemented");
    }

    /// @notice Fires the exit event for a validator
    /// @param publicKey The public key of the validator to be exited
    /// @param operatorIds Array of IDs of operators managing the validator
    function exitValidator(bytes calldata publicKey, uint64[] calldata operatorIds) external {
        revert("Function not implemented");
    }

    /// @notice Fires the exit event for a set of validators
    /// @param publicKeys The public keys of the validators to be exited
    /// @param operatorIds Array of IDs of operators managing the validators
    function bulkExitValidator(bytes[] calldata publicKeys, uint64[] calldata operatorIds) external {
        revert("Function not implemented");
    }
}
