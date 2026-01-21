const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const hand = document.getElementById('hand-cursor');
const animateBtn = document.getElementById('animateBtn');
const clearBtn = document.getElementById('clearBtn');

// State
let isDrawing = false;
let paths = []; // Array of { points: [{x, y}] }
let currentPath = null;

// Hand offset - tweak these to make the tip of the pen match the cursor
// This depends on the specific hand image.
const handOffsetX = -20; 
const handOffsetY = -20; // Adjusting for the pen tip

// Setup Canvas Resolution
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    // Redraw if resized
    drawAllPaths();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Drawing Settings
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#000';

// Event Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch Support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', { windowX: touch.clientX, windowY: touch.clientY });
    startDrawing(touch);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    startDrawing(e.touches[0], true); // Logic reuse
});

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    // specific for touch or mouse
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getPos(e);
    currentPath = { points: [pos] };
    paths.push(currentPath);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;
    
    // For touchmove we might need to handle it differently if reused, 
    // but standard mousemove logic works if getPos is generic.
    const pos = getPos(e);
    currentPath.points.push(pos);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
}

function drawAllPaths() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for (const path of paths) {
        if (path.points.length < 1) continue;
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
    }
    ctx.stroke();
}

// Animation Logic
animateBtn.addEventListener('click', () => {
    if (paths.length === 0) return;
    
    // Disable interaction
    canvas.style.pointerEvents = 'none';
    animateBtn.disabled = true;
    clearBtn.disabled = true;
    
    // Show Hand
    hand.style.display = 'block';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    playAnimation();
});

clearBtn.addEventListener('click', () => {
    paths = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hand.style.display = 'none';
});

async function playAnimation() {
    ctx.beginPath();
    
    for (const path of paths) {
        if (path.points.length === 0) continue;

        // Move hand to start
        updateHandPos(path.points[0]);
        ctx.moveTo(path.points[0].x, path.points[0].y);
        
        // Draw path point by point
        for (let i = 1; i < path.points.length; i++) {
            const point = path.points[i];
            
            await new Promise(r => setTimeout(r, 10)); // Speed of drawing
            
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            updateHandPos(point);
        }
    }
    
    // Finish
    canvas.style.pointerEvents = 'auto';
    animateBtn.disabled = false;
    clearBtn.disabled = false;
    // hand.style.display = 'none'; // Keep hand at end or hide? Let's keep it.
}

function updateHandPos(point) {
    // We want the tip of the pen to be at point.x, point.y
    // If we assume the pen tip is at 0,0 of the image (top-left), use that.
    // If the image is large, we adjust via offsets.
    // Assuming the specific hand image provided needs some offset.
    const tipX = point.x + handOffsetX;
    const tipY = point.y + handOffsetY;
    hand.style.left = tipX + 'px';
    hand.style.top = tipY + 'px';
}
