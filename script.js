const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screens
const mainMenu = document.getElementById('mainMenu');
const levelMenu = document.getElementById('levelMenu');
const gameScreen = document.getElementById('gameScreen');
const gameOverOverlay = document.getElementById('gameOverOverlay');

// Elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('finalScore');
const highScoreText = document.getElementById('highScoreText');

// Buttons
const playBtn = document.getElementById('playBtn');
const homeBtn = document.getElementById('homeBtn');
const exitBtn = document.getElementById('exitBtn');
const gameHomeBtn = document.getElementById('gameHomeBtn');
const gameOverHomeBtn = document.getElementById('gameOverHomeBtn');
const restartBtn = document.getElementById('restartBtn');
const levelBtns = document.querySelectorAll('.level-btn');

// Mobile Controls
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

let gridSize = 20;
let tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let level = 1;
let selectedStartingLevel = 1;
let gameLoopId;
let gameSpeed = 150;
let isPlaying = false;
let obstacles = [];
let highScore = 0;

const COLORS = {
    snakeHead: '#10b981', // Emerald
    snakeBody: '#34d399',
    food: '#f43f5e', // Rose
    obstacle: '#475569' // Slate
};

// Initialize
function init() {
    // Load high score
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        highScoreText.textContent = highScore.toString().padStart(4, '0');
    }
    showScreen('mainMenu');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startGame(startingLevel) {
    level = startingLevel || 1;
    selectedStartingLevel = level;
    
    // Fix for Level 3 collision: spawn at safe top-left spot moving right
    snake = [
        { x: 4, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 2 }
    ];
    dx = 1;
    dy = 0; 
    
    score = 0;
    
    if (level === 1) gameSpeed = 200;
    else if (level === 2) gameSpeed = 160;
    else if (level === 3) gameSpeed = 120;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    
    generateObstacles();
    spawnFood();
    
    isPlaying = true;
    gameOverOverlay.classList.remove('active');
    
    showScreen('gameScreen');
    gameLoop();
}

function generateObstacles() {
    obstacles = [];
    if (level === 2) {
        for (let i = 2; i < tileCount - 2; i++) {
            obstacles.push({ x: i, y: 3 });
            obstacles.push({ x: i, y: tileCount - 4 });
        }
    } else if (level === 3) {
        // Adjusted maze so top left is clear for spawning
        let max = tileCount;
        for (let i = 3; i < 9; i++) obstacles.push({ x: i, y: 6 });
        for (let i = max - 9; i < max - 3; i++) obstacles.push({ x: i, y: 6 });
        for (let i = 6; i < max - 6; i++) obstacles.push({ x: Math.floor(max/2), y: i });
        for (let i = 3; i < 9; i++) obstacles.push({ x: i, y: max - 7 });
        for (let i = max - 9; i < max - 3; i++) obstacles.push({ x: i, y: max - 7 });
    }
}

function spawnFood() {
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        validPosition = true;
        
        for (let part of snake) {
            if (part.x === food.x && part.y === food.y) {
                validPosition = false;
                break;
            }
        }
        
        for (let obs of obstacles) {
            if (obs.x === food.x && obs.y === food.y) {
                validPosition = false;
                break;
            }
        }
    }
}

function drawRect(x, y, color, shadow = false) {
    ctx.fillStyle = color;
    if (shadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
    } else {
        ctx.shadowBlur = 0;
    }
    ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
}

function draw() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    obstacles.forEach(obs => drawRect(obs.x, obs.y, COLORS.obstacle, true));
    drawRect(food.x, food.y, COLORS.food, true);

    snake.forEach((part, index) => {
        const color = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
        drawRect(part.x, part.y, color, index === 0);
    });
}

function move() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        spawnFood();
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    
    for (let obs of obstacles) {
        if (head.x === obs.x && head.y === obs.y) return true;
    }
    
    return false;
}

function gameOver() {
    isPlaying = false;
    finalScoreElement.textContent = score;
    gameOverOverlay.classList.add('active');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreText.textContent = highScore.toString().padStart(4, '0');
    }
}

function gameLoop() {
    if (!isPlaying) return;
    move();
    if (checkCollision()) {
        gameOver();
        return;
    }
    draw();
    gameLoopId = setTimeout(gameLoop, gameSpeed);
}

// Control Logic
function setDirection(newDx, newDy) {
    if (!isPlaying) return;
    if (newDx !== 0 && dx === 0) { dx = newDx; dy = 0; }
    if (newDy !== 0 && dy === 0) { dx = 0; dy = newDy; }
}

document.addEventListener('keydown', (e) => {
    if (!isPlaying) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    if (e.key === 'ArrowUp' || e.key === 'w') setDirection(0, -1);
    else if (e.key === 'ArrowDown' || e.key === 's') setDirection(0, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'a') setDirection(-1, 0);
    else if (e.key === 'ArrowRight' || e.key === 'd') setDirection(1, 0);
});

// Mobile button listeners
upBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(0, -1); });
downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(0, 1); });
leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(-1, 0); });
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(1, 0); });

upBtn.addEventListener('mousedown', () => setDirection(0, -1));
downBtn.addEventListener('mousedown', () => setDirection(0, 1));
leftBtn.addEventListener('mousedown', () => setDirection(-1, 0));
rightBtn.addEventListener('mousedown', () => setDirection(1, 0));

// UI Button Listeners
playBtn.addEventListener('click', () => showScreen('levelMenu'));

levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const lvl = parseInt(btn.getAttribute('data-level'));
        startGame(lvl);
    });
});

const handleHome = () => {
    isPlaying = false;
    clearTimeout(gameLoopId);
    showScreen('mainMenu');
};

homeBtn.addEventListener('click', handleHome);
gameHomeBtn.addEventListener('click', handleHome);
gameOverHomeBtn.addEventListener('click', handleHome);

exitBtn.addEventListener('click', () => {
    // Cannot natively close window in most browsers, but we can reset
    handleHome();
    alert("Exit functionality depends on the app environment (e.g., closing the tab).");
});

restartBtn.addEventListener('click', () => startGame(selectedStartingLevel));

// Run init
init();
