export class Start extends Phaser.Scene {
    constructor() {
        super('Start');

        this.money = 1;
        this.betZones = [];
        this.hoverZone = null;
        this.placedChips = [];

        this.chipValue = 1;
        this.lastSpinResult = null;
        this.lastWinAmount = 0;

        this.redNumbers = new Set();
        this.blackNumbers = new Set();
        this.wheelNumbers = [];

        this.isSpinning = false;
        this.isChoosingDrink = false;
        this.isGameOver = false;

        this.spinButton = null;

        this.wheelRotationContainer = null;
        this.wheelDecorContainer = null;
        this.ball = null;
        this.ballShadow = null;
        this.wheelPointer = null;

        this.wheelCenterX = 0;
        this.wheelCenterY = 0;
        this.wheelOuterRadius = 0;
        this.wheelInnerRadius = 0;
        this.ballTrackRadius = 0;
        this.ballPocketRadius = 0;

        this.currentWinningNumber = null;
        this.defaultBallAngle = Phaser.Math.DegToRad(-120);

        this.activeBuffs = {
            mojito: 0,
            sexOnTheBeach: 0,
            whiskeySour: 0
        };

        this.drinkOverlay = null;
        this.drinkCards = [];

        this.gameOverOverlay = null;
    }

    preload() {
        // Keine Assets nötig
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#151515');
        this.buildRouletteData();

        const tableWidth = 940;
        const tableHeight = 470;
        const tableX = (width - tableWidth) / 2;
        const tableY = (height - tableHeight) / 2 + 10;

        this.drawRouletteTable(tableX, tableY, tableWidth, tableHeight);
        this.createMoneyCounter(width);
        this.createBetInfo();
        this.createSpinInfo();
        this.createBuffInfo();
        this.createSpinButton();
        this.setChipHomePosition(tableX, tableY, tableWidth, tableHeight);
        this.createDraggableChip();
        this.registerInputHandlers();
        this.registerKeyboardControls();
        this.updateUiTexts();
        this.updateBuffInfoText();
    }

