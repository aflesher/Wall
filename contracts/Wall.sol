pragma solidity ^0.4.17;

contract Wall {

    struct Post {
        string text;
        uint8 font;
        bytes6 color;
        address poster;
    }

    Post[] public posts;

    mapping (uint => uint) forSale;

    modifier isPoster(uint index) {
        require(posts[index].poster == msg.sender);
        _;
    }

    function createPost(string _text, uint8 _font, bytes6 _color) external returns(uint) {
        posts.push(Post(_text, _font, _color, msg.sender));
        return posts.length - 1;
    }

    function updatePost(uint _index, string _text, uint8 _font, bytes6 _color) isPoster(_index) external {
        Post storage post = posts[_index];
        post.text = _text;
        post.font = _font;
        post.color = _color;
    }

    event NewListening(uint index, uint price);
    event SoldPost(uint index, uint price);

    function sellPost(uint _index, uint _price) isPoster(_index) external {
        require(forSale[_index] == 0);
        forSale[_index] = _price;
        emit NewListening(_index, _price);
    }

    function buyPost(uint _index) payable public {
        uint cost = forSale[_index];
        require(cost != 0 && msg.value >= cost);
        Post storage post = posts[_index];
        address(post.poster).transfer(msg.value); // todo, should probably refund any extra?
        post.poster = msg.sender;
        emit SoldPost(_index, cost);
        forSale[_index] = 0;
    }

}