const GAME = {
    width: 35,
    height: 20,
    map: [],
    player: { x: 0, y: 0, health: 100, attack: 1, inventory: { swords: 0, potions: 0 } },
    enemies: [],
    items: { swords: [], potions: [] },
    gameOver: false,
    intervalId: null,

    init() {
        this.createMap();
        this.generateRooms();
        this.connectRooms();
        this.placeEntities();
        this.render();
        this.setupControls();
        this.gameLoop();
    },

    createMap() {
        for (let y = 0; y < this.height; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.map[y][x] = 'wall';
            }
        }
    },

    generateRooms() {
        const rooms = [];
        const roomCount = 5 + Math.floor(Math.random() * 6); // 5-10 комнат

        for (let i = 0; i < roomCount; i++) {
            let valid = false;
            let attempts = 0;

            while (!valid && attempts < 100) {
                const w = 3 + Math.floor(Math.random() * 6); // 3-8 клеток
                const h = 3 + Math.floor(Math.random() * 6);
                const x = Math.floor(Math.random() * (this.width - w));
                const y = Math.floor(Math.random() * (this.height - h));

                valid = true;
                for (let sy = y; sy < y + h; sy++) {
                    for (let sx = x; sx < x + w; sx++) {
                        if (this.map[sy]?.[sx] !== 'wall') valid = false;
                    }
                    if (!valid) break;
                }

                if (valid) {
                    for (let sy = y; sy < y + h; sy++) {
                        for (let sx = x; sx < x + w; sx++) {
                            this.map[sy][sx] = 'floor';
                        }
                    }
                    rooms.push({ x, y, w, h });
                }
                attempts++;
            }
        }
        this.rooms = rooms;
        // ВРЕМЕННО: Выводим карту в консоль для отладки
        var floorCount = 0;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                if (this.map[y][x] === 'floor') floorCount++;
            }
        }
        console.log('Количество клеток floor:', floorCount);
        console.log('Rooms:', this.rooms);
    },

    connectRooms() {
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const roomA = this.rooms[i];
            const roomB = this.rooms[i + 1];

            // Горизонтальный коридор
            const xStart = Math.floor(Math.min(roomA.x + roomA.w / 2, roomB.x + roomB.w / 2));
            const xEnd = Math.floor(Math.max(roomA.x + roomA.w / 2, roomB.x + roomB.w / 2));
            const yCorridor = Math.floor((roomA.y + roomA.h / 2));

            for (let x = xStart; x <= xEnd; x++) {
                this.map[yCorridor][x] = 'floor';
            }

            // Вертикальный коридор
            const yStart = Math.floor(Math.min(roomA.y + roomA.h / 2, roomB.y + roomB.h / 2));
            const yEnd = Math.floor(Math.max(roomA.y + roomA.h / 2, roomB.y + roomB.h / 2));
            const xCorridor = xEnd;

            for (let y = yStart; y <= yEnd; y++) {
                this.map[y][xCorridor] = 'floor';
            }
        }
    },

    placeEntities() {
        // Игрок
        do {
            this.player.x = Math.floor(Math.random() * this.width);
            this.player.y = Math.floor(Math.random() * this.height);
        } while (this.map[this.player.y][this.player.x] !== 'floor');

        // Враги (10 шт)
        this.enemies = [];
        for (let i = 0; i < 10; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * this.width);
                y = Math.floor(Math.random() * this.height);
            } while (
                this.map[y][x] !== 'floor' ||
                (x === this.player.x && y === this.player.y) ||
                this.enemies.some(e => e.x === x && e.y === y)
            );
            this.enemies.push({ x, y, health: 50 });
        }

        // Мечи (2 шт)
        this.items.swords = [];
        for (let i = 0; i < 2; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * this.width);
                y = Math.floor(Math.random() * this.height);
            } while (
                this.map[y][x] !== 'floor' ||
                (x === this.player.x && y === this.player.y) ||
                this.enemies.some(e => e.x === x && e.y === y) ||
                this.items.swords.some(s => s.x === x && s.y === y)
            );
            this.items.swords.push({ x, y });
        }

        // Зелья (10 шт)
        this.items.potions = [];
        for (let i = 0; i < 10; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * this.width);
                y = Math.floor(Math.random() * this.height);
            } while (
                this.map[y][x] !== 'floor' ||
                (x === this.player.x && y === this.player.y) ||
                this.enemies.some(e => e.x === x && e.y === y) ||
                this.items.swords.some(s => s.x === x && s.y === y) ||
                this.items.potions.some(p => p.x === x && p.y === y)
            );
            this.items.potions.push({ x, y });
        }
    },

    render() {
        const field = document.querySelector('.field');
        field.innerHTML = '';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = document.createElement('div');
                tile.className = 'tile ' + this.map[y][x];
                tile.style.left = (x * 50) + 'px';
                tile.style.top = (y * 50) + 'px';

                // Отображение игрока
                if (this.player.x === x && this.player.y === y) {
                    tile.classList.add('player');
                    this.addHealthBar(tile, this.player.health, true);
                }

                // Отображение врагов
                this.enemies.forEach(enemy => {
                    if (enemy.x === x && enemy.y === y) {
                        tile.classList.add('enemy');
                        this.addHealthBar(tile, enemy.health, false);
                    }
                });

                // Отображение предметов
                this.items.swords.forEach(sword => {
                    if (sword.x === x && sword.y === y) {
                        tile.classList.add('sword');
                    }
                });
                this.items.potions.forEach(potion => {
                    if (potion.x === x && potion.y === y) {
                        tile.classList.add('potion');
                    }
                });

                field.appendChild(tile);
            }
        }
        // Показываем Game Over, если нужно
        if (this.gameOver) {
            let over = document.createElement('div');
            over.className = 'game-over';
            over.innerHTML = 'Game Over';
            field.appendChild(over);
        }
        // Инвентарь
        var inv = document.querySelector('.inventory');
        if (inv) {
            inv.innerHTML = '';
            // Мечи
            for (var i = 0; i < this.player.inventory.swords; i++) {
                var sword = document.createElement('div');
                sword.className = 'inv-item inv-sword';
                inv.appendChild(sword);
            }
            // Зелья
            for (var i = 0; i < this.player.inventory.potions; i++) {
                var potion = document.createElement('div');
                potion.className = 'inv-item inv-potion';
                potion.title = 'Использовать зелье';
                potion.onclick = function() {
                    if (GAME.player.health < 100 && GAME.player.inventory.potions > 0) {
                        GAME.player.health = Math.min(100, GAME.player.health + 20);
                        GAME.player.inventory.potions--;
                        GAME.render();
                    }
                };
                inv.appendChild(potion);
            }
        }
    },

    addHealthBar(tile, health, isPlayer) {
        var bar = document.createElement('div');
        bar.className = 'health-bar';
        bar.style.width = Math.max(0, health) + '%';
        if (isPlayer) bar.style.backgroundColor = '#00ff00';
        tile.appendChild(bar);
    },

    movePlayer(dx, dy) {
        if (this.gameOver) return;
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        if (
            newX >= 0 && newX < this.width &&
            newY >= 0 && newY < this.height &&
            this.map[newY][newX] === 'floor'
        ) {
            this.player.x = newX;
            this.player.y = newY;
            this.checkItems();
        }
    },

    checkItems() {
        // Мечи
        this.items.swords = this.items.swords.filter(sword => {
            if (sword.x === this.player.x && sword.y === this.player.y) {
                this.player.attack += 1;
                this.player.inventory.swords += 1;
                return false;
            }
            return true;
        });
        // Зелья
        this.items.potions = this.items.potions.filter(potion => {
            if (potion.x === this.player.x && potion.y === this.player.y) {
                if (this.player.health === 100) {
                    this.player.inventory.potions += 1;
                    return false;
                } else {
                    this.player.health = Math.min(100, this.player.health + 20);
                    return false;
                }
            }
            return true;
        });
    },

    attackEnemies() {
        if (this.gameOver) return;
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        directions.forEach(dir => {
            const targetX = this.player.x + dir.x;
            const targetY = this.player.y + dir.y;
            this.enemies = this.enemies.filter(enemy => {
                if (enemy.x === targetX && enemy.y === targetY) {
                    enemy.health -= this.player.attack;
                    if (enemy.health <= 0) {
                        return false;
                    }
                }
                return true;
            });
        });
    },

    moveEnemy(enemy) {
        if (this.gameOver) return;
        var dirs = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        var dir = dirs[Math.floor(Math.random() * dirs.length)];
        var newX = enemy.x + dir.x;
        var newY = enemy.y + dir.y;
        if (
            newX >= 0 && newX < this.width &&
            newY >= 0 && newY < this.height &&
            this.map[newY][newX] === 'floor' &&
            !(this.player.x === newX && this.player.y === newY) &&
            !this.enemies.some(e => e !== enemy && e.x === newX && e.y === newY)
        ) {
            enemy.x = newX;
            enemy.y = newY;
        }
        // Атака игрока, если рядом
        if (Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y) === 1) {
            this.player.health -= 10;
            if (this.player.health <= 0) {
                this.player.health = 0;
                this.endGame();
            }
        }
    },

    gameLoop() {
        this.intervalId = setInterval(() => {
            if (this.gameOver) return;
            this.enemies.forEach(enemy => this.moveEnemy(enemy));
            this.render();
        }, 500);
    },

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            var key = e.key.toLowerCase();
            switch (key) {
                case 'w': case 'ц': this.movePlayer(0, -1); break;
                case 'a': case 'ф': this.movePlayer(-1, 0); break;
                case 's': case 'ы': this.movePlayer(0, 1); break;
                case 'd': case 'в': this.movePlayer(1, 0); break;
                case ' ': this.attackEnemies(); break;
            }
            this.render();
        });
    },

    endGame() {
        this.gameOver = true;
        if (this.intervalId) clearInterval(this.intervalId);
        this.render();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    GAME.init();
});