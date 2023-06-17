import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
	getFirestore,
	collection,
	addDoc,
	onSnapshot,
	doc,
	updateDoc,
	deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyDy7aTvJeSSP3om4g_exxP_GNhG7HMRok0",

	authDomain: "trackitall-29e3c.firebaseapp.com",

	projectId: "trackitall-29e3c",

	storageBucket: "trackitall-29e3c.appspot.com",

	messagingSenderId: "158883282304",

	appId: "1:158883282304:web:203e7243e605e64d691565",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const container = document.querySelector("#timer-list");

document
	.querySelector(".newTimer")
	.addEventListener("click", async function () {
		const timerTitle = prompt("Enter the title for the new timer:");
		if (timerTitle !== null) {
			await addDoc(collection(db, "timers"), {
				title: timerTitle,
				time: 0,
			});
		}
	});

let colors = ["#FEB2B2", "#FEB6FF", "#C4FCEF", "#FFD6A5"];
let colorIndex = 0;

function createTimerElement(id, title, time) {
	const newTimer = document.createElement("li");
	newTimer.classList.add("timer");
	newTimer.id = id;
	newTimer.innerHTML = `
        <div class="time" style="background-color: ${
					colors[colorIndex]
				}">${formatTime(time)}</div>
        <div class="title">${title}</div>
        <div class="delete">X</div>
    `;
	colorIndex = (colorIndex + 1) % colors.length;
	initTimer(newTimer, time);
	return newTimer;
}

function initTimer(timer, initialTime) {
	let time = initialTime;
	let running = false;
	const displayTime = timer.querySelector(".time");
	const titleElement = timer.querySelector(".title");
	const deleteButton = timer.querySelector(".delete");

	titleElement.addEventListener("click", function () {
		const newTitle = prompt("Enter a new title for this timer:");
		if (newTitle !== null) {
			this.innerText = newTitle;
			updateDoc(doc(db, "timers", timer.id), {
				title: newTitle,
			});
		}
	});

	deleteButton.addEventListener("click", function () {
		const timerId = this.parentNode.id;
		const timer = document.getElementById(timerId);
		if (timer) {
			clearInterval(timer.interval); // Stop the timer interval
			timer.remove();
			deleteDoc(doc(db, "timers", timerId))
				.then(() => {
					console.log("Timer deleted successfully.");
				})
				.catch((error) => {
					console.log("Error deleting timer:", error);
				});
		}
	});

	timer.addEventListener("click", function (e) {
		if (e.target !== titleElement && e.target !== deleteButton) {
			if (running) {
				clearInterval(this.interval);
			} else {
				this.interval = setInterval(() => {
					time++;
					displayTime.innerText = formatTime(time);
					updateDoc(doc(db, "timers", timer.id), {
						time: time,
					});
				}, 1000);
			}
			running = !running;
		}
	});
}

function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${padTime(minutes)}:${padTime(remainingSeconds)}`;
}

function padTime(time) {
	return time < 10 ? `0${time}` : time;
}

onSnapshot(collection(db, "timers"), (snapshot) => {
	snapshot.docChanges().forEach((change) => {
		if (change.type === "added") {
			const newTimer = createTimerElement(
				change.doc.id,
				change.doc.data().title,
				change.doc.data().time
			);
			container.insertBefore(newTimer, document.querySelector(".newTimer"));
		}
		if (change.type === "modified") {
			let timer = document.getElementById(change.doc.id);
			timer.querySelector(".title").innerText = change.doc.data().title;
			timer.querySelector(".time").innerText = formatTime(
				change.doc.data().time
			);
		}
		if (change.type === "removed") {
			let timer = document.getElementById(change.doc.id);
			timer.parentNode.removeChild(timer);
		}
	});
});
