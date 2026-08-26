// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ProgrammableMultiSigWallet.sol";

contract WalletFactory {
    address public immutable implementation;
    
    mapping(address => address[]) private _userWallets;
    
    event WalletCreated(
        address indexed creator,
        address indexed wallet,
        address indexed implementation
    );
    
    constructor(address _implementation) {
        require(_implementation != address(0), "Invalid implementation address");
        implementation = _implementation;
    }
    
    function createWallet(
        address[] memory _owners,
        uint256 _threshold,
        uint256 _dailyLimit,
        uint256 _highValueThreshold,
        uint256 _timelockDuration
    ) external returns (address) {
        address clone = Clones.clone(implementation);
        
        ProgrammableMultiSigWallet(payable(clone)).initialize(
            _owners,
            _threshold,
            _dailyLimit,
            _highValueThreshold,
            _timelockDuration
        );
        
        _userWallets[msg.sender].push(clone);
        
        emit WalletCreated(msg.sender, clone, implementation);
        
        return clone;
    }
    
    function getUserWallets(address user) external view returns (address[] memory) {
        return _userWallets[user];
    }
    
    function getWalletCount(address user) external view returns (uint256) {
        return _userWallets[user].length;
    }
}
