# Description
This is a simple Ethereum smart contract that running on the Ropsten test network. Any user can post a short message (max 100 chars) to the bottom of the wall. Messages can only be altered/removed by the creater of the message. You can interact with it via web3 web application [here](https://github.com/aflesher/Wall).
# Features
## Create Post
**Description**: Allows any user to post a message with desired font and color. The message is appended to the bottom of the wall.  
**Cost:** No fees only gas
## Update Post
**Description**: Any user can change the message, font and color of a post they created.  
**Cost:** No fees only gas
## Sell Post
**Description**: Any user can list a message "slot" for a price in Ether specified by the user. Messages that appear first would have the highest value.  
**Cost:** No fees only gas
## Buy Post
**Description**: A user can buy a message "slot" that has been listed for sale. Once the transaction is completed the new owner can change the message, font and color of the slot. 99% of the ether sale price goes to the seller, the other 1% is held in the contract.  
**Cost:** The sale price in ether plus the cost of gas.
# Notes
This was written as a sample smart contract to help teach myself more about Ethereum. I don't believe it has any real world application which is why it was never deployed to mainnet.

