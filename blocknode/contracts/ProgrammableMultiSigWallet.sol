// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title ProgrammableMultiSigWallet
 * @dev A smart contract wallet requiring multiple signatures for transactions,
 *      featuring daily limits, high-value thresholds, timelocks, expiry, and emergency freeze.
 */
contract ProgrammableMultiSigWallet is Initializable, ReentrancyGuard {
    // --- Events ---
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 newThreshold);
    event TransactionSubmitted(uint256 indexed txId, address indexed proposer, address indexed destination, uint256 value);
    event TransactionApproved(uint256 indexed txId, address indexed owner);
    event ApprovalRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionCancelled(uint256 indexed txId);
    event WalletFrozen();
    event WalletUnfrozen();
    event WhitelistedRecipientAdded(address indexed recipient);
    event WhitelistedRecipientRemoved(address indexed recipient);
    event DailyLimitChanged(uint256 newDailyLimit);
    event HighValueThresholdChanged(uint256 newHighValueThreshold);
    event Deposit(address indexed sender, uint256 amount, uint256 balance);

    // --- Custom Errors ---
    error NotOwner();
    error NotWallet();
    error InvalidOwner();
    error OwnerExists();
    error OwnerDoesNotExist();
    error InvalidThreshold();
    error WalletIsFrozen();
    error WalletNotFrozen();
    error TxDoesNotExist();
    error TxAlreadyExecuted();
    error TxCancelled();
    error TxExpired();
    error TxNotApproved();
    error TxAlreadyApproved();
    error TxTimelocked(uint256 executableAt);
    error InsufficientApprovals();
    error TxFailed();

    // --- State Variables ---
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public ownerCount;
    uint256 public threshold;

    bool public isFrozen;

    mapping(address => bool) public isWhitelistedRecipient;

    uint256 public dailyLimit;
    uint256 public spentToday;
    uint256 public lastResetTimestamp;

    uint256 public highValueThreshold;
    uint256 public timelockDuration;

    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        address proposer;
        uint256 timestamp;
        uint256 expiryTimestamp;
        uint256 executableAt;
        uint256 approvalCount;
        bool executed;
        bool cancelled;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    // --- Modifiers ---
    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier onlyWallet() {
        if (msg.sender != address(this)) revert NotWallet();
        _;
    }

    modifier notFrozen() {
        if (isFrozen) revert WalletIsFrozen();
        _;
    }

    modifier txExists(uint256 _txId) {
        if (_txId >= transactions.length) revert TxDoesNotExist();
        _;
    }

    modifier notExecuted(uint256 _txId) {
        if (transactions[_txId].executed) revert TxAlreadyExecuted();
        _;
    }

    modifier notCancelled(uint256 _txId) {
        if (transactions[_txId].cancelled) revert TxCancelled();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // --- Initializer ---
    function initialize(
        address[] memory _owners,
        uint256 _threshold,
        uint256 _dailyLimit,
        uint256 _highValueThreshold,
        uint256 _timelockDuration
    ) public initializer {
        if (_owners.length == 0) revert InvalidOwner();
        if (_threshold == 0 || _threshold > _owners.length) revert InvalidThreshold();

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0)) revert InvalidOwner();
            if (isOwner[owner]) revert OwnerExists();
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        ownerCount = _owners.length;
        threshold = _threshold;
        dailyLimit = _dailyLimit;
        highValueThreshold = _highValueThreshold;
        timelockDuration = _timelockDuration;
        lastResetTimestamp = block.timestamp;
    }

    // --- Receive & Fallback ---
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    fallback() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // --- Transaction Flow ---
    function submitTransaction(
        address _destination,
        uint256 _value,
        bytes memory _data,
        uint256 _expiryDuration
    ) external onlyOwner notFrozen returns (uint256 txId) {
        if (_destination == address(0)) revert InvalidOwner();

        txId = transactions.length;
        transactions.push(Transaction({
            destination: _destination,
            value: _value,
            data: _data,
            proposer: msg.sender,
            timestamp: block.timestamp,
            expiryTimestamp: block.timestamp + _expiryDuration,
            executableAt: 0,
            approvalCount: 0,
            executed: false,
            cancelled: false
        }));

        emit TransactionSubmitted(txId, msg.sender, _destination, _value);
        
        // Auto-approve by the proposer
        _approveTransaction(txId, msg.sender);
    }

    function approveTransaction(uint256 _txId) 
        external 
        onlyOwner 
        notFrozen 
        txExists(_txId) 
        notExecuted(_txId) 
        notCancelled(_txId) 
    {
        if (block.timestamp > transactions[_txId].expiryTimestamp) revert TxExpired();
        _approveTransaction(_txId, msg.sender);
    }

    function _approveTransaction(uint256 _txId, address _owner) internal {
        if (approved[_txId][_owner]) revert TxAlreadyApproved();

        approved[_txId][_owner] = true;
        transactions[_txId].approvalCount += 1;

        emit TransactionApproved(_txId, _owner);

        // Set timelock if threshold is reached for the first time
        if (transactions[_txId].approvalCount == _getRequiredApprovals(_txId) && transactions[_txId].executableAt == 0) {
            transactions[_txId].executableAt = block.timestamp + timelockDuration;
        }
    }

    function revokeApproval(uint256 _txId) 
        external 
        onlyOwner 
        notFrozen 
        txExists(_txId) 
        notExecuted(_txId) 
        notCancelled(_txId) 
    {
        if (!approved[_txId][msg.sender]) revert TxNotApproved();

        approved[_txId][msg.sender] = false;
        transactions[_txId].approvalCount -= 1;

        emit ApprovalRevoked(_txId, msg.sender);

        // Reset timelock if approvals fall below threshold
        if (transactions[_txId].approvalCount < _getRequiredApprovals(_txId) && transactions[_txId].executableAt != 0) {
            transactions[_txId].executableAt = 0;
        }
    }

    function executeTransaction(uint256 _txId) 
        external 
        onlyOwner 
        notFrozen 
        nonReentrant 
        txExists(_txId) 
        notExecuted(_txId) 
        notCancelled(_txId) 
    {
        Transaction storage txn = transactions[_txId];
        
        if (block.timestamp > txn.expiryTimestamp) revert TxExpired();
        if (txn.approvalCount < _getRequiredApprovals(_txId)) revert InsufficientApprovals();
        if (txn.executableAt != 0 && block.timestamp < txn.executableAt) revert TxTimelocked(txn.executableAt);

        // Check and update daily limit
        _updateDailyLimit(txn.value);

        txn.executed = true;

        (bool success, ) = txn.destination.call{value: txn.value}(txn.data);
        if (!success) revert TxFailed();

        emit TransactionExecuted(_txId);
    }

    function cancelTransaction(uint256 _txId) 
        external 
        onlyOwner 
        txExists(_txId) 
        notExecuted(_txId) 
        notCancelled(_txId) 
    {
        if (transactions[_txId].proposer != msg.sender) revert NotOwner();
        transactions[_txId].cancelled = true;
        emit TransactionCancelled(_txId);
    }

    // --- Authorization Logic ---
    function _getRequiredApprovals(uint256 _txId) internal view returns (uint256) {
        Transaction storage txn = transactions[_txId];
        
        // If it's a call to the wallet itself (e.g. changing settings), always require full threshold
        if (txn.destination == address(this)) {
            return threshold;
        }

        bool requiresThreshold = false;

        // Whitelist mode: if recipient is not whitelisted, require threshold
        if (!isWhitelistedRecipient[txn.destination]) {
            requiresThreshold = true;
        }

        // High value threshold check
        if (txn.value >= highValueThreshold) {
            requiresThreshold = true;
        }

        // Daily limit check: if this transaction bypasses daily limit logic (would exceed), require threshold
        // Note: _updateDailyLimit actually tracks the usage. Here we just determine required signatures.
        // If it's within the limit, and whitelisted, and not high value, 1 signature is enough.
        uint256 _spentToday = spentToday;
        if (block.timestamp >= lastResetTimestamp + 1 days) {
            _spentToday = 0;
        }
        
        if (_spentToday + txn.value > dailyLimit) {
            requiresThreshold = true;
        }

        return requiresThreshold ? threshold : 1;
    }

    function _updateDailyLimit(uint256 _amount) internal {
        if (_amount == 0) return;

        if (block.timestamp >= lastResetTimestamp + 1 days) {
            spentToday = 0;
            lastResetTimestamp = block.timestamp;
        }

        // Only count towards limit if it requires only 1 signature (meaning it was under other limits)
        // Actually, the prompt says "A transfer must not bypass the configured spending policy. Implement a clear rule for when multisig authorization is required."
        // We will just track all spending. If it exceeds daily limit, it needed threshold signatures.
        spentToday += _amount;
    }

    // --- Daily Limit Getters ---
    function getDailyLimit() external view returns (uint256) {
        return dailyLimit;
    }

    function getSpentToday() external view returns (uint256) {
        if (block.timestamp >= lastResetTimestamp + 1 days) {
            return 0;
        }
        return spentToday;
    }

    function getRemainingDailyLimit() external view returns (uint256) {
        uint256 _spent = (block.timestamp >= lastResetTimestamp + 1 days) ? 0 : spentToday;
        if (_spent >= dailyLimit) return 0;
        return dailyLimit - _spent;
    }

    // --- Wallet Management (Requires Wallet Authorization) ---
    function addOwner(address _owner) external onlyWallet {
        if (_owner == address(0)) revert InvalidOwner();
        if (isOwner[_owner]) revert OwnerExists();

        isOwner[_owner] = true;
        owners.push(_owner);
        ownerCount += 1;

        emit OwnerAdded(_owner);
    }

    function removeOwner(address _owner) external onlyWallet {
        if (!isOwner[_owner]) revert OwnerDoesNotExist();
        if (ownerCount - 1 < threshold) revert InvalidThreshold();

        isOwner[_owner] = false;
        ownerCount -= 1;

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner);
    }

    function changeThreshold(uint256 _newThreshold) external onlyWallet {
        if (_newThreshold == 0 || _newThreshold > ownerCount) revert InvalidThreshold();
        threshold = _newThreshold;
        emit ThresholdChanged(_newThreshold);
    }

    function setDailyLimit(uint256 _newLimit) external onlyWallet {
        dailyLimit = _newLimit;
        emit DailyLimitChanged(_newLimit);
    }

    function setHighValueThreshold(uint256 _newThreshold) external onlyWallet {
        highValueThreshold = _newThreshold;
        emit HighValueThresholdChanged(_newThreshold);
    }

    function setTimelockDuration(uint256 _newDuration) external onlyWallet {
        timelockDuration = _newDuration;
    }

    function addWhitelistedRecipient(address _recipient) external onlyWallet {
        if (_recipient == address(0)) revert InvalidOwner();
        isWhitelistedRecipient[_recipient] = true;
        emit WhitelistedRecipientAdded(_recipient);
    }

    function removeWhitelistedRecipient(address _recipient) external onlyWallet {
        isWhitelistedRecipient[_recipient] = false;
        emit WhitelistedRecipientRemoved(_recipient);
    }

    // --- Emergency Freeze ---
    // Only owners can freeze/unfreeze directly without multisig to allow rapid response
    function freezeWallet() external onlyOwner {
        if (isFrozen) revert WalletIsFrozen();
        isFrozen = true;
        emit WalletFrozen();
    }

    function unfreezeWallet() external onlyOwner {
        if (!isFrozen) revert WalletNotFrozen();
        isFrozen = false;
        emit WalletUnfrozen();
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }
}
