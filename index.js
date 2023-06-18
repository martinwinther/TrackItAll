// Importing required functions and libraries from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
	getFirestore,
	serverTimestamp,
	collection,
	addDoc,
	onSnapshot,
	doc,
	orderBy,
	updateDoc,
	deleteDoc,
	getDocs,
	query,
	where,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyDy7aTvJeSSP3om4g_exxP_GNhG7HMRok0",
	authDomain: "trackitall-29e3c.firebaseapp.com",
	projectId: "trackitall-29e3c",
	storageBucket: "trackitall-29e3c.appspot.com",
	messagingSenderId: "158883282304",
	appId: "1:158883282304:web:203e7243e605e64d691565",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Create a Firestore database instance

// DOM Elements
const container = document.querySelector("#timer-list");
const uuidInput = document.querySelector("#uuid-input");
const uuidDisplay = document.querySelector("#uuid-display");

// UUID Initialization: check if a UUID exists in local storage, if not, generate a new one
let uuid = localStorage.getItem("uuid");
if (!uuid) {
	uuid = generateUUID();
	localStorage.setItem("uuid", uuid);
}
uuidDisplay.textContent = `${uuid}`; // Display the UUID

// Load existing timers based on the UUID
loadTimers(uuid);

// Helper function to get a reference to a specific timer document in the Firestore collection
function getTimerRef(id) {
	return doc(db, "timers", id);
}

// Helper function to update a specific timer document in the Firestore collection
function updateTimer(id, data) {
	updateDoc(getTimerRef(id), data);
}

// Add event listeners to handle form submissions and clicks
document
	.querySelector("#uuid-form")
	.addEventListener("submit", handleUUIDFormSubmit); // Event listener for UUID form submission
document
	.querySelector(".newTimer")
	.addEventListener("click", handleNewTimerClick); // Event listener for creating a new timer
document.getElementById("toggle-uuid").addEventListener("click", toggleUUID); // Event listener for toggling the display of UUID

// Event Handlers
function handleUUIDFormSubmit(e) {
	e.preventDefault(); // Prevent form from submitting and refreshing the page
	const newUUID = uuidInput.value.trim(); // Trim whitespaces
	handleUUIDUpdate(newUUID);
	uuidInput.value = ""; // Clear the input field after submission
}

// Handle UUID updates: check if the new UUID exists in Firestore, if so, update the page and local storage
async function handleUUIDUpdate(newUUID) {
	if (newUUID && newUUID !== uuid) {
		const uuidQueryRef = query(
			collection(db, "timers"),
			where("uuid", "==", newUUID)
		);
		const snapshot = await getDocs(uuidQueryRef);
		if (snapshot.empty) {
			alert("Invalid UUID entered. Please try again.");
			return;
		}

		uuid = newUUID;
		uuidDisplay.textContent = `Your UUID: ${uuid}`; // Update the displayed UUID
		clearTimers(); // Clear the current timers from the screen
		loadTimers(uuid); // Load the new timers associated with the new UUID
		localStorage.setItem("uuid", uuid); // Update the UUID stored in local storage
	}
}

// Handle creation of a new timer: prompt for a title, then add the new timer to the Firestore collection
async function handleNewTimerClick() {
	const timerTitle = prompt("Enter the title for the new timer:");
	if (timerTitle !== null) {
		await addDoc(collection(db, "timers"), {
			title: timerTitle.substring(0, 10),
			time: 0,
			uuid: uuid,
			createdAt: serverTimestamp(), // Timestamp of when the timer was created
		});
	}
}

// Function to toggle the visibility of the UUID
function toggleUUID() {
	document.getElementById("uuid-container").classList.toggle("hidden");
}

// An array of colors used for the background of timers
let colors = [
	"#F94144",
	"#F3722C",
	"#F8961E",
	"#F9844A",
	"#F9C74F",
	"#90BE6D",
	"#43AA8B",
	"#4D908E",
	"#577590",
	"#277DA1",
];
let colorIndex = 0; // Color index that will be used to cycle through the colors array

// Function to create a timer element in the DOM
function createTimerElement(id, title, time) {
	const newTimer = document.createElement("li"); // Create a new list item
	newTimer.classList.add("timer");
	newTimer.id = id;
	newTimer.innerHTML = `
        <div class="time" style="background-color: ${
					colors[colorIndex]
				}">${formatTime(time)}</div>
        <div class="title">${title}</div>
        <div class="delete">X</div>
    `;
	colorIndex = (colorIndex + 1) % colors.length; // Cycle through the colors array
	initTimer(newTimer, time); // Initialize the timer with the provided time
	return newTimer;
}

