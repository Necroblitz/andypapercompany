import jquery from "jquery";
import io from "socket.io-client/dist/socket.io.js";
import * as client from "./src/game-client";
import godRenderer from "./src/mode/god";
import * as playerRenderer from "./src/mode/player";

const $ = jquery;

function run(flag) {
	client.setRenderer(flag ? godRenderer : playerRenderer);
	client.connectGame(io, "//" + location.host, $("#name").val(), (success, msg) => {
		if (success) {
			$("#main-ui").fadeIn(1000);
			$("#begin, #wasted").fadeOut(1000);
		}
		else {
			$("#error").text(msg);
		}
	}, flag);
}

$(() => {
	const err = $("#error");
	if (!window.WebSocket) {
		err.text("Your browser does not support WebSockets!");
		return;
	}
	err.text("Loading... Please wait"); //TODO: show loading screen
	(() => {
		const socket = io(`//${location.host}`, {
			forceNew: true,
			upgrade: false,
			transports: ["websocket"]
		});
		socket.on("connect", () => {
			socket.emit("pings");
		});
		socket.on("pongs", () => {
			socket.disconnect();
			err.text("All done, have fun!");
			$("#name").on("keypress", evt => {
				if (evt.key === "Enter") run();
			});
			$(".start").removeAttr("disabled").on("click", evt => {
				run();
			});
			$(".spectate").removeAttr("disabled").click(evt => {
				run(true);
			});
		});
		socket.on("connect_error", () => {
			err.text("Cannot connect with server. This probably is due to misconfigured proxy server. (Try using a different browser)");
		});
	})();
});

function drawMinimap() {
  const minimapCanvas = document.getElementById('minimap');
  const minimapCtx = minimapCanvas.getContext('2d');
  
  // Clear previous minimap frame
  minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  
  // Scale down the game map
  const scale = 0.1;
  
  // Draw the map on the minimap
  minimapCtx.drawImage(gameCanvas, 0, 0, gameCanvas.width, gameCanvas.height, 0, 0, gameCanvas.width * scale, gameCanvas.height * scale);
  
  // Draw the player's position
  minimapCtx.fillStyle = 'red';
  minimapCtx.fillRect(player.x * scale, player.y * scale, 5, 5); // Adjust size as needed
}

//Event listeners

// Add an event listener for mouse movement
document.addEventListener('mousemove', function(event) {
  const rect = gameCanvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // Calculate the direction vector from player to mouse
  const dx = mouseX - player.x;
  const dy = mouseY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize the direction vector
  const normalizedX = dx / distance;
  const normalizedY = dy / distance;
  
  // Update player position
  player.x += normalizedX * player.speed;
  player.y += normalizedY * player.speed;
});

$(document).on("keydown", e => {
	let newHeading = -1;
	switch (e.key) {
		case "w": case "ArrowUp":
		newHeading = 0; break; //UP (W)
		case "d": case "ArrowRight":
		newHeading = 1; break; //RIGHT (D)
		case "s": case "ArrowDown":
		newHeading = 2; break; //DOWN (S)
		case "a": case "ArrowLeft":
		newHeading = 3; break; //LEFT (A)
		default: return; //Exit handler for other keys
	}
	client.changeHeading(newHeading);
	//e.preventDefault();
});

$(document).on("touchmove", e => {
	e.preventDefault();
});

$(document).on("touchstart", e1 => {
	const x1 = e1.targetTouches[0].pageX;
	const y1 = e1.targetTouches[0].pageY;
	$(document).one("touchend", e2 => {
		const x2 = e2.changedTouches[0].pageX;
		const y2 = e2.changedTouches[0].pageY;
		const deltaX = x2 - x1;
		const deltaY = y2 - y1;
		let newHeading = -1;
		if (deltaY < 0 && Math.abs(deltaY) > Math.abs(deltaX)) newHeading = 0;
		else if (deltaX > 0 && Math.abs(deltaY) < deltaX) newHeading = 1;
		else if (deltaY > 0 && Math.abs(deltaX) < deltaY) newHeading = 2;
		else if (deltaX < 0 && Math.abs(deltaX) > Math.abs(deltaY)) newHeading = 3;
		client.changeHeading(newHeading);
	});
});

$(".menu").on("click", () => {
	client.disconnect();
	$("#main-ui, #wasted").fadeOut(1000);
	$("#begin").fadeIn(1000);
});

$(".toggle").on("click", () => {
	$("#settings").slideToggle();
});
