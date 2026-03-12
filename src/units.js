export class Unit {
    constructor(scene, config) {
        this.scene = scene;

        this.team = config.team;
        this.role = config.role;
        this.x = config.x;
        this.y = config.y;

        this.radius = 14;
        this.alive = true;

        this.attackCooldown = 0;
        this.healCooldown = 0;

        this.commandTarget = null;

        this.setRoleStats(this.role);
        this.hp = this.maxHp;
    }

    setRoleStats(role) {
        if (role === 'tank') {
            this.maxHp = 220;
            this.damage = 16;
            this.range = 28;
            this.speed = 42;
            this.attackRate = 0.9;
            this.color = this.team === 1 ? 0x2e86de : 0xe74c3c;
        } else if (role === 'melee') {
            this.maxHp = 130;
            this.damage = 28;
            this.range = 24;
            this.speed = 62;
            this.attackRate = 0.7;
            this.color = this.team === 1 ? 0x54a0ff : 0xff6b6b;
        } else if (role === 'ranged') {
            this.maxHp = 100;
            this.damage = 18;
            this.range = 150;
            this.speed = 52;
            this.attackRate = 0.75;
            this.color = this.team === 1 ? 0x48dbfb : 0xff9f43;
        } else if (role === 'healer') {
            this.maxHp = 90;
            this.damage = 0;
            this.range = 110;
            this.speed = 50;
            this.attackRate = 0;
            this.healPower = 20;
            this.healRate = 0.65;
            this.color = this.team === 1 ? 0x1dd1a1 : 0xf368e0;
        }
    }

    setCommandTarget(x, y) {
        this.commandTarget = { x, y };
    }

    clearCommandTarget() {
        this.commandTarget = null;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    containsPoint(px, py) {
        return Phaser.Math.Distance.Between(px, py, this.x, this.y) <= this.radius + 6;
    }

    update(delta, allies, enemies) {
        if (!this.alive) return;

        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.healCooldown > 0) this.healCooldown -= delta;

        if (this.role === 'healer') {
            this.updateHealer(delta, allies, enemies);
        } else {
            this.updateFighter(delta, enemies);
        }

        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    updateFighter(delta, enemies) {
        const target = this.chooseEnemyTarget(enemies);
        if (!target) return;

        const dist = distance(this.x, this.y, target.x, target.y);

        if (this.role === 'ranged') {
            const desiredMin = 95;
            const desiredMax = 140;

            if (dist > desiredMax) {
                this.moveTowards(target.x, target.y, delta);
            } else if (dist < desiredMin) {
                this.moveAwayFrom(target.x, target.y, delta);
            }
        } else {
            if (dist > this.range) {
                this.moveTowards(target.x, target.y, delta);
            }
        }

        if (dist <= this.range && this.attackCooldown <= 0) {
            target.hp -= this.damage;
            this.attackCooldown = this.attackRate;
        }
    }

    updateHealer(delta, allies, enemies) {
        const healTarget = this.chooseHealTarget(allies);
        const nearestEnemy = this.findNearest(enemies);

        if (nearestEnemy) {
            const enemyDist = distance(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            if (enemyDist < 70) {
                this.moveAwayFrom(nearestEnemy.x, nearestEnemy.y, delta);
                return;
            }
        }

        if (healTarget) {
            const dist = distance(this.x, this.y, healTarget.x, healTarget.y);

            if (dist > this.range) {
                this.moveTowards(healTarget.x, healTarget.y, delta);
            }

            if (dist <= this.range && this.healCooldown <= 0) {
                healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + this.healPower);
                this.healCooldown = this.healRate;
            }
        } else {
            const frontAlly = this.findFrontAlly(allies);
            if (frontAlly) {
                const dist = distance(this.x, this.y, frontAlly.x, frontAlly.y);
                if (dist > 80) {
                    this.moveTowards(frontAlly.x, frontAlly.y, delta);
                }
            }
        }
    }

    updateCommandMove(delta) {
        if (!this.alive || !this.commandTarget) return true;

        const dist = distance(this.x, this.y, this.commandTarget.x, this.commandTarget.y);

        if (dist < 8) {
            return true;
        }

        this.moveTowards(this.commandTarget.x, this.commandTarget.y, delta);
        return false;
    }

    chooseEnemyTarget(enemies) {
        const liveEnemies = enemies.filter(u => u.alive);
        if (liveEnemies.length === 0) return null;

        if (this.role === 'melee') {
            const priority = liveEnemies.filter(u => u.role === 'ranged' || u.role === 'healer');
            if (priority.length > 0) return this.findNearest(priority);
        }

        if (this.role === 'tank') {
            const meleeThreats = liveEnemies.filter(u => u.role === 'tank' || u.role === 'melee');
            if (meleeThreats.length > 0) return this.findNearest(meleeThreats);
        }

        return this.findNearest(liveEnemies);
    }

    chooseHealTarget(allies) {
        const wounded = allies.filter(u => u.alive && u.hp < u.maxHp * 0.75);
        if (wounded.length === 0) return null;

        wounded.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
        return wounded[0];
    }

    findNearest(units) {
        let best = null;
        let bestDist = Infinity;

        for (const unit of units) {
            if (!unit.alive) continue;

            const dist = distance(this.x, this.y, unit.x, unit.y);
            if (dist < bestDist) {
                bestDist = dist;
                best = unit;
            }
        }

        return best;
    }

    findFrontAlly(allies) {
        const liveAllies = allies.filter(u => u.alive && u !== this);
        if (liveAllies.length === 0) return null;

        let best = liveAllies[0];

        for (const ally of liveAllies) {
            if (this.team === 1) {
                if (ally.x > best.x) best = ally;
            } else {
                if (ally.x < best.x) best = ally;
            }
        }

        return best;
    }

    moveTowards(tx, ty, delta) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return;

        this.x += (dx / len) * this.speed * delta;
        this.y += (dy / len) * this.speed * delta;
    }

    moveAwayFrom(tx, ty, delta) {
        const dx = this.x - tx;
        const dy = this.y - ty;
        const len = Math.hypot(dx, dy);
        if (len === 0) return;

        this.x += (dx / len) * this.speed * delta;
        this.y += (dy / len) * this.speed * delta;
    }

    draw(graphics, labelTexts, isSelected = false) {
        if (!this.alive) return;

        if (isSelected) {
            graphics.lineStyle(3, 0xffff88, 1);
            graphics.strokeCircle(this.x, this.y, this.radius + 7);
        }

        graphics.fillStyle(this.color);
        graphics.fillCircle(this.x, this.y, this.radius);

        graphics.lineStyle(2, 0x111111, 1);
        graphics.strokeCircle(this.x, this.y, this.radius);

        const barW = 34;
        const barH = 5;
        const hpRatio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

        graphics.fillStyle(0x222222);
        graphics.fillRect(this.x - barW / 2, this.y - 24, barW, barH);

        graphics.fillStyle(0x2ecc71);
        graphics.fillRect(this.x - barW / 2, this.y - 24, barW * hpRatio, barH);

        const roleLetter =
            this.role === 'tank' ? 'T' :
            this.role === 'melee' ? 'M' :
            this.role === 'ranged' ? 'R' : 'H';

        const txt = this.scene.add.text(this.x, this.y - 2, roleLetter, {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5);

        labelTexts.push(txt);
    }
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}