// Function to initialize a timer with various functionalities
function initTimer(timer, initialTime) {
	let time = initialTime;
	let running = false;
	const displayTime = timer.querySelector(".time"); // Select the time display element
	const titleElement = timer.querySelector(".title"); // Select the title element
	const deleteButton = timer.querySelector(".delete"); // Select the delete button

	// Add event listeners to the title and delete elements
	titleElement.addEventListener("click", handleTitleClick); // When the title is clicked, prompt the user to enter a new title
	deleteButton.addEventListener("click", handleDeleteClick); // When the delete button is clicked, delete the timer
	timer.addEventListener("click", handleTimerClick); // When the timer is clicked, toggle whether it's running or not

	// Event handlers for the title, delete, and timer clicks
	function handleTitleClick() {
		const newTitle = prompt("Enter a new title for this timer:");
		if (newTitle !== null) {
			this.innerText = newTitle.substring(0, 10);
			updateTimer(timer.id, { title: newTitle.substring(0, 10) }); // Update the timer's title in Firestore
		}
	}

	function handleDeleteClick() {
		const timerId = this.parentNode.id;
		clearInterval(document.getElementById(timerId).interval); // Stop the interval that's updating this timer
		deleteTimer(timerId); // Delete the timer from Firestore
	}

	function handleTimerClick(e) {
		if (e.target !== titleElement && e.target !== deleteButton) {
			running = handleTimerInterval(this, running, time, displayTime); // Toggle whether the timer is running
		}
	}
}

// Function to handle the timer's interval: if it's running, stop it, otherwise start it
function handleTimerInterval(timerElement, running, time, displayTime) {
	if (running) {
		clearInterval(timerElement.interval); // If the timer is running, stop it
	} else {
		timerElement.interval = setInterval(() => {
			time++;
			displayTime.innerText = formatTime(time); // Display the updated time
			updateTimer(timerElement.id, { time: time }); // Update the time in Firestore
		}, 1000);
	}
	return !running; // Return the opposite of the current running state
}

// Function to delete a timer both from the Firestore and the DOM
async function deleteTimer(timerId) {
	document.getElementById(timerId)?.remove(); // Remove the timer from the DOM
	try {
		await deleteDoc(getTimerRef(timerId)); // Delete the timer from Firestore
		console.log("Timer deleted successfully.");
	} catch (error) {
		console.log("Error deleting timer:", error);
	}
}

// Function to clear all timers from the DOM
function clearTimers() {
	container.innerHTML = "";
}

// Function to format a given time (in seconds) to a minutes:seconds format
function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60); // Convert seconds to minutes
	const remainingSeconds = seconds % 60; // Get the remaining seconds after the minutes have been taken out
	return `${padTime(minutes)}:${padTime(remainingSeconds)}`; // Return the formatted time
}

// Function to pad a given time with a leading zero if it's less than 10
function padTime(time) {
	return time < 10 ? `0${time}` : time;
}

// Function to load the timers associated with a given UUID from Firestore
function loadTimers(uuid) {
	const timersRef = collection(db, "timers"); // Reference to the timers collection in Firestore
	const queryRef = query(
		timersRef,
		where("uuid", "==", uuid),
		orderBy("createdAt") // Order the results by the createdAt field
	);

	// Subscribe to real-time updates to the query
	onSnapshot(queryRef, handleSnapshotChange);
}

// Function to handle changes to the Firestore query snapshot
function handleSnapshotChange(snapshot) {
	if (snapshot.empty) {
		console.log("No timers found for the provided UUID.");
		return;
	}

	// Loop over each document change in the snapshot
	snapshot.docChanges().forEach(({ type, doc }) => {
		const data = doc.data(); // Get the document's data
		switch (type) {
			case "added":
				// If a new document was added, create a new timer for it
				const newTimer = createTimerElement(doc.id, data.title, data.time);
				container.insertBefore(newTimer, document.querySelector(".newTimer"));
				break;
			case "modified":
				// If a document was modified, update the corresponding timer
				let timer = document.getElementById(doc.id);
				timer.querySelector(".title").innerText = data.title;
				timer.querySelector(".time").innerText = formatTime(data.time);
				break;
			case "removed":
				// If a document was removed, remove the corresponding timer
				let timerToRemove = document.getElementById(doc.id);
				if (timerToRemove) {
					timerToRemove.parentNode.removeChild(timerToRemove);
				}
				break;
		}
	});
}

// Function to generate a UUID (Universal Unique Identifier)
function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0; // Generate a random number between 0 and 15
		const v = c === "x" ? r : (r & 0x3) | 0x8; // If the character is 'x', use 'r', otherwise use '(r & 0x3) | 0x8'
		return v.toString(16); // Convert the number to a hexadecimal string
	});
}
