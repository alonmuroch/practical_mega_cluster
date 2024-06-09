pragma solidity ^0.8.9;

//import "ssv-network/contracts/interfaces/ISSVClusters.sol";
import "ssv-network/contracts/interfaces/ISSVOperators.sol";

import "./libraries/UintArray.sol";
import "./libraries/EntityArray.sol";
import "./libraries/Shares.sol";
import "hardhat/console.sol";

contract PracticalMegaCluster is ISSVOperators {
    using UintArray for uint[];
    using EntityArray for EntityArray.Entity[];
    using Shares for uint;

    address public ssv_network;

    uint256 public constant MAX_ENTITY = 6;
    uint256 public constant NEW_OPERATOR_CAPACITY = 500;
    uint256 public K;
    uint256 public C0;

    mapping(address => uint) public entities_index;
    EntityArray.Entity[] public entities;
    mapping(uint => address) public operatorToEntity;
    uint public capacity;

    modifier onlyEntity() {
        require(entities[entities_index[msg.sender]].owner == msg.sender, "entity not registered");
        _;
    }

    event RegisteredOperator(bytes publicKey, uint operatorID);
    event RegisteredValidator(uint[] entities, uint count, uint newCapacity);

    constructor(
        address _ssv_network,
        address[] memory _entities,
        uint _k,
        uint _C0
    ){
        require(_entities.length <= MAX_ENTITY,"maxed out entities");
        require(_entities.length >= 4,"min 4 entities");

        ssv_network = _ssv_network;

        for (uint i=0 ; i < _entities.length; i++) {
            entities_index[_entities[i]] = i;

            entities.push(EntityArray.Entity({
                owner: _entities[i],
                capacity: 0
                })
            );
        }

        K = _k;
        C0 = _C0;
    }

    // ##### validator management
    function registerValidator(
        uint[] memory entityIDs,
        uint64[] memory operatorIds,
        bytes[] calldata sharesData
    ) public onlyEntity{
        require(entityIDs.length == 4, "registering validator requires 4 entities");
        // TODO - require entity ids to be unique

        // validate capacity
        EntityArray.Entity[] memory _entities =  new EntityArray.Entity[](4);
        _entities[0] = entities[entityIDs[0]];
        _entities[1] = entities[entityIDs[1]];
        _entities[2] = entities[entityIDs[2]];
        _entities[3] = entities[entityIDs[3]];

        require(_entities.capacityArray().greedyClusterCalculation() >= sharesData.length, "not enough capacity");

        // TODO register on ssv contracts

        // reduce capacity
        entities[entityIDs[0]].capacity -= sharesData.length;
        entities[entityIDs[1]].capacity -= sharesData.length;
        entities[entityIDs[2]].capacity -= sharesData.length;
        entities[entityIDs[3]].capacity -= sharesData.length;

        // recalculate capacity
        capacity = entities.capacityArray().greedyClusterCalculation();

        emit RegisteredValidator(entityIDs, sharesData.length, capacity);
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
        entities[entities_index[msg.sender]].capacity += NEW_OPERATOR_CAPACITY;

        uint64 operatorID = ISSVOperators(ssv_network).registerOperator(publicKey, fee);
        operatorToEntity[operatorID] = msg.sender;

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
}
