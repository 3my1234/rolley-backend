// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title Rolley Token ($ROL)
 * @author Rolley Team
 * @notice ERC-20 token for the Rolley staking platform
 * 
 * Token Details:
 * - Name: Rolley
 * - Symbol: ROL
 * - Decimals: 18
 * - Max Supply: 1,000,000,000 ROL (1 billion)
 * - Value: 1 ROL = $100 USD (fixed by platform)
 * - Blockchain: Polygon
 * 
 * The token value is maintained off-chain by the platform.
 * Users can buy ROL with USD/USDT, stake ROL tokens, and trade ROL internally.
 */
contract RolleyToken is ERC20, Ownable, ERC20Burnable {
    
    // Maximum supply: 1 billion ROL
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Mapping to track authorized minters (for automated reward distribution)
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    
    /**
     * @notice Constructor - initializes token with no initial supply
     * @param initialOwner Address of the contract owner (deployer)
     */
    constructor(address initialOwner) 
        ERC20("Rolley", "ROL") 
        Ownable(initialOwner)
    {
        // No initial mint - tokens will be minted on-demand when users buy ROL
    }
    
    /**
     * @notice Authorize an address to mint tokens (backend service for user purchases)
     * @param minter Address to authorize for minting
     */
    function authorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    /**
     * @notice Revoke minting authorization from an address
     * @param minter Address to revoke
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    
    /**
     * @notice Mint new tokens (owner or authorized minters only)
     * @param to Address to receive tokens
     * @param amount Amount to mint (in wei, e.g., 1000000000000000000 for 1 ROL)
     * @param reason Reason for minting (for tracking/audit)
     */
    function mint(address to, uint256 amount, string memory reason) external {
        require(
            msg.sender == owner() || authorizedMinters[msg.sender],
            "Not authorized to mint"
        );
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @notice Get token information
     * @return tokenName Token name
     * @return tokenSymbol Token symbol
     * @return tokenDecimals Token decimals
     * @return tokenTotalSupply Current total supply
     * @return tokenMaxSupply Maximum supply
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenMaxSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY
        );
    }
}

