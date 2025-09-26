// Track last death causes for Swahili modal
let lastDeathCauses = [];
/*jshint esversion: 6 */

// UI and Canvas Setup
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const scoreEl = document.querySelector('#scoreEl');
const modalEl = document.querySelector('#modalEl');
const bigScoreEl = document.querySelector('#bigScoreEl');
const startGameButton = document.querySelector('#startGameButton');
const quitGameButton = document.getElementById('quitGameButton');
const difficultySelect = document.getElementById('difficultySelect');
const thanksMessage = document.getElementById('thanksMessage');

canvas.width = innerWidth;
canvas.height = innerHeight;

// Game Assets
const lindaNchiImg = new Image();
lindaNchiImg.src = "Assets/linda-nchi.png"; // Load the image once

// List of vices for enemies
const viceList = ["Ufisadi", "Ubinafsi", "Ukabila", "Ulanguzi", "Magendo", "Uzembe", "Ujinga", "Propaganda", "Siasa chafu", "Mabadiliko ya tabianchi", "Gesi joto", "Ubaguzi", "Kisukuku", "Polio", "Vita", "Kiburi", "Ukiritimba", "Ubaguzi wa rangi", "Dhulma", "Kutesa Wanyama", "Usherati", "Hujuma", "Ulafi", "Uhaini"];

// =================================================================
//  CLASSES (Moved to Global Scope - FIX #1)
// =================================================================