    buildRouletteData() {
        this.redNumbers = new Set([
            1, 3, 5, 7, 9, 12, 14, 16, 18,
            19, 21, 23, 25, 27, 30, 32, 34, 36
        ]);

        this.blackNumbers = new Set([
            2, 4, 6, 8, 10, 11, 13, 15, 17, 20,
            22, 24, 26, 28, 29, 31, 33, 35
        ]);

        this.wheelNumbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
            6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
            24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
            29, 7, 28, 12, 35, 3, 26
        ];
    }

    createMoneyCounter(screenWidth) {
        const boxW = 280;
        const boxH = 62;
        const boxX = screenWidth - boxW - 22;
        const boxY = 18;

        const g = this.add.graphics();

        g.fillStyle(0x0d0d0d, 0.96);
        g.fillRoundedRect(boxX, boxY, boxW, boxH, 12);

        g.lineStyle(3, 0x3c3c3c, 1);
        g.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);

        this.add.text(boxX + 16, boxY + boxH / 2, 'MONEY :', {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#e8e8e8',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.moneyText = this.add.text(boxX + boxW - 16, boxY + boxH / 2, `$$$ ${this.formatMoney(this.money)}`, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#35d07f',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
    }

    createBetInfo() {
        this.betInfoText = this.add.text(34, 690, 'BET : NONE', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#e8e8e8',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
    }

    createSpinInfo() {
        this.resultText = this.add.text(34, 660, 'RESULT : NONE', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.winText = this.add.text(34, 632, 'WIN : 0', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#35d07f',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.controlsText = this.add.text(730, 692, 'SPACE = SPIN   |   C = CLEAR BETS', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#bbbbbb',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
    }

    createBuffInfo() {
        this.buffInfoTitle = this.add.text(34, 24, 'BUFFS :', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.buffInfoText = this.add.text(34, 48, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#d9d9d9',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
    }

    updateBuffInfoText() {
        this.buffInfoText.setText(
            `MOJITO x${this.activeBuffs.mojito}   |   SEX ON THE BEACH x${this.activeBuffs.sexOnTheBeach}   |   WHISKEY SOUR x${this.activeBuffs.whiskeySour}`
        );
    }

    createSpinButton() {
        const x = 1110;
        const y = 652;
        const w = 120;
        const h = 44;

        const bg = this.add.graphics();
        bg.fillStyle(0x181818, 0.96);
        bg.fillRoundedRect(x, y, w, h, 10);
        bg.lineStyle(3, 0xd4af37, 1);
        bg.strokeRoundedRect(x, y, w, h, 10);

        const label = this.add.text(x + w / 2, y + h / 2, 'SPIN', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            if (this.isSpinning || this.isChoosingDrink || this.isGameOver) return;

            bg.clear();
            bg.fillStyle(0x222222, 0.98);
            bg.fillRoundedRect(x, y, w, h, 10);
            bg.lineStyle(3, 0xf1df9b, 1);
            bg.strokeRoundedRect(x, y, w, h, 10);
        });

        hit.on('pointerout', () => {
            this.redrawSpinButton(bg, x, y, w, h);
        });

        hit.on('pointerdown', () => {
            this.startSpin();
        });

        this.spinButton = {
            bg,
            hit,
            label,
            x,
            y,
            w,
            h
        };
    }

    redrawSpinButton(bg, x, y, w, h) {
        bg.clear();

        if (this.isSpinning || this.isChoosingDrink || this.isGameOver) {
            bg.fillStyle(0x101010, 0.96);
            bg.fillRoundedRect(x, y, w, h, 10);
            bg.lineStyle(3, 0x555555, 1);
            bg.strokeRoundedRect(x, y, w, h, 10);
            this.spinButton.label.setColor('#777777');
        } else {
            bg.fillStyle(0x181818, 0.96);
            bg.fillRoundedRect(x, y, w, h, 10);
            bg.lineStyle(3, 0xd4af37, 1);
            bg.strokeRoundedRect(x, y, w, h, 10);
            this.spinButton.label.setColor('#f7f0cf');
        }
    }

    setChipHomePosition(tableX, tableY, tableWidth, tableHeight) {
        this.chipHomeX = tableX + tableWidth * 0.43;
        this.chipHomeY = tableY + tableHeight * 0.80;
    }

    createDraggableChip() {
        this.activeChip = this.createChip(this.chipHomeX, this.chipHomeY, 18, '$1', true);
        this.activeChip.setDepth(400);
        this.input.setDraggable(this.activeChip);
    }

    createChip(x, y, radius, label, interactive = false) {
        const container = this.add.container(x, y);

        const g = this.add.graphics();
        g.fillStyle(0xe8e8e8, 1);
        g.fillCircle(0, 0, radius);

        g.lineStyle(3, 0xc0392b, 1);
        g.strokeCircle(0, 0, radius - 1.5);

        g.lineStyle(1.5, 0xc0392b, 1);
        for (let i = 0; i < 8; i++) {
            const angle = Phaser.Math.DegToRad(i * 45);
            const r1 = radius - 4;
            const r2 = radius - 9;

            const x1 = Math.cos(angle) * r1;
            const y1 = Math.sin(angle) * r1;
            const x2 = Math.cos(angle) * r2;
            const y2 = Math.sin(angle) * r2;

            g.lineBetween(x1, y1, x2, y2);
        }

        g.lineStyle(1.5, 0x777777, 1);
        g.strokeCircle(0, 0, radius - 7);

        const fontSize = radius >= 18 ? '11px' : '9px';

        const text = this.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            color: '#111111',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([g, text]);

        const hitSize = radius * 2.8;
        container.setSize(hitSize, hitSize);

        if (interactive) {
            container.setInteractive(
                new Phaser.Geom.Rectangle(-hitSize / 2, -hitSize / 2, hitSize, hitSize),
                Phaser.Geom.Rectangle.Contains
            );
        }

        return container;
    }

    registerInputHandlers() {
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject !== this.activeChip) return;
            if (this.isSpinning || this.isChoosingDrink || this.isGameOver) return;

            gameObject.setScale(1.08);
            gameObject.setDepth(1000);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject !== this.activeChip) return;
            if (this.isSpinning || this.isChoosingDrink || this.isGameOver) return;

            gameObject.x = dragX;
            gameObject.y = dragY;

            const zone = this.getBetZoneAt(dragX, dragY);
            this.setHoverZone(zone);
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject !== this.activeChip) return;

            if (this.isSpinning || this.isChoosingDrink || this.isGameOver) {
                gameObject.setScale(1);
                gameObject.x = this.chipHomeX;
                gameObject.y = this.chipHomeY;
                gameObject.setDepth(400);
                this.setHoverZone(null);
                return;
            }

            gameObject.setScale(1);

            const zone = this.getBetZoneAt(gameObject.x, gameObject.y);

            if (zone) {
                this.placeChipOnZone(zone);
            } else {
                this.betInfoText.setText('BET : NONE');
            }

            this.setHoverZone(null);

            gameObject.x = this.chipHomeX;
            gameObject.y = this.chipHomeY;
            gameObject.setDepth(400);
        });
    }

    registerKeyboardControls() {
        this.input.keyboard.on('keydown-SPACE', () => {
            this.startSpin();
        });

        this.input.keyboard.on('keydown-C', () => {
            this.clearAllBets();
        });
    }

    startSpin() {
        if (this.isSpinning) return;
        if (this.isChoosingDrink) return;
        if (this.isGameOver) return;
        if (this.placedChips.length === 0) return;

        this.isSpinning = true;
        this.lastWinAmount = 0;
        this.currentWinningNumber = Phaser.Utils.Array.GetRandom(this.wheelNumbers);

        this.redrawSpinButton(
            this.spinButton.bg,
            this.spinButton.x,
            this.spinButton.y,
            this.spinButton.w,
            this.spinButton.h
        );

        const spinState = {
            wheelStartRotation: this.wheelRotationContainer.rotation,
            wheelTurns: Phaser.Math.Between(6, 8),
            wheelEndRotation: 0,
            ballStartAngle: this.defaultBallAngle,
            ballAngle: this.defaultBallAngle,
            ballRadius: this.ballTrackRadius,
            ballTurns: Phaser.Math.Between(10, 13),
            pocketApproachRadius: this.ballPocketRadius + 18
        };

        const finalWheelLocalAngle = this.getWheelLocalAngleForNumber(this.currentWinningNumber);
        spinState.wheelEndRotation =
            spinState.wheelStartRotation +
            Phaser.Math.PI2 * spinState.wheelTurns +
            Phaser.Math.FloatBetween(0.35, 1.25);

        const firstPhaseDuration = 4700;
        const secondPhaseDuration = 900;

        this.tweens.add({
            targets: this.wheelRotationContainer,
            rotation: spinState.wheelEndRotation,
            duration: firstPhaseDuration + secondPhaseDuration,
            ease: 'Cubic.easeOut'
        });

        this.tweens.add({
            targets: spinState,
            ballAngle: spinState.ballStartAngle - Phaser.Math.PI2 * spinState.ballTurns,
            ballRadius: spinState.pocketApproachRadius,
            duration: firstPhaseDuration,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                const wobble = Math.sin(spinState.ballAngle * 5.5) * 1.5;
                this.updateBallPosition(spinState.ballAngle, spinState.ballRadius + wobble);
            },
            onComplete: () => {
                const finalWorldAngle = this.wheelRotationContainer.rotation + finalWheelLocalAngle;

                this.tweens.add({
                    targets: spinState,
                    ballAngle: finalWorldAngle,
                    ballRadius: this.ballPocketRadius,
                    duration: secondPhaseDuration,
                    ease: 'Bounce.easeOut',
                    onUpdate: () => {
                        const jitter = Math.sin(spinState.ballAngle * 17) * 0.6;
                        this.updateBallPosition(spinState.ballAngle, spinState.ballRadius + jitter);
                    },
                    onComplete: () => {
                        this.finishSpin(this.currentWinningNumber);
                    }
                });
            }
        });
    }

    finishSpin(resultNumber) {
        this.resolveSpin(resultNumber);

        this.time.delayedCall(750, () => {
            this.clearResolvedBetsWithoutRefund();
            this.isSpinning = false;

            this.redrawSpinButton(
                this.spinButton.bg,
                this.spinButton.x,
                this.spinButton.y,
                this.spinButton.w,
                this.spinButton.h
            );

            if (this.checkForGameOver()) {
                return;
            }

            this.showDrinkSelection();
        });
    }

    resolveSpin(resultNumber) {
        this.lastSpinResult = resultNumber;

        let totalWin = 0;

        for (const chip of this.placedChips) {
            const zone = chip.betZone;
            const hit = zone.coveredNumbers.includes(resultNumber);

            chip.isWinner = hit;

            if (hit) {
                const totalReturnMultiplier = this.getZoneTotalReturnMultiplier(zone, resultNumber);
                totalWin += chip.betAmount * totalReturnMultiplier;
            }
        }

        this.lastWinAmount = totalWin;
        this.money += totalWin;

        this.flashWinningChips();
        this.updateUiTexts();
    }

    getZoneTotalReturnMultiplier(zone, resultNumber) {
        const baseTotalReturnMultiplier = zone.multiplier + 1;
        let buffFactor = 1;

        if (zone.label === 'RED' && this.activeBuffs.mojito > 0) {
            buffFactor *= Math.pow(2, this.activeBuffs.mojito);
        }

        if (zone.label === 'BLACK' && this.activeBuffs.whiskeySour > 0) {
            buffFactor *= Math.pow(2, this.activeBuffs.whiskeySour);
        }

        const isStraightSingleNumber =
            zone.type === 'straight' &&
            zone.coveredNumbers.length === 1 &&
            zone.coveredNumbers[0] !== 0;

        if (isStraightSingleNumber) {
            const onlyNumber = zone.coveredNumbers[0];
            if (onlyNumber % 2 === 0 && this.activeBuffs.sexOnTheBeach > 0) {
                buffFactor *= Math.pow(2, this.activeBuffs.sexOnTheBeach);
            }
        }

        return baseTotalReturnMultiplier * buffFactor;
    }

    flashWinningChips() {
        for (const chip of this.placedChips) {
            if (chip.flashTween) {
                chip.flashTween.stop();
            }

            chip.setScale(1);

            if (chip.isWinner) {
                chip.flashTween = this.tweens.add({
                    targets: chip,
                    scaleX: 1.18,
                    scaleY: 1.18,
                    duration: 140,
                    yoyo: true,
                    repeat: 4
                });
            }
        }
    }

    updateUiTexts() {
        this.moneyText.setText(`$$$ ${this.formatMoney(this.money)}`);

        const resultLabel = this.lastSpinResult === null ? 'NONE' : String(this.lastSpinResult);
        this.resultText.setText(`RESULT : ${resultLabel}`);

        this.winText.setText(`WIN : ${this.formatMoney(this.lastWinAmount)}`);
    }

    placeChipOnZone(zone) {
        if (this.money < this.chipValue) {
            this.betInfoText.setText('NOT ENOUGH MONEY');
            this.updateUiTexts();
            return;
        }

        this.money -= this.chipValue;
        this.updateUiTexts();

        const stackCount = this.placedChips.filter(chip => chip.betZone === zone).length;
        const stackOffsetY = stackCount * 3;

        const chip = this.createChip(zone.centerX, zone.centerY - stackOffsetY, 11, '$1', true);
        chip.setDepth(200 + stackCount);
        chip.betLabel = zone.label;
        chip.betZone = zone;
        chip.isPlacedChip = true;
        chip.betAmount = this.chipValue;
        chip.isWinner = false;

        chip.on('pointerdown', () => {
            if (this.isSpinning || this.isChoosingDrink || this.isGameOver) return;
            this.removePlacedChip(chip);
        });

        this.placedChips.push(chip);
        this.betInfoText.setText(`BET : ${zone.label} (-$${chip.betAmount})`);
    }

    removePlacedChip(chip) {
        const idx = this.placedChips.indexOf(chip);
        if (idx !== -1) {
            this.placedChips.splice(idx, 1);
        }

        this.money += chip.betAmount;
        this.updateUiTexts();

        this.betInfoText.setText(`REMOVED : ${chip.betLabel} (+$${chip.betAmount})`);
        chip.destroy();
    }

    clearAllBets() {
        if (this.isSpinning || this.isChoosingDrink || this.isGameOver) return;

        let refundedAmount = 0;

        for (const chip of this.placedChips) {
            refundedAmount += chip.betAmount;
            chip.destroy();
        }

        this.placedChips = [];
        this.money += refundedAmount;
        this.updateUiTexts();

        if (refundedAmount > 0) {
            this.betInfoText.setText(`BETS CLEARED (+$${refundedAmount})`);
        } else {
            this.betInfoText.setText('BET : NONE');
        }
    }

    clearResolvedBetsWithoutRefund() {
        for (const chip of this.placedChips) {
            chip.destroy();
        }

        this.placedChips = [];
        this.betInfoText.setText('BET : NONE');
    }

    setHoverZone(zone) {
        this.hoverZone = zone;
        this.redrawBetZoneHighlights();

        if (zone) {
            this.betInfoText.setText(`BET : ${zone.label}`);
        }
    }

    redrawBetZoneHighlights() {
        if (!this.zoneOverlay) return;

        this.zoneOverlay.clear();

        if (!this.hoverZone || this.isSpinning || this.isChoosingDrink || this.isGameOver) return;

        this.zoneOverlay.lineStyle(3, 0xffff99, 0.95);
        this.zoneOverlay.fillStyle(0xffff99, 0.14);
        this.zoneOverlay.fillRect(
            this.hoverZone.x,
            this.hoverZone.y,
            this.hoverZone.w,
            this.hoverZone.h
        );
        this.zoneOverlay.strokeRect(
            this.hoverZone.x,
            this.hoverZone.y,
            this.hoverZone.w,
            this.hoverZone.h
        );
    }

    addBetZone(x, y, w, h, label, multiplier, coveredNumbers, type = 'generic') {
        this.betZones.push({
            x,
            y,
            w,
            h,
            label,
            multiplier,
            coveredNumbers: [...coveredNumbers].sort((a, b) => a - b),
            type,
            centerX: x + w / 2,
            centerY: y + h / 2
        });
    }

    getBetZoneAt(px, py) {
        for (let i = this.betZones.length - 1; i >= 0; i--) {
            const z = this.betZones[i];
            if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
                return z;
            }
        }
        return null;
    }

    formatMoney(value) {
        return String(value);
    }

    getDozenNumbers(index) {
        const start = index * 12 + 1;
        return Array.from({ length: 12 }, (_, i) => start + i);
    }

    getColumnNumbersFromBoardRow(rowIndex) {
        const columns = [];
        for (let n = 1; n <= 36; n++) {
            const mod = n % 3;
            if (rowIndex === 2 && mod === 1) columns.push(n);
            if (rowIndex === 1 && mod === 2) columns.push(n);
            if (rowIndex === 0 && mod === 0) columns.push(n);
        }
        return columns;
    }

    getWheelLocalAngleForNumber(number) {
        const index = this.wheelNumbers.indexOf(number);
        const segmentAngle = Phaser.Math.PI2 / this.wheelNumbers.length;
        return -Math.PI / 2 + index * segmentAngle + segmentAngle / 2;
    }

    updateBallPosition(worldAngle, radius) {
        const x = this.wheelCenterX + Math.cos(worldAngle) * radius;
        const y = this.wheelCenterY + Math.sin(worldAngle) * radius;

        this.ball.setPosition(x, y);
        this.ballShadow.setPosition(x + 3, y + 3);
    }

    showDrinkSelection() {
        this.hideDrinkSelection();

        this.isChoosingDrink = true;

        this.redrawSpinButton(
            this.spinButton.bg,
            this.spinButton.x,
            this.spinButton.y,
            this.spinButton.w,
            this.spinButton.h
        );

        const { width, height } = this.scale;
        const overlay = this.add.container(0, 0);
        overlay.setDepth(5000);

        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62)
            .setInteractive();

        const panelW = 860;
        const panelH = 270;
        const panelX = width / 2 - panelW / 2;
        const panelY = height / 2 - panelH / 2;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x121212, 0.98);
        panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 18);
        panelBg.lineStyle(4, 0xd4af37, 1);
        panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 18);

        const title = this.add.text(width / 2, panelY + 34, 'CHOOSE A DRINK', {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, panelY + 68, 'BUFF IS PERMANENT FOR THIS RUN', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#c8c8c8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        overlay.add([blocker, panelBg, title, subtitle]);

        const cardY = panelY + 135;
        const gap = 24;
        const cardW = 240;
        const cardH = 96;
        const startX = width / 2 - (cardW * 3 + gap * 2) / 2;

        const drinks = [
            {
                key: 'mojito',
                title: 'MOJITO',
                desc: 'RED total return x2'
            },
            {
                key: 'sexOnTheBeach',
                title: 'SEX ON THE BEACH',
                desc: 'EVEN single numbers total return x2'
            },
            {
                key: 'whiskeySour',
                title: 'WHISKEY SOUR',
                desc: 'BLACK total return x2'
            }
        ];

        this.drinkCards = [];

        drinks.forEach((drink, index) => {
            const cardX = startX + index * (cardW + gap);
            const card = this.createDrinkCard(cardX, cardY, cardW, cardH, drink);
            overlay.add(card.objects);
            this.drinkCards.push(card);
        });

        this.drinkOverlay = overlay;
    }

    createDrinkCard(x, y, w, h, drink) {
        const bg = this.add.graphics();
        bg.fillStyle(0x1b1b1b, 1);
        bg.fillRoundedRect(x, y, w, h, 14);
        bg.lineStyle(3, 0x5b5b5b, 1);
        bg.strokeRoundedRect(x, y, w, h, 14);

        const title = this.add.text(x + w / 2, y + 24, drink.title, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#f7f0cf',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        const desc = this.add.text(x + w / 2, y + 51, drink.desc, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#d9d9d9',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: w - 18 }
        }).setOrigin(0.5);

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x2a2a2a, 1);
        buttonBg.fillRoundedRect(x + 56, y + 66, w - 112, 22, 8);
        buttonBg.lineStyle(2, 0xd4af37, 1);
        buttonBg.strokeRoundedRect(x + 56, y + 66, w - 112, 22, 8);

        const buttonLabel = this.add.text(x + w / 2, y + 77, 'SELECT', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x252525, 1);
            bg.fillRoundedRect(x, y, w, h, 14);
            bg.lineStyle(3, 0xf1df9b, 1);
            bg.strokeRoundedRect(x, y, w, h, 14);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x1b1b1b, 1);
            bg.fillRoundedRect(x, y, w, h, 14);
            bg.lineStyle(3, 0x5b5b5b, 1);
            bg.strokeRoundedRect(x, y, w, h, 14);
        });

        hit.on('pointerdown', () => {
            this.applyDrinkBuff(drink.key);
        });

        return {
            objects: [bg, title, desc, buttonBg, buttonLabel, hit]
        };
    }

    applyDrinkBuff(buffKey) {
        if (!this.isChoosingDrink) return;

        if (buffKey === 'mojito') {
            this.activeBuffs.mojito += 1;
            this.betInfoText.setText('BUFF ADDED : MOJITO');
        } else if (buffKey === 'sexOnTheBeach') {
            this.activeBuffs.sexOnTheBeach += 1;
            this.betInfoText.setText('BUFF ADDED : SEX ON THE BEACH');
        } else if (buffKey === 'whiskeySour') {
            this.activeBuffs.whiskeySour += 1;
            this.betInfoText.setText('BUFF ADDED : WHISKEY SOUR');
        }

        this.updateBuffInfoText();
        this.hideDrinkSelection();

        this.isChoosingDrink = false;

        this.redrawSpinButton(
            this.spinButton.bg,
            this.spinButton.x,
            this.spinButton.y,
            this.spinButton.w,
            this.spinButton.h
        );
    }

    hideDrinkSelection() {
        if (this.drinkOverlay) {
            this.drinkOverlay.destroy(true);
            this.drinkOverlay = null;
        }

        this.drinkCards = [];
    }

    checkForGameOver() {
        if (this.money <= 0 && this.placedChips.length === 0) {
            this.showGameOverOverlay();
            return true;
        }

        return false;
    }

    showGameOverOverlay() {
        this.hideDrinkSelection();
        this.hideGameOverOverlay();

        this.isGameOver = true;
        this.isChoosingDrink = false;
        this.isSpinning = false;

        this.redrawSpinButton(
            this.spinButton.bg,
            this.spinButton.x,
            this.spinButton.y,
            this.spinButton.w,
            this.spinButton.h
        );

        const { width, height } = this.scale;
        const overlay = this.add.container(0, 0);
        overlay.setDepth(9000);

        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
            .setInteractive();

        const panelW = 470;
        const panelH = 240;
        const panelX = width / 2 - panelW / 2;
        const panelY = height / 2 - panelH / 2;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x111111, 0.98);
        panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 18);
        panelBg.lineStyle(4, 0xd4af37, 1);
        panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 18);

        const title = this.add.text(width / 2, panelY + 54, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '42px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, panelY + 98, 'YOU ARE OUT OF MONEY', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#c8c8c8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const buttonX = width / 2 - 90;
        const buttonY = panelY + 145;
        const buttonW = 180;
        const buttonH = 48;

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a1a1a, 1);
        buttonBg.fillRoundedRect(buttonX, buttonY, buttonW, buttonH, 12);
        buttonBg.lineStyle(3, 0xd4af37, 1);
        buttonBg.strokeRoundedRect(buttonX, buttonY, buttonW, buttonH, 12);

        const buttonLabel = this.add.text(width / 2, buttonY + buttonH / 2, 'RESTART', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#f7f0cf',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hit = this.add.rectangle(width / 2, buttonY + buttonH / 2, buttonW, buttonH, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x262626, 1);
            buttonBg.fillRoundedRect(buttonX, buttonY, buttonW, buttonH, 12);
            buttonBg.lineStyle(3, 0xf1df9b, 1);
            buttonBg.strokeRoundedRect(buttonX, buttonY, buttonW, buttonH, 12);
        });

        hit.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x1a1a1a, 1);
            buttonBg.fillRoundedRect(buttonX, buttonY, buttonW, buttonH, 12);
            buttonBg.lineStyle(3, 0xd4af37, 1);
            buttonBg.strokeRoundedRect(buttonX, buttonY, buttonW, buttonH, 12);
        });

        hit.on('pointerdown', () => {
            this.restartRun();
        });

        overlay.add([blocker, panelBg, title, subtitle, buttonBg, buttonLabel, hit]);
        this.gameOverOverlay = overlay;
    }

    hideGameOverOverlay() {
        if (this.gameOverOverlay) {
            this.gameOverOverlay.destroy(true);
            this.gameOverOverlay = null;
        }
    }

    restartRun() {
        this.hideDrinkSelection();
        this.hideGameOverOverlay();

        for (const chip of this.placedChips) {
            chip.destroy();
        }
        this.placedChips = [];

        this.money = 1;
        this.lastSpinResult = null;
        this.lastWinAmount = 0;
        this.currentWinningNumber = null;

        this.activeBuffs.mojito = 0;
        this.activeBuffs.sexOnTheBeach = 0;
        this.activeBuffs.whiskeySour = 0;

        this.isSpinning = false;
        this.isChoosingDrink = false;
        this.isGameOver = false;

        this.wheelRotationContainer.rotation = 0;
        this.updateBallPosition(this.defaultBallAngle, this.ballTrackRadius);

        this.betInfoText.setText('BET : NONE');
        this.updateBuffInfoText();
        this.updateUiTexts();

        this.redrawSpinButton(
            this.spinButton.bg,
            this.spinButton.x,
            this.spinButton.y,
            this.spinButton.w,
            this.spinButton.h
        );
    }

    drawZoneMultiplierText() {
        // absichtlich leer
    }

    drawRouletteTable(x, y, width, height) {
        const g = this.add.graphics();
        this.zoneOverlay = this.add.graphics();

        const feltColor = 0x145a32;
        const lineColor = 0xf1df9b;
        const redColor = 0xc0392b;
        const blackColor = 0x111111;
        const greenColor = 0x1e8449;
        const textColor = '#f7f0cf';

        const woodDark = 0x40200f;
        const woodMid = 0x6c3e1d;
        const woodLight = 0x8d5a31;
        const gold = 0xd4af37;
        const shadow = 0x080808;

        const innerX = x + 34;
        const innerY = y + 34;
        const innerW = width - 68;
        const innerH = height - 68;

        g.fillStyle(shadow, 0.45);
        g.fillRoundedRect(x - 6, y + 10, width + 12, height + 12, 34);

        g.fillStyle(woodDark, 1);
        g.fillRoundedRect(x, y, width, height, 36);

        g.fillStyle(woodMid, 1);
        g.fillRoundedRect(x + 34, y + 2, width - 68, 44, 18);
        g.fillRoundedRect(x + 34, y + height - 46, width - 68, 44, 18);
        g.fillRoundedRect(x + 2, y + 34, 44, height - 68, 18);
        g.fillRoundedRect(x + width - 46, y + 34, 44, height - 68, 18);

        g.fillStyle(woodMid, 1);
        g.fillCircle(x + 42, y + 42, 32);
        g.fillCircle(x + width - 42, y + 42, 32);
        g.fillCircle(x + 42, y + height - 42, 32);
        g.fillCircle(x + width - 42, y + height - 42, 32);

        g.lineStyle(6, woodLight, 0.55);
        g.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 30);

        g.lineStyle(3, 0xb98557, 0.35);
        g.strokeRoundedRect(x + 16, y + 16, width - 32, height - 32, 26);

        g.lineStyle(3, gold, 0.9);
        g.strokeRoundedRect(innerX - 8, innerY - 8, innerW + 16, innerH + 16, 18);

        g.fillStyle(feltColor, 1);
        g.fillRoundedRect(innerX, innerY, innerW, innerH, 18);

        g.lineStyle(2, 0x8e1f24, 1);
        g.strokeRoundedRect(innerX + 10, innerY + 10, innerW - 20, innerH - 20, 14);

        const padding = 18;
        const boardX = innerX + padding;
        const boardY = innerY + padding;

        const boardW = 560;
        const zeroColW = 52;
        const numberCols = 12;
        const rowH = 54;
        const sideW = 48;
        const numColW = (boardW - zeroColW - sideW) / numberCols;

        const numbersAreaW = numColW * numberCols;
        const sideX = boardX + zeroColW + numbersAreaW;

        const betX = boardX + zeroColW;
        const betY = boardY + rowH * 3;

        const dozensH = 42;
        const lowerH = 42;
        const betW = numbersAreaW;
        const dozenW = betW / 3;
        const lowerW = betW / 6;

        const numbers = [
            [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
            [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
            [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
        ];

        const getNumberAt = (row, col) => numbers[row][col];
        const sortNums = (arr) => arr.slice().sort((a, b) => a - b);
        const lineThickness = 14;
        const crossSize = 18;
        const streetDepth = 16;

        g.fillStyle(greenColor, 1);
        g.fillRect(boardX, boardY, zeroColW, rowH * 3);
        g.lineStyle(2, lineColor, 1);
        g.strokeRect(boardX, boardY, zeroColW, rowH * 3);

        this.add.text(boardX + zeroColW / 2, boardY + (rowH * 3) / 2, '0', {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: textColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.addBetZone(
            boardX,
            boardY,
            zeroColW,
            rowH * 3,
            '0',
            35,
            [0],
            'straight'
        );

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const n = numbers[row][col];
                const cellX = boardX + zeroColW + col * numColW;
                const cellY = boardY + row * rowH;
                const fill = this.redNumbers.has(n) ? redColor : blackColor;

                g.fillStyle(fill, 1);
                g.fillRect(cellX, cellY, numColW, rowH);
                g.lineStyle(2, lineColor, 1);
                g.strokeRect(cellX, cellY, numColW, rowH);

                this.add.text(cellX + numColW / 2, cellY + rowH / 2, String(n), {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: textColor,
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                this.addBetZone(
                    cellX,
                    cellY,
                    numColW,
                    rowH,
                    String(n),
                    35,
                    [n],
                    'straight'
                );
            }
        }

        for (let row = 0; row < 3; row++) {
            const cellY = boardY + row * rowH;
            const label = `2:1 ROW ${3 - row}`;
            const covered = this.getColumnNumbersFromBoardRow(row);

            g.fillStyle(feltColor, 1);
            g.fillRect(sideX, cellY, sideW, rowH);
            g.lineStyle(2, lineColor, 1);
            g.strokeRect(sideX, cellY, sideW, rowH);

            this.add.text(sideX + sideW / 2, cellY + rowH / 2, '2:1', {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: textColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.addBetZone(
                sideX,
                cellY,
                sideW,
                rowH,
                label,
                2,
                covered,
                'column'
            );
        }

        const dozens = ['1st 12', '2nd 12', '3rd 12'];
        for (let i = 0; i < 3; i++) {
            const cellX = betX + i * dozenW;
            const covered = this.getDozenNumbers(i);

            g.fillStyle(feltColor, 1);
            g.fillRect(cellX, betY, dozenW, dozensH);
            g.lineStyle(2, lineColor, 1);
            g.strokeRect(cellX, betY, dozenW, dozensH);

            this.add.text(cellX + dozenW / 2, betY + dozensH / 2, dozens[i], {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: textColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.addBetZone(
                cellX,
                betY,
                dozenW,
                dozensH,
                dozens[i],
                2,
                covered,
                'dozen'
            );
        }

        const lowerLabels = ['1-18', 'EVEN', 'RED', 'BLACK', 'ODD', '19-36'];
        const lowerY = betY + dozensH;

        for (let i = 0; i < 6; i++) {
            const cellX = betX + i * lowerW;

            let fillColor = feltColor;
            if (lowerLabels[i] === 'RED') fillColor = redColor;
            if (lowerLabels[i] === 'BLACK') fillColor = blackColor;

            let covered = [];
            switch (lowerLabels[i]) {
                case '1-18':
                    covered = Array.from({ length: 18 }, (_, idx) => idx + 1);
                    break;
                case 'EVEN':
                    covered = Array.from({ length: 18 }, (_, idx) => (idx + 1) * 2);
                    break;
                case 'RED':
                    covered = [...this.redNumbers];
                    break;
                case 'BLACK':
                    covered = [...this.blackNumbers];
                    break;
                case 'ODD':
                    covered = Array.from({ length: 18 }, (_, idx) => idx * 2 + 1);
                    break;
                case '19-36':
                    covered = Array.from({ length: 18 }, (_, idx) => idx + 19);
                    break;
            }

            g.fillStyle(fillColor, 1);
            g.fillRect(cellX, lowerY, lowerW, lowerH);
            g.lineStyle(2, lineColor, 1);
            g.strokeRect(cellX, lowerY, lowerW, lowerH);

            this.add.text(cellX + lowerW / 2, lowerY + lowerH / 2, lowerLabels[i], {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: textColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.addBetZone(
                cellX,
                lowerY,
                lowerW,
                lowerH,
                lowerLabels[i],
                1,
                covered,
                'even-money'
            );
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 11; col++) {
                const xLine = boardX + zeroColW + (col + 1) * numColW;
                const yLine = boardY + row * rowH;
                const n1 = getNumberAt(row, col);
                const n2 = getNumberAt(row, col + 1);
                const pair = sortNums([n1, n2]);

                this.addBetZone(
                    xLine - lineThickness / 2,
                    yLine + 3,
                    lineThickness,
                    rowH - 6,
                    `SPLIT ${pair[0]}/${pair[1]}`,
                    17,
                    pair,
                    'split'
                );
            }
        }

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 12; col++) {
                const xLine = boardX + zeroColW + col * numColW;
                const yLine = boardY + (row + 1) * rowH;
                const n1 = getNumberAt(row, col);
                const n2 = getNumberAt(row + 1, col);
                const pair = sortNums([n1, n2]);

                this.addBetZone(
                    xLine + 3,
                    yLine - lineThickness / 2,
                    numColW - 6,
                    lineThickness,
                    `SPLIT ${pair[0]}/${pair[1]}`,
                    17,
                    pair,
                    'split'
                );
            }
        }

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 11; col++) {
                const xCross = boardX + zeroColW + (col + 1) * numColW;
                const yCross = boardY + (row + 1) * rowH;

                const nums = sortNums([
                    getNumberAt(row, col),
                    getNumberAt(row, col + 1),
                    getNumberAt(row + 1, col),
                    getNumberAt(row + 1, col + 1)
                ]);

                this.addBetZone(
                    xCross - crossSize / 2,
                    yCross - crossSize / 2,
                    crossSize,
                    crossSize,
                    `CORNER ${nums.join('/')}`,
                    8,
                    nums,
                    'corner'
                );
            }
        }

        for (let col = 0; col < 12; col++) {
            const xStreet = boardX + zeroColW + col * numColW;
            const yStreet = boardY + rowH * 3;

            const nums = sortNums([
                getNumberAt(0, col),
                getNumberAt(1, col),
                getNumberAt(2, col)
            ]);

            this.addBetZone(
                xStreet + 3,
                yStreet - streetDepth / 2,
                numColW - 6,
                streetDepth,
                `STREET ${nums.join('/')}`,
                11,
                nums,
                'street'
            );
        }

        for (let col = 0; col < 11; col++) {
            const xSix = boardX + zeroColW + (col + 1) * numColW;
            const ySix = boardY + rowH * 3;

            const nums = sortNums([
                getNumberAt(0, col),
                getNumberAt(1, col),
                getNumberAt(2, col),
                getNumberAt(0, col + 1),
                getNumberAt(1, col + 1),
                getNumberAt(2, col + 1)
            ]);

            this.addBetZone(
                xSix - crossSize / 2,
                ySix - crossSize / 2,
                crossSize,
                crossSize,
                `SIX LINE ${nums.join('/')}`,
                5,
                nums,
                'six-line'
            );
        }

        this.createWheelSystem(innerX + 620, innerY + 12, innerW - 640, innerH - 24, {
            woodLight,
            woodMid,
            woodDark,
            gold,
            greenColor,
            redColor,
            blackColor,
            lineColor,
            textColor
        });
    }

    createWheelSystem(panelX, panelY, panelW, panelH, colors) {
        this.wheelCenterX = panelX + panelW / 2;
        this.wheelCenterY = panelY + panelH / 2;
        this.wheelOuterRadius = Math.min(panelW, panelH) * 0.46;
        this.wheelInnerRadius = this.wheelOuterRadius * 0.68;
        this.ballTrackRadius = this.wheelOuterRadius + 16;
        this.ballPocketRadius = this.wheelOuterRadius * 0.83;

        this.wheelRotationContainer = this.add.container(this.wheelCenterX, this.wheelCenterY);
        this.wheelDecorContainer = this.add.container(this.wheelCenterX, this.wheelCenterY);

        const staticBackdrop = this.add.graphics();
        staticBackdrop.fillStyle(0x0a0a0a, 1);
        staticBackdrop.fillCircle(0, 0, this.wheelOuterRadius + 10);
        staticBackdrop.lineStyle(4, colors.gold, 1);
        staticBackdrop.strokeCircle(0, 0, this.wheelOuterRadius + 10);
        this.wheelDecorContainer.add(staticBackdrop);
        this.wheelDecorContainer.setDepth(20);

        this.drawRotatingWheel(colors);
        this.createWheelPointer(colors.gold);
        this.createBall();
    }

    drawRotatingWheel(colors) {
        const base = this.add.graphics();
        const segmentAngle = Phaser.Math.PI2 / this.wheelNumbers.length;
        const labelR = this.wheelOuterRadius * 0.83;
        const hubOuterR = this.wheelOuterRadius * 0.34;
        const hubInnerR = this.wheelOuterRadius * 0.11;

        for (let i = 0; i < this.wheelNumbers.length; i++) {
            const num = this.wheelNumbers[i];

            let fillColor = colors.greenColor;
            if (num !== 0) {
                fillColor = this.redNumbers.has(num) ? colors.redColor : colors.blackColor;
            }

            const start = -Math.PI / 2 + i * segmentAngle;
            const end = start + segmentAngle;

            base.fillStyle(fillColor, 1);
            base.beginPath();
            base.moveTo(0, 0);
            base.arc(0, 0, this.wheelOuterRadius, start, end, false);
            base.closePath();
            base.fillPath();
        }

        base.fillStyle(colors.woodLight, 1);
        base.fillCircle(0, 0, this.wheelInnerRadius);

        for (let i = 0; i < this.wheelNumbers.length; i++) {
            const angle = -Math.PI / 2 + i * segmentAngle;
            const x1 = Math.cos(angle) * this.wheelInnerRadius;
            const y1 = Math.sin(angle) * this.wheelInnerRadius;
            const x2 = Math.cos(angle) * this.wheelOuterRadius;
            const y2 = Math.sin(angle) * this.wheelOuterRadius;

            base.lineStyle(1, colors.lineColor, 0.95);
            base.lineBetween(x1, y1, x2, y2);
        }

        base.lineStyle(4, colors.gold, 1);
        base.strokeCircle(0, 0, this.wheelOuterRadius);
        base.strokeCircle(0, 0, this.wheelInnerRadius);

        base.fillStyle(colors.woodMid, 1);
        base.fillCircle(0, 0, this.wheelInnerRadius - 8);

        base.lineStyle(3, colors.gold, 1);
        base.strokeCircle(0, 0, this.wheelInnerRadius - 16);

        for (let i = 0; i < 8; i++) {
            const angle = Phaser.Math.DegToRad(i * 45);
            const x1 = Math.cos(angle) * 18;
            const y1 = Math.sin(angle) * 18;
            const x2 = Math.cos(angle) * (hubOuterR - 6);
            const y2 = Math.sin(angle) * (hubOuterR - 6);

            base.lineStyle(4, colors.gold, 1);
            base.lineBetween(x1, y1, x2, y2);
        }

        base.fillStyle(colors.woodDark, 1);
        base.fillCircle(0, 0, hubOuterR);

        base.lineStyle(3, colors.gold, 1);
        base.strokeCircle(0, 0, hubOuterR);

        base.fillStyle(colors.gold, 1);
        base.fillCircle(0, 0, hubInnerR);

        this.wheelRotationContainer.add(base);

        for (let i = 0; i < this.wheelNumbers.length; i++) {
            const num = this.wheelNumbers[i];
            const midAngle = -Math.PI / 2 + i * segmentAngle + segmentAngle / 2;

            const tx = Math.cos(midAngle) * labelR;
            const ty = Math.sin(midAngle) * labelR;

            const label = this.add.text(tx, ty, String(num), {
                fontFamily: 'Arial',
                fontSize: num === 0 ? '18px' : '15px',
                color: colors.textColor,
                fontStyle: 'bold'
            })
                .setOrigin(0.5)
                .setRotation(midAngle + Math.PI / 2);

            this.wheelRotationContainer.add(label);
        }

        this.wheelRotationContainer.setDepth(30);
    }

    createWheelPointer(goldColor) {
        const g = this.add.graphics();
        g.fillStyle(goldColor, 1);
        g.beginPath();
        g.moveTo(this.wheelCenterX, this.wheelCenterY - this.wheelOuterRadius - 7);
        g.lineTo(this.wheelCenterX - 10, this.wheelCenterY - this.wheelOuterRadius - 28);
        g.lineTo(this.wheelCenterX + 10, this.wheelCenterY - this.wheelOuterRadius - 28);
        g.closePath();
        g.fillPath();
        g.setDepth(60);

        this.wheelPointer = g;
    }

    createBall() {
        this.ballShadow = this.add.circle(
            this.wheelCenterX + 3,
            this.wheelCenterY + 3,
            7,
            0x000000,
            0.35
        );
        this.ballShadow.setDepth(70);

        this.ball = this.add.circle(
            this.wheelCenterX,
            this.wheelCenterY,
            7,
            0xf3f3f3,
            1
        );
        this.ball.setStrokeStyle(2, 0xbcbcbc, 1);
        this.ball.setDepth(80);

        this.updateBallPosition(this.defaultBallAngle, this.ballTrackRadius);
    }
}