var socket = io((location.hostname === "localhost") ? "http://localhost:3000" : "https://x32chill.herokuapp.com/");

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var members = document.getElementById('members');

let nick = "";
let imTyping = false;

socket.on("connect", () => {
    socket.emit("start");

    if(localStorage.getItem("password"))
        socket.emit("set rank", localStorage.getItem("password"));

    if (localStorage.getItem("name"))
        socket.emit("set nick", localStorage.getItem("name"));
});

socket.on("nick", n => nick = n);

socket.on('chat message', data => addItem(`${data.username}: ${data.message}`, messages, ["list-group-item", "overflow-hidden", "text-break"]))

socket.on('info', data => {
    if (data.type === "bad") 
        addItem(data.message, messages, ["list-group-item", "list-group-item-danger"])
    else if (data.type === "good") 
        addItem(data.message, messages, ["list-group-item", "list-group-item-success"])
    else if (data.type === "neutral")
        addItem(data.message, messages, ["list-group-item", "list-group-item-primary"])
})

socket.on('users list', b => updateUserList(b))
socket.on('typing signal', b => updateUserList(users))

socket.on("clear chat", () => messages.innerHTML = "");

form.addEventListener('submit', e => {
    e.preventDefault();
    socket.emit("send chat message", {
        username: nick,
        message: input.value
    })

    input.value = "";
    imTyping = false;
    socket.emit("not typing");
});

input.addEventListener("input", () => {
    if (input.value.length !== 0 && imTyping === false) {
        socket.emit("typing");
        imTyping = true;
    } else if (input.value === "") {
        socket.emit("not typing");
        imTyping = false;
    }
})

function namePrompt() {
    const name = prompt("Username:");

    if (name) {
        localStorage.setItem("name", name);
        socket.emit("set nick", name);
    }
}

function rank() {
    const password = prompt("Password:");

    localStorage.setItem("password", password);
    socket.emit("set rank", password);
}

const updateUserList = users => {
    members.innerHTML = "";
    
    const me = users.map(user => {
        if(user.nick == nick) {
            return {...user, i: users.indexOf(user)}
        }
    }).filter(Boolean)[0]

    for(let i = 0; i < users.length; i++) {
        const user = users[i];
        const menu = Math.random().toString().substring(2);

        $("#members").append(`
            <div class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    ${user.typing ? "🗨️ "+user.nick : user.nick}
                </button>
                <ul class="dropdown-menu" id="${menu}">
                    <li><span class="dropdown-item">Close</span></li>
                </ul>
            </div>`)

        if(me.rank === "owner" || me.rank === "moderator") {
            $(`#${menu}`).prepend(`<li><span class="dropdown-item kickButton" data-id="${i}">Kick</span></li>`)
            $(`#${menu}`).prepend(`<li><span class="dropdown-item muteButton" data-id="${i}">Mute</span></li>`)
            $(`#${menu}`).prepend(`<li><span class="dropdown-item unmuteButton" data-id="${i}">Unmute</span></li>`)

            if(!$(".clearChatButton").length)
                $("#settings").prepend(`<li><span class="dropdown-item clearChatButton">Clear chat for everybody</span></li>`)

            if(!$(".logoutButton").length) 
                $("#settings").prepend(`<li><span class="dropdown-item logoutButton">Logout</span></li>`)
        }

        if (user.rank) {
            $(`#${menu}`).prepend(`<li><span class="dropdown-item-text">Rank: ${user.rank}</span></li>`)
        } else {
            $(`#${menu}`).prepend(`<li><span class="dropdown-item-text">Rank: Default</span></li>`)
        }

        if (user.listening) {
            $(`#${menu}`).prepend(`<li><span class="dropdown-item-text">Listening to: ${user.listening}</span></li>`)
        } else {
            $(`#${menu}`).prepend(`<li><span class="dropdown-item-text">Listening to: TV Static</span></li>`)
        }
    }

    document.getElementById("sockets").innerHTML = users.length;

    [...document.querySelectorAll(".kickButton")].forEach(e=>e.addEventListener("click", ()=>socket.emit('kick', e.dataset.id)));
    [...document.querySelectorAll(".muteButton")].forEach(e=>e.addEventListener("click", ()=>socket.emit('mute', e.dataset.id)));
    [...document.querySelectorAll(".unmuteButton")].forEach(e=>e.addEventListener("click", ()=>socket.emit('unmute', e.dataset.id)));
    [...document.querySelectorAll(".clearChatButton")].forEach(e=>e.addEventListener("click", ()=>socket.emit('clear chat')));
    [...document.querySelectorAll(".logoutButton")].forEach(e=>e.addEventListener("click", ()=>socket.emit('logout')));
}

const addItem = (item, what, classList) => {
    var message = document.createElement('li');
    message.innerHTML = urlify(checkText(item));

    if (classList)
        classList.forEach(classItem => message.classList.add(classItem));

    what.appendChild(message);
    window.scrollBy(0, window.scrollMaxY);

    return message;
}

const urlify = text => {
    if (text) return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
}