class Player {
    constructor(x, y, radius, color) {
        // FIX #4: Added this.x and this.color assignments
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

class Projectile {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x += this.speed.x;
        this.y += this.speed.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.vice = viceList[Math.floor(Math.random() * viceList.length)];
        this.type = 'normal';
    }
    draw() {
        c.beginPath();
        c.font = "16px sans-serif";
        c.fillStyle = 'white'; // Make text visible
        c.fillText(`${this.vice}`, this.x - this.radius, this.y - this.radius - 5);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x += this.speed.x;
        this.y += this.speed.y;
    }
}

class Madeni extends Enemy {
    constructor(x, y, color, speed) {
        super(x, y, 40, color, speed); // Large radius
        this.type = 'madeni';
        this.hits = 3;
        this.vice = 'Madeni';
    }
    draw() {
        c.beginPath();
        c.font = "bold 22px sans-serif";
        c.fillStyle = 'white'; // Make text visible
        c.fillText(`${this.vice} (${this.hits})`, this.x - this.radius, this.y - this.radius - 10);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

class Riba extends Enemy {
    constructor(x, y, color, speed) {
        super(x, y, 20, color, speed); // Smaller radius
        this.type = 'riba';
        this.vice = 'Riba';
    }
     draw() {
        c.beginPath();
        c.font = "bold 18px sans-serif";
        c.fillStyle = 'white';
        c.fillText(`${this.vice}`, this.x - this.radius, this.y - this.radius - 5);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

const friction = 0.99;
class Particle {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.alpha = 1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update() {
        this.draw();
        this.speed.x *= friction;
        this.speed.y *= friction;
        this.x += this.speed.x;
        this.y += this.speed.y;
        this.alpha -= 0.01;
    }
}

// =================================================================
//  Game Variables
// =================================================================

let player; // FIX #3: Declare variables in the global scope
let projectiles;
let enemies;
let particles;
let score;
let animationID;
let spawnInterval; // To control the enemy spawning
let difficulty = 'normal';

// Center of the screen
const x = canvas.width / 2;
const y = canvas.height / 2;


function init() {
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
    bigScoreEl.innerHTML = score;
    // Clear any previous spawn interval
    if (spawnInterval) clearInterval(spawnInterval);
}

function getDifficultyMultiplier() {
    if (difficulty === 'easy') return 0.5;
    if (difficulty === 'hard') return 1.5;
    return 1;
}

function spawnEnemy() {
    spawnInterval = setInterval(() => {
        const radius = Math.random() * (30 - 10) + 10;
        let spawnX, spawnY;

        if (Math.random() < 0.5) {
            spawnX = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            spawnY = Math.random() * canvas.height;
        } else {
            spawnX = Math.random() * canvas.width;
            spawnY = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(y - spawnY, x - spawnX);
        const speedMultiplier = getDifficultyMultiplier();
        const speed = {
            x: Math.cos(angle) * speedMultiplier,
            y: Math.sin(angle) * speedMultiplier
        };

        // Decide which enemy type to spawn
        if (Math.random() < 0.1) { // 10% chance for Madeni
            enemies.push(new Madeni(spawnX, spawnY, color, { x: speed.x * 0.5, y: speed.y * 0.5 }));
        } else {
            enemies.push(new Enemy(spawnX, spawnY, radius, color, speed));
        }
    }, 1000); // Spawn every 1 second
}


function animate() {
    animationID = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.3)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // FIX (IMPROVEMENT): Draw the image efficiently from the pre-loaded variable
    if (lindaNchiImg.complete) {
        c.drawImage(lindaNchiImg,
            canvas.width / 2 - lindaNchiImg.width / 2,
            canvas.height / 2 - lindaNchiImg.height / 2
        );
    }
    
    player.draw();

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        // Check collision with player
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distToPlayer - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationID);
            clearInterval(spawnInterval); // Stop spawning new enemies
            modalEl.style.display = 'flex';
            bigScoreEl.innerHTML = score;
            // Show only the last bubble that caused game over
            const cause = enemy.vice;
            let causeText = '';
            // Unique Swahili sentences for each cause
            // Unique, funny Swahili phrases for each bubble
            const bubblePhrases = {
                'Ufisadi': 'Ufisadi umechukua mshahara wako na roho yako! 😂',
                'Polio': 'Polio imekufanya usitembee tena kwenye uwanja wa vita! 🦽',
                'Ubaguzi wa rangi': 'Ubaguzi wa rangi umefanya timu yako ikose mshikamano! 🌈',
                'Propaganda': 'Propaganda imekuzungusha hadi ukasahau lengo lako! 📢',
                'Ubinafsi': 'Ubinafsi umefanya usaidizi wote ukimbie! 🤦‍♂️',
                'Ukabila': 'Ukabila umefanya marafiki wakukimbie! 🏃‍♂️',
                'Ulanguzi': 'Ulanguzi umefanya silaha zako ziwe ghali mno! 💸',
                'Magendo': 'Magendo yamekufanya ushindwe kupata vifaa! 📦',
                'Uzembe': 'Uzembe umefanya usingizi ukupate vitani! 😴',
                'Ujinga': 'Ujinga umefanya usijue adui yuko wapi! 🤷‍♂️',
                'Siasa chafu': 'Siasa chafu zimevuruga mipango yako! 🗳️',
                'Mabadiliko ya tabianchi': 'Tabianchi imeleta mvua uwanjani! 🌧️',
                'Gesi joto': 'Gesi joto imefanya joto likupige! 🔥',
                'Kisukuku': 'Kisukuku kimekufanya usikimbie haraka! 🐢',
                'Vita': 'Vita vimekuwa vikubwa kuliko ulivyodhani! 💣',
                'Kiburi': 'Kiburi kimekufanya usisikilize ushauri! 😎',
                'Ukiritimba': 'Ukiritimba umezuia maendeleo yako! 🚧',
                'Dhulma': 'Dhulma imefanya wachezaji wakukimbie! 😢',
                'Kutesa Wanyama': 'Kutesa wanyama kimekufanya simba akukasirike! 🦁',
                'Usherati': 'Usherati umefanya nguvu zako zipungue! 😳',
                'Hujuma': 'Hujuma imevuruga mipango yako! 🕵️‍♂️',
                'Ulafi': 'Ulafi umefanya chakula kiishe! 🍔',
                'Uhaini': 'Uhaini umefanya timu yako ikusaliti! 🕵️‍♀️',
                'Madeni': 'Madeni yamekufanya ushindwe kununua silaha! 💰',
                'Riba': 'Riba imekula faida zako zote! 📉',
            };
            causeText = bubblePhrases[cause] || `${cause} imekushinda leo!`; 
            causeText += ' Bahati njema wakati ujao!';
            // Show cause in modal
            let modalDiv = modalEl.querySelector('div');
            if (modalDiv) {
                let causeEl = modalDiv.querySelector('#causeEl');
                if (!causeEl) {
                    causeEl = document.createElement('p');
                    causeEl.id = 'causeEl';
                    causeEl.className = 'text-red-600 text-lg font-bold mt-2';
                    modalDiv.appendChild(causeEl);
                }
                causeEl.textContent = causeText;
            }
        }

        // Check collision with projectiles
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // If projectile hits enemy
            if (dist - enemy.radius - projectile.radius < 1) {

                // =================================================================
                //  FIX #2: All this logic was outside the `if` block. It is now inside.
                // =================================================================
                
                // Create explosion particles
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }

                if (enemy.type === 'madeni') {
                    score += 100;
                    scoreEl.innerHTML = score;
                    enemy.hits--;
                    if (enemy.hits > 0) {
                        //gsap.to(enemy, { radius: enemy.radius - 8 }); // You need to import GSAP for this
                        enemy.radius -= 8; // Simple alternative
                        projectiles.splice(projectileIndex, 1);
                    } else {
                         // Split into 2 riba bubbles
                        for (let j = 0; j < 2; j++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = { x: Math.cos(angle) * 2, y: Math.sin(angle) * 2 };
                            enemies.push(new Riba(enemy.x, enemy.y, enemy.color, speed));
                        }
                        score += 200;
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                    }
                } else if (enemy.type === 'riba') {
                    score += 75;
                    scoreEl.innerHTML = score;
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);
                } else { // Normal enemy logic
                    score += 50;
                    scoreEl.innerHTML = score;
                    if (enemy.radius - 10 > 5) {
                        // gsap.to(enemy, { radius: enemy.radius - 10 });
                        enemy.radius -= 10;
                        projectiles.splice(projectileIndex, 1);
                    } else {
                        score += 75; // Bonus for finishing it off
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                    }
                }
            }
        });
    });
}

