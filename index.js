import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
	getFirestore,
	collection,
	addDoc,
	onSnapshot,
	doc,
	updateDoc,
	deleteDoc,
	getDocs,
	query,
	where,
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
const uuidInput = document.querySelector("#uuid-input");
const uuidDisplay = document.querySelector("#uuid-display");

// Check if UUID exists in local storage
let uuid = localStorage.getItem("uuid");

// Generate and store UUID if it doesn't exist in local storage
if (!uuid) {
	uuid = generateUUID();
	localStorage.setItem("uuid", uuid);
}

// Display UUID on the page
uuidDisplay.textContent = `Your UUID: ${uuid}`;

// Load timers based on UUID
loadTimers(uuid);

// Update UUID on form submission
document.querySelector("#uuid-form").addEventListener("submit", async (e) => {
	e.preventDefault();
	const newUUID = uuidInput.value.trim();
	if (newUUID) {
		// Check if the entered UUID exists in the database (except for the initial auto-generated UUID)
		if (newUUID !== uuid) {
			const uuidQueryRef = query(
				collection(db, "timers"),
				where("uuid", "==", newUUID)
			);
			const snapshot = await getDocs(uuidQueryRef);
			if (snapshot.empty) {
				alert("Invalid UUID entered. Please try again.");
				return;
			}
		}

		// Valid UUID found or using the initial auto-generated UUID, update the display and load timers
		uuid = newUUID;
		uuidDisplay.textContent = `Your UUID: ${uuid}`;
		clearTimers();
		loadTimers(uuid);

		// Update UUID in local storage
		localStorage.setItem("uuid", uuid);
	}
	uuidInput.value = "";
});

document
	.querySelector(".newTimer")
	.addEventListener("click", async function () {
		const timerTitle = prompt("Enter the title for the new timer:");
		if (timerTitle !== null) {
			await addDoc(collection(db, "timers"), {
				title: timerTitle,
				time: 0,
				uuid: uuid,
			});
		}
	});

let colors = [
	"#F94144",
	"#F3722C",
	"#F8961E",
	"#F9844A",
	"F9C74F",
	"90BE6D",
	"43AA8B",
	"4D908E",
	"577590",
	"277DA1",
];
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

function clearTimers() {
	container.innerHTML = "";
}

function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${padTime(minutes)}:${padTime(remainingSeconds)}`;
}

function padTime(time) {
	return time < 10 ? `0${time}` : time;
}

function loadTimers(uuid) {
	const timersRef = collection(db, "timers");
	const queryRef = query(timersRef, where("uuid", "==", uuid));

	onSnapshot(queryRef, (snapshot) => {
		if (snapshot.empty) {
			console.log("No timers found for the provided UUID.");
			return;
		}

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
}

function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

document.getElementById("toggle-uuid").addEventListener("click", function () {
	document.getElementById("uuid-container").classList.toggle("hidden");
});
