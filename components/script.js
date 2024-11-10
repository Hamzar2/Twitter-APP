
import {contractAddress, contractABI} from './constants.js';

let web3, contract, account;

window.connectWallet = async function () {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            account = Web3.utils.toChecksumAddress(accounts[0]); // Normalize to checksum format
            console.log('Connected to wallet: ' + account);
            web3 = new Web3(window.ethereum);
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Display wallet address and load posts
            document.getElementById('walletAddress').innerText = account;
            loadPosts();

            // Show main content and hide introductory text
            document.getElementById('introText').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';

        } catch (error) {
            alert('Error connecting to wallet: ' + error.message);
        }
    } else {
        alert('Please install MetaMask!');
    }
};


window.publishPost = async function () {
    const content = document.getElementById('postContent').value;
    try {
        await contract.methods.publishPost(content).send({ from: account });
        document.getElementById('postContent').value = '';
        loadPosts();
    } catch (error) {
        alert("Error publishing post: " + error.message);
    }
}

window.loadPosts = async function () {
    const postFeed = document.getElementById("postsFeed");
    postFeed.innerHTML = "";

    try {
        const totalPosts = await contract.methods.getTotalPosts().call();
        console.log(totalPosts);
        for (let i = 0; i < totalPosts; i++) {
            const post = await contract.methods.getPost(i).call();
            const postElement = createPostElement(post, i);
            postFeed.appendChild(postElement);
            console.log(post);
        }
    } catch (error) {
        alert("Error Loading Posts : " + error);
        console.error("Error loading posts:", error)
    }
}

function createPostElement(post, index) {
    const postDiv = document.createElement("div");
    postDiv.className = "post";

    const postHeader = document.createElement("div");
    postHeader.className = "post-header";

    const authorSpan = document.createElement("span");
    authorSpan.innerText = "@" + post[1];

    const dateSpan = document.createElement("span");
    dateSpan.className = "post-date";
    dateSpan.innerText = new Date(post[2] * 1000).toLocaleString(undefined, { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric',  
        hour12: true // Optional: Use 12-hour clock instead of 24-hour
    });
   

    postHeader.appendChild(authorSpan);
    
    postDiv.appendChild(postHeader);

    const contentPara = document.createElement("p");
    contentPara.className = "post-content";
    contentPara.id = `postContent_${index}`;
    contentPara.innerText = post[0];
    postDiv.appendChild(contentPara);

    const postActions = document.createElement("div");
    postActions.className = "post-actions";
    
    const likeDislikeContainer = document.createElement("div");
    likeDislikeContainer.className = "like-dislike";


    // Like Button with Icon
    const likeButton = document.createElement("i"); // Use <i> for icon
    likeButton.className = "fas fa-thumbs-up like-icon"; // Font Awesome like icon
    likeButton.onclick = () => likePost(index);
    likeDislikeContainer.appendChild(likeButton);

    const likeCount = document.createElement("span");
    likeCount.id = `likeCount_${index}`;
    likeCount.innerText = post[4]; // Likes count
    likeDislikeContainer.appendChild(likeCount);


    // Dislike Button with Icon
    const dislikeButton = document.createElement("i");
    dislikeButton.className = "fas fa-thumbs-down dislike-icon"; // Font Awesome dislike icon
    dislikeButton.onclick = () => dislikePost(index);
    likeDislikeContainer.appendChild(dislikeButton);


    const dislikeCount = document.createElement("span");
    dislikeCount.id = `dislikeCount_${index}`;
    dislikeCount.innerText =  post[5];  // Dislikes count
    likeDislikeContainer.appendChild(dislikeCount);


    postActions.appendChild(likeDislikeContainer);

    // Edit Button
    console.log(typeof post[1]);
    // console.log(post[1]);
    if (post[1] === account) {
        const editButton = document.createElement("button");
        editButton.innerText = "Edit";
        editButton.className = "edit-button";
        editButton.onclick = () => editPost(index);
        postActions.appendChild(editButton);
    }

    postDiv.appendChild(postActions);
    postDiv.appendChild(dateSpan);
    return postDiv;
}

async function likePost(index) {
    try {
        await contract.methods.likePost(index).send({ from: account });
        loadPosts(); // Reload posts to reflect the change
    } catch (error) {
        console.error("Error liking post:", error);
        alert("Error liking post: " + error.message);
    }
}

async function dislikePost(index) {
    try {
        await contract.methods.dislikePost(index).send({ from: account });
        loadPosts(); // Reload posts to reflect the change
    } catch (error) {
        console.error("Error disliking post:", error);
        alert("Error disliking post: " + error.message);
    }
}

async function editPost(index) {
    const newContent = prompt("Enter new content:", document.getElementById(`postContent_${index}`).innerText);
    if (newContent !== null && newContent.trim() !== "") {
        try {
            await contract.methods.editPost(index, newContent).send({ from: account });
            loadPosts();
        } catch (error) {
            console.error("Error editing post:", error);
            alert("Error editing post: " + error.message);
        }
    }
}


function typeWriter(text, elementId, delay = 30) {
    const element = document.getElementById(elementId);
    let index = 0;
    
    function type() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, delay);
        }
    }
    type();
}

// Call the typewriter function on page load
window.onload = function () {
    typeWriter("Welcome to Mini Twitter! Connect your wallet to start sharing and interacting with posts.", "introTextContent");
};
