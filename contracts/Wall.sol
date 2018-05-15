pragma solidity ^0.4.17;

/** #title Write on Global Wall */
contract Wall {

    struct Post {
        string text;
        uint8 font;
        bytes6 color;
        address poster;
    }

    Post[] public posts;

    mapping (uint => uint) public forSale;

    modifier isPoster(uint index) {
        require(posts[index].poster == msg.sender);
        _;
    }

    modifier maxText(string _text) {
        require(bytes(_text).length <= 100);
        _;
    }

    /** @dev Posts to the bottom of the wall.
      * @param _text Post text
      * @param _font Post font
      * @param _color Post color
      * @return uint The location on the wall
      */
    function createPost(string _text, uint8 _font, bytes6 _color) maxText(_text) external returns(uint) {
        posts.push(Post(_text, _font, _color, msg.sender));
        return posts.length - 1;
    }

    /** @dev Updates a post.
      * @param _index Post index
      * @param _text Post text
      * @param _font Post font
      * @param _color Post color
      */
    function updatePost(uint _index, string _text, uint8 _font, bytes6 _color) maxText(_text) isPoster(_index) external {
        Post storage post = posts[_index];
        post.text = _text;
        post.font = _font;
        post.color = _color;
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

}