// =================================================================
//  Event Listeners
// =================================================================

// Improved shooting accuracy for mouse/touch
function getPointerPosition(event) {
    let clientX, clientY;
    if (event.touches && event.touches.length) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    // Adjust for canvas position
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function shootProjectile(event) {
    if (modalEl.style.display === 'none') {
        const pointer = getPointerPosition(event);
        const angle = Math.atan2(pointer.y - player.y, pointer.x - player.x);
        const speed = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        };
        projectiles.push(new Projectile(player.x, player.y, 5, 'white', speed));
    }
}

canvas.addEventListener('click', shootProjectile);
canvas.addEventListener('touchstart', shootProjectile);


// Difficulty selection
if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
        difficulty = e.target.value;
    });
}

startGameButton.addEventListener('click', () => {
    difficulty = difficultySelect ? difficultySelect.value : 'normal';
    init();
    animate();
    spawnEnemy();
    modalEl.style.display = 'none';
});

// Quit button logic with Swahili quit message
if (quitGameButton) {
    quitGameButton.addEventListener('click', () => {
        cancelAnimationFrame(animationID);
        clearInterval(spawnInterval);
        modalEl.style.display = 'flex';
        bigScoreEl.innerHTML = score;
        // Show quit message in modal
        let modalDiv = modalEl.querySelector('div');
        if (modalDiv) {
            let causeEl = modalDiv.querySelector('#causeEl');
            if (!causeEl) {
                causeEl = document.createElement('p');
                causeEl.id = 'causeEl';
                causeEl.className = 'text-red-600 text-lg font-bold mt-2';
                modalDiv.appendChild(causeEl);
            }
            causeEl.textContent = 'Umeacha mchezo. Bahati njema wakati ujao!';
        }
    });
}