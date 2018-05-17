pragma solidity ^0.4.17;

/** #title Write on Global Wall */
contract Wall {

    struct Post {
        string text;
        uint8 font;
        uint8 red;
        uint8 green;
        uint8 blue;
        address poster;
    }

    Post[] public posts;

    address _owner;

    mapping (uint => uint) public forSale;

    modifier isPoster(uint index) {
        require(posts[index].poster == msg.sender);
        _;
    }

    modifier maxText(string _text) {
        require(bytes(_text).length <= 100);
        _;
    }

    constructor() public {
        _owner = msg.sender;
    }

    function() payable public {

    }

    /** @dev Gets the details for a post with the price included.
      * @return text Post text
      * @return font Post font
      * @return red Post color red value
      * @return green Post color green value
      * @return blue Post color blue value
      * @return poster Post creator
      * @return price The sale price of the post spot or 0 if not for sale
      * @return index Post index
      */
    function getPost(uint _index) external view returns(string text, uint font, uint red, uint green, uint blue,
        address poster, uint price, uint index) {
        Post memory post = posts[_index];
        text = post.text;
        font = post.font;
        red = post.red;
        green = post.green;
        blue = post.blue;
        poster = post.poster;
        price = forSale[_index];
        index = _index;
    }

    /** @dev Posts to the bottom of the wall.
      * @param _text Post text
      * @param _font Post font
      * @param _red Post red value
      * @param _green Post green value
      * @param _blue Post blue value
      * @return uint The location on the wall
      */
    function createPost(string _text, uint8 _font, uint8 _red, uint8 _green, uint8 _blue) maxText(_text) external returns(uint) {
        posts.push(Post(_text, _font, _red, _green, _blue, msg.sender));
        return posts.length - 1;
    }

    /** @dev Updates a post.
      * @param _index Post index
      * @param _text Post text
      * @param _font Post font
      * @param _red Post red value
      * @param _green Post green value
      * @param _blue Post blue value
      */
    function updatePost(uint _index, string _text, uint8 _font, uint8 _red, uint8 _green, uint8 _blue) maxText(_text) isPoster(_index) external {
        Post storage post = posts[_index];
        post.text = _text;
        post.font = _font;
        post.red = _red;
        post.green = _green;
        post.blue = _blue;
    }

    event NewListening(uint index, uint price);
    event SoldPost(uint index, uint price);

    /** @dev List a post as for sale.
      * @param _index Sale index
      * @param _price Sale price
      */
    function sellPost(uint _index, uint _price) isPoster(_index) external {
        require(forSale[_index] == 0);
        forSale[_index] = _price;
        emit NewListening(_index, _price);
    }

    
    function getPostsCount() public view returns(uint) {
        return posts.length;
    }

    /** @dev Buy a post.
      * @param _index Sale index
      */
    function buyPost(uint _index) payable public {
        uint cost = forSale[_index];
        require(cost != 0 && msg.value >= cost);
        Post storage post = posts[_index];
        address(post.poster).transfer(msg.value); // todo, should probably refund any extra?
        post.poster = msg.sender;
        emit SoldPost(_index, cost);
        delete forSale[_index];
    }

    /** @dev Cancels a sale.
      * @param _index Sale index
      */
    function closePostSale(uint _index) isPoster(_index) external {
        delete forSale[_index];
    }

    /** @dev Allows the owner to withdraw funds from the contract
     * @param _amount The value to withdraw
     */
    function withdraw(uint _amount) external {
        require(msg.sender == _owner);
        address(_owner).transfer(_amount);
    }

}