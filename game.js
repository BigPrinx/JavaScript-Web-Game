const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let tileSize = 40;
const mapWidth = 20;
const mapHeight = 15;
let gamePaused = false;
let currentLevel = 1;

const player = {
    x: 1,
    y: 1,
    width: 0.8 * tileSize,
    height: 0.8 * tileSize,
    color: 'blue',
    lives: 3,
    hasAxe: false,
    canShoot: false // Added for projectile feature
};

const enemies = [];
const items = [];
const projectiles = []; // Added for projectile feature

const tiles = [];

function init() {
    tiles.length = 0;
    for (let y = 0; y < mapHeight; y++) {
        const row = [];
        for (let x = 0; x < mapWidth; x++) {
            const tileType = Math.random() < 0.5 ? 'grass' : 'dirt';
            row.push(tileType);
        }
        tiles.push(row);
    }

    player.x = 1;
    player.y = 1;
    player.lives = 3;
    player.hasAxe = false;
    player.canShoot = false; // Reset projectile ability
    projectiles.length = 0; // Clear projectiles

    enemies.length = 0;
    for (let i = 0; i < 5; i++) {
        enemies.push({
            x: Math.floor(Math.random() * mapWidth),
            y: Math.floor(Math.random() * mapHeight),
            width: 0.8 * tileSize,
            height: 0.8 * tileSize,
            color: 'red',
            speed: 0.02,
            state: 'patrol',
            patrolPoints: [
                { x: Math.floor(Math.random() * mapWidth), y: Math.floor(Math.random() * mapHeight) },
                { x: Math.floor(Math.random() * mapWidth), y: Math.floor(Math.random() * mapHeight) }
            ],
            patrolIndex: 0
        });
    }

    items.length = 0;
    items.push({
        x: Math.floor(Math.random() * mapWidth),
        y: Math.floor(Math.random() * mapHeight),
        width: 0.5 * tileSize,
        height: 0.5 * tileSize,
        color: 'yellow',
        type: 'axe'
    });

    resizeCanvas();
    draw();
}

function resizeCanvas() {
    const scale = Math.min(window.innerWidth / (mapWidth * tileSize), window.innerHeight / (mapHeight * tileSize));
    canvas.width = mapWidth * tileSize * scale;
    canvas.height = mapHeight * tileSize * scale;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = (window.innerHeight * 0.6) + 'px';
    tileSize = 40 * scale;
    draw();
}

window.addEventListener('resize', resizeCanvas);

function draw() {
    if (gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tileType = tiles[y][x];
            ctx.fillStyle = tileType === 'grass' ? 'green' : 'brown';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x * tileSize, player.y * tileSize, player.width, player.height);

    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x * tileSize, enemy.y * tileSize, enemy.width, enemy.height);
    });

    items.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x * tileSize, item.y * tileSize, item.width, item.height);
    });

    projectiles.forEach(projectile => { // Draw projectiles
        ctx.fillStyle = projectile.color;
        ctx.fillRect(projectile.x * tileSize, projectile.y * tileSize, projectile.width, projectile.height);
    });

    // Update HUD
    document.getElementById('lives').innerText = `Lives: ${player.lives}`;
    document.getElementById('level').innerText = `Level: ${currentLevel}`;
}

function movePlayer(dx, dy) {
    if (gamePaused) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
        player.x = newX;
        player.y = newY;
        checkCollisions();
        draw();
    }
}

function moveEnemies() {
    enemies.forEach(enemy => {
        if (gamePaused) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            enemy.state = 'chase';
        } else {
            enemy.state = 'patrol';
        }

        if (enemy.state === 'chase') {
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        } else if (enemy.state === 'patrol') {
            const patrolPoint = enemy.patrolPoints[enemy.patrolIndex];
            const patrolDX = patrolPoint.x - enemy.x;
            const patrolDY = patrolPoint.y - enemy.y;
            const patrolDistance = Math.sqrt(patrolDX * patrolDX + patrolDY * patrolDY);

            if (patrolDistance < 1) {
                enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPoints.length;
            } else {
                enemy.x += (patrolDX / patrolDistance) * enemy.speed;
                enemy.y += (patrolDY / patrolDistance) * enemy.speed;
            }
        }

        if (Math.abs(player.x - enemy.x) < 1 && Math.abs(player.y - enemy.y) < 1) {
            if (player.hasAxe) {
                enemies.splice(enemies.indexOf(enemy), 1);
            } else {
                player.lives -= 1;
                if (player.lives <= 0) {
                    alert('Game Over!');
                    currentLevel = 1; // Reset to level 1
                    init();
                }
            }
        }
    });
}

function checkCollisions() {
    items.forEach((item, index) => {
        if (player.x === item.x && player.y === item.y) {
            if (item.type === 'axe') {
                player.hasAxe = true;
                items.splice(index, 1);
            }
        }
    });

    if (enemies.length === 0) { // Check if all enemies are defeated
        setTimeout(() => {
            blackoutAndNextLevel();
        }, 500);
    }
}

function blackoutAndNextLevel() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => {
        currentLevel++;
        if (currentLevel > 20) {
            player.canShoot = true;
        }
        init();
    }, 1000);
}

function shootProjectile() {
    if (player.canShoot) {
        projectiles.push({
            x: player.x,
            y: player.y,
            width: 0.3 * tileSize,
            height: 0.3 * tileSize,
            color: 'yellow',
            speed: 0.1 // Speed of projectile
        });
    }
}

function moveProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.y -= projectile.speed;
        if (projectile.y < 0) {
            projectiles.splice(index, 1);
        }
    });
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
        case ' ':
            shootProjectile(); // Space key to shoot
            break;
    }
});

document.getElementById('upButton').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('downButton').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('leftButton').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('rightButton').addEventListener('click', () => movePlayer(1, 0));

document.getElementById('pausePlayButton').addEventListener('click', () => {
    gamePaused = !gamePaused;
    document.getElementById('pausePlayButton').innerText = gamePaused ? 'Play' : 'Pause';
    if (!gamePaused) draw();
});

document.getElementById('restartButton').addEventListener('click', init);

function gameLoop() {
    if (!gamePaused) {
        moveEnemies();
        moveProjectiles();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

init();
gameLoop();
