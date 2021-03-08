const playButton = document.getElementById("audiobutton");
const stream = document.getElementById("radioStream");
const volume = document.getElementById("volume")

const context = new AudioContext();

let track = context.createMediaElementSource(stream);
const gainNode = context.createGain();

track.connect(gainNode).connect(context.destination);

if (localStorage.getItem("radio")) {
    stream.src = localStorage.getItem("radio");
    track = context.createMediaElementSource(stream);
    
    gainNode.gain.value = volume.value;
}

[...document.getElementById("radios").children].forEach(e => {
    e.addEventListener('click', function() {
        stream.src = this.firstChild.dataset.link;

        track = context.createMediaElementSource(stream);

        socket.emit("listen", this.firstChild.textContent)
        localStorage.setItem("radio", this.firstChild.dataset.link);

        stream.play();
    })
})

volume.addEventListener('input', function() {
    gainNode.gain.value = this.value;
});

playButton.addEventListener('click', function() {
    if (context.state === 'suspended')
        context.resume();

    if (this.textContent == "pause") {
        stream.pause();
        sendListen("")
        this.textContent = "play"
    } else {
        stream.play();
        sendListen(findNameFromUrl(stream.src))
        this.textContent = "pause"
    }
})

function findNameFromUrl(url) {
    return [...radios.children].map(e=>{if(e.firstChild.dataset.link==url)return e}).filter(Boolean)[0].textContent;
}

function sendListen(station) {
    if(socket)
        socket.emit("listen", station);
}