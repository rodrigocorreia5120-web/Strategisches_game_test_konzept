import { Unit } from '../units.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    create() {
        this.graphics = this.add.graphics();
        this.roleTexts = [];
        this.roundOver = false;

        this.battleStarted = false;
        this.waitingForCommand = true;
        this.commandPoint = null;

        this.draggedUnit = null;

        this.spawnZoneBlue = {
            x: 40,
            y: 140,
            width: 260,
            height: 300
        };

        this.infoText = this.add.text(20, 20, '', {
            fontSize: '22px',
            color: '#ffffff'
        });

        this.subText = this.add.text(20, 52, '', {
            fontSize: '16px',
            color: '#bbbbbb'
        });

        this.input.mouse.disableContextMenu();

        this.input.on('pointerdown', (pointer) => {
            if (!this.waitingForCommand) return;

            if (pointer.rightButtonDown()) {
                this.issueMoveCommand(pointer.worldX, pointer.worldY);
                return;
            }

            if (pointer.leftButtonDown()) {
                const clickedUnit = this.getBlueUnitAt(pointer.worldX, pointer.worldY);
                if (clickedUnit) {
                    this.draggedUnit = clickedUnit;
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.waitingForCommand) return;
            if (!this.draggedUnit) return;

            const x = Phaser.Math.Clamp(
                pointer.worldX,
                this.spawnZoneBlue.x + this.draggedUnit.radius,
                this.spawnZoneBlue.x + this.spawnZoneBlue.width - this.draggedUnit.radius
            );

            const y = Phaser.Math.Clamp(
                pointer.worldY,
                this.spawnZoneBlue.y + this.draggedUnit.radius,
                this.spawnZoneBlue.y + this.spawnZoneBlue.height - this.draggedUnit.radius
            );

            this.draggedUnit.setPosition(x, y);
        });

        this.input.on('pointerup', () => {
            this.draggedUnit = null;
        });

        this.createTeams();
    }

    createTeams() {
        this.clearRoleTexts();

        this.team1 = [
            new Unit(this, { team: 1, role: 'tank',   x: 180, y: 220 }),
            new Unit(this, { team: 1, role: 'melee',  x: 160, y: 320 }),
            new Unit(this, { team: 1, role: 'ranged', x: 110, y: 250 }),
            new Unit(this, { team: 1, role: 'healer', x: 100, y: 360 })
        ];

        this.team2 = [
            new Unit(this, { team: 2, role: 'tank',   x: 1100, y: 220 }),
            new Unit(this, { team: 2, role: 'melee',  x: 1120, y: 320 }),
            new Unit(this, { team: 2, role: 'ranged', x: 1170, y: 250 }),
            new Unit(this, { team: 2, role: 'healer', x: 1180, y: 360 })
        ];

        this.allUnits = [...this.team1, ...this.team2];
        this.roundOver = false;
        this.battleStarted = false;
        this.waitingForCommand = true;
        this.commandPoint = null;
        this.draggedUnit = null;
    }

    issueMoveCommand(rawX, rawY) {
        if (!this.waitingForCommand) return;

        this.commandPoint = {
            x: Phaser.Math.Clamp(rawX, 40, 1240),
            y: Phaser.Math.Clamp(rawY, 120, 660)
        };

        const center = this.getTeamCenter(this.team1);

        for (const unit of this.team1) {
            const offsetX = unit.x - center.x;
            const offsetY = unit.y - center.y;
            unit.setCommandTarget(
                this.commandPoint.x + offsetX,
                this.commandPoint.y + offsetY
            );
        }

        this.waitingForCommand = false;
        this.battleStarted = false;
        this.draggedUnit = null;
    }

    getTeamCenter(team) {
        let sumX = 0;
        let sumY = 0;

        for (const unit of team) {
            sumX += unit.x;
            sumY += unit.y;
        }

        return {
            x: sumX / team.length,
            y: sumY / team.length
        };
    }

    getBlueUnitAt(x, y) {
        for (let i = this.team1.length - 1; i >= 0; i--) {
            const unit = this.team1[i];
            if (unit.containsPoint(x, y)) {
                return unit;
            }
        }
        return null;
    }

    update(time, deltaMs) {
        const delta = deltaMs / 1000;

        this.graphics.clear();
        this.clearRoleTexts();

        this.drawBackground();

        if (this.waitingForCommand) {
            this.infoText.setText('Formation setzen');
            this.subText.setText('Linksklick ziehen = Blau positionieren | Rechtsklick = Marschbefehl');

            this.drawBlueSpawnZone();
        } else if (!this.battleStarted) {
            this.infoText.setText('Team Blau marschiert');
            this.subText.setText('Sobald die Formation angekommen ist, startet der Kampf');

            let allArrived = true;
            for (const unit of this.team1) {
                const arrived = unit.updateCommandMove(delta);
                if (!arrived) allArrived = false;
            }

            if (allArrived) {
                for (const unit of this.team1) {
                    unit.clearCommandTarget();
                }
                this.battleStarted = true;
            }
        } else if (!this.roundOver) {
            for (const unit of this.team1) {
                unit.update(delta, this.team1, this.team2);
            }

            for (const unit of this.team2) {
                unit.update(delta, this.team2, this.team1);
            }

            this.keepUnitsInBounds();

            const team1Alive = this.team1.some(u => u.alive);
            const team2Alive = this.team2.some(u => u.alive);

            if (!team1Alive || !team2Alive) {
                this.roundOver = true;

                if (team1Alive && !team2Alive) {
                    this.infoText.setText('Team Blau gewinnt');
                } else if (!team1Alive && team2Alive) {
                    this.infoText.setText('Team Rot gewinnt');
                } else {
                    this.infoText.setText('Unentschieden');
                }

                this.subText.setText('Neustart in 2 Sekunden');

                this.time.delayedCall(2000, () => {
                    this.createTeams();
                });
            } else {
                this.infoText.setText('Auto-Battle Test');
                this.subText.setText('Blau vs Rot | T = Tank, M = Melee, R = Ranged, H = Healer');
            }
        }

        this.keepUnitsInBounds();

        for (const unit of this.allUnits) {
            unit.draw(this.graphics, this.roleTexts, unit === this.draggedUnit);
        }

        if (this.waitingForCommand) {
            this.drawCursorCross();
        }

        if (this.commandPoint && !this.roundOver) {
            this.drawCommandMarker(this.commandPoint.x, this.commandPoint.y);
        }
    }

    drawBackground() {
        this.graphics.fillStyle(0x0f1720);
        this.graphics.fillRect(0, 0, 1280, 720);

        this.graphics.fillStyle(0x13202d);
        this.graphics.fillRect(0, 160, 1280, 400);

        this.graphics.lineStyle(2, 0x1f2f40, 1);
        this.graphics.lineBetween(640, 120, 640, 600);

        this.graphics.fillStyle(0x1b2d42);
        this.graphics.fillCircle(120, 290, 55);

        this.graphics.fillStyle(0x3b1f24);
        this.graphics.fillCircle(1160, 290, 55);
    }

    drawBlueSpawnZone() {
        this.graphics.fillStyle(0x245d9c, 0.18);
        this.graphics.fillRect(
            this.spawnZoneBlue.x,
            this.spawnZoneBlue.y,
            this.spawnZoneBlue.width,
            this.spawnZoneBlue.height
        );

        this.graphics.lineStyle(2, 0x6cb6ff, 0.9);
        this.graphics.strokeRect(
            this.spawnZoneBlue.x,
            this.spawnZoneBlue.y,
            this.spawnZoneBlue.width,
            this.spawnZoneBlue.height
        );
    }

    drawCursorCross() {
        const p = this.input.activePointer;
        const x = p.worldX;
        const y = p.worldY;

        this.graphics.lineStyle(2, 0xffff66, 1);
        this.graphics.lineBetween(x - 12, y, x + 12, y);
        this.graphics.lineBetween(x, y - 12, x, y + 12);
        this.graphics.strokeCircle(x, y, 16);
    }

    drawCommandMarker(x, y) {
        this.graphics.lineStyle(2, 0x00ffcc, 1);
        this.graphics.strokeCircle(x, y, 20);
        this.graphics.lineBetween(x - 14, y, x + 14, y);
        this.graphics.lineBetween(x, y - 14, x, y + 14);
    }

    keepUnitsInBounds() {
        for (const unit of this.allUnits) {
            unit.x = Phaser.Math.Clamp(unit.x, 20, 1260);
            unit.y = Phaser.Math.Clamp(unit.y, 100, 680);
        }
    }

    clearRoleTexts() {
        for (const text of this.roleTexts) {
            text.destroy();
        }
        this.roleTexts = [];
    }
}