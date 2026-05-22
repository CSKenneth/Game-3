class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {

        // movement
        this.ACCELERATION = 700;
        this.DRAG = 1200;
        this.MAX_SPEED = 220;
        this.JUMP_VELOCITY = -450;

        // gravity
        this.physics.world.gravity.y = 1500;

        // particles
        this.PARTICLE_VELOCITY = 30;

        // camera
        this.SCALE = 2.0;

        // coyote time
        this.coyoteTime = 0;

        // landing check
        this.wasInAir = false;

        //double jump
        this.jumpCount = 0;
        this.maxJumps = 2;
    }

    create() {

        // -----------------------------
        // MAP
        // -----------------------------

        this.map = this.add.tilemap(
            "platformer-level-1",
            18,
            18,
            45,
            25
        );

        this.tileset = this.map.addTilesetImage(
            "kenny_tilemap_packed",
            "tilemap_tiles"
        );

        this.groundLayer = this.map.createLayer(
            "Ground-n-Platforms",
            this.tileset,
            0,
            0
        );

        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // -----------------------------
        // WORLD BOUNDS
        // -----------------------------

        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );

        // -----------------------------
        // PLAYER
        // -----------------------------

        my.sprite.player = this.physics.add.sprite(
            30,
            345,
            "platformer_characters",
            "tile_0000.png"
        );

        my.sprite.player.setCollideWorldBounds(true);

        my.sprite.player.setMaxVelocity(
            this.MAX_SPEED,
            1000
        );

        // collision
        this.physics.add.collider(
            my.sprite.player,
            this.groundLayer
        );

        // -----------------------------
        // FOOD OBJECTS
        // -----------------------------

        this.foods = this.map.createFromObjects("Objects", {
            name: "food",
            key: "tilemap_sheet",
            frame: 151
        });

        this.physics.world.enable(
            this.foods,
            Phaser.Physics.Arcade.STATIC_BODY
        );

        this.foodGroup = this.add.group(this.foods);

        // -----------------------------
        // BED OBJECT
        // -----------------------------

        this.bed = this.map.createFromObjects("Objects", {
            name: "bed",
            key: "tilemap_sheet",
            frame: 28
        });

        this.physics.world.enable(
            this.bed,
            Phaser.Physics.Arcade.STATIC_BODY
        );

        this.bedGroup = this.add.group(this.bed);

        // -----------------------------
        // UI
        // -----------------------------

        this.foodCount = 0;

        this.foodText = this.add.text(
            10,
            10,
            "Food: 0",
            {
                fontSize: '16px',
                color: '#ffffff'
            }
        );

        this.foodText.setScrollFactor(0);

        // -----------------------------
        // FOOD COLLISION
        // -----------------------------

        this.physics.add.overlap(
            my.sprite.player,
            this.foodGroup,
            (obj1, obj2) => {

                obj2.destroy();

                this.foodCount++;

                this.foodText.setText(
                    "Food: " + this.foodCount
                );

                // optional sound
                // this.sound.play("eatSound");

                // flash effect
                this.cameras.main.flash(
                    80,
                    255,
                    255,
                    255,
                    false
                );
            }
        );

        // -----------------------------
        // BED COLLISION
        // -----------------------------

        this.physics.add.overlap(
            my.sprite.player,
            this.bedGroup,
            () => {

                // stop movement
                my.sprite.player.setVelocity(0, 0);

                // fade screen
                this.cameras.main.fadeOut(
                    2000,
                    0,
                    0,
                    0
                );

                // show ending text
                this.add.text(
                    my.sprite.player.x - 80,
                    my.sprite.player.y - 80,
                    "The fox falls asleep...",
                    {
                        fontSize: '20px',
                        color: '#ffffff'
                    }
                );

                // disable player control
                this.physics.pause();
            }
        );

        // -----------------------------
        // INPUT
        // -----------------------------

        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug
        this.input.keyboard.on('keydown-D', () => {

            this.physics.world.drawDebug =
                !this.physics.world.drawDebug;

            this.physics.world.debugGraphic.clear();

        }, this);

        // -----------------------------
        // WALK PARTICLES
        // -----------------------------

        my.vfx.walking = this.add.particles(
            0,
            0,
            "kenny-particles",
            {
                frame: ['smoke_01.png', 'smoke_03.png'],
                random: true,
                scale: { start: 0.08, end: 0.01 },
                maxAliveParticles: 6,
                lifespan: 250,
                gravityY: -200,
                alpha: { start: 0.7, end: 0 },
                frequency: 60
            }
        );

        my.vfx.walking.stop();

        // -----------------------------
        // JUMP PARTICLES
        // -----------------------------

        my.vfx.jump = this.add.particles(
            0,
            0,
            "kenny-particles",
            {
                frame: ['star_06.png'],
                scale: { start: 0.12, end: 0 },
                speed: { min: -100, max: 100 },
                lifespan: 400,
                gravityY: 300,
                quantity: 15,
                emitting: false
            }
        );

        // -----------------------------
        // CAMERA
        // -----------------------------

        this.cameras.main.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );

        this.cameras.main.startFollow(
            my.sprite.player,
            true,
            0.08,
            0.08
        );

        this.cameras.main.setDeadzone(
            100,
            50
        );

        this.cameras.main.setZoom(this.SCALE);

        this.cameras.main.fadeIn(
            1000,
            0,
            0,
            0
        );
    }

    update() {

        // -----------------------------
        // COYOTE TIME
        // -----------------------------

        if(my.sprite.player.body.blocked.down) {
            this.coyoteTime = 10;
            this.jumpCount = 0;
        }
            else {
                this.coyoteTime--;
            }

        // -----------------------------
        // LEFT MOVEMENT
        // -----------------------------

        if(cursors.left.isDown) {

            my.sprite.player.setAccelerationX(
                -this.ACCELERATION
            );

            my.sprite.player.resetFlip();

            // optional animation
            // my.sprite.player.anims.play('walk', true);

            my.vfx.walking.startFollow(
                my.sprite.player,
                my.sprite.player.displayWidth / 2 - 12,
                my.sprite.player.displayHeight / 2 - 5,
                false
            );

            my.vfx.walking.setParticleSpeed(
                30,
                0
            );

            if(my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        }

        // -----------------------------
        // RIGHT MOVEMENT
        // -----------------------------

        else if(cursors.right.isDown) {

            my.sprite.player.setAccelerationX(
                this.ACCELERATION
            );

            my.sprite.player.setFlip(true, false);

            // optional animation
            // my.sprite.player.anims.play('walk', true);

            my.vfx.walking.startFollow(
                my.sprite.player,
                -my.sprite.player.displayWidth / 2 + 12,
                my.sprite.player.displayHeight / 2 - 5,
                false
            );

            my.vfx.walking.setParticleSpeed(
                -30,
                0
            );

            if(my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        }

        // -----------------------------
        // IDLE
        // -----------------------------

        else {

            my.sprite.player.setAccelerationX(0);

            my.sprite.player.setDragX(
                this.DRAG
            );

            my.vfx.walking.stop();
        }

        // -----------------------------
        // AIR CHECK
        // -----------------------------

        if(!my.sprite.player.body.blocked.down) {
            this.wasInAir = true;
        }

        // -----------------------------
        // LANDING EFFECT
        // -----------------------------

        if(
            my.sprite.player.body.blocked.down &&
            this.wasInAir
        ) {

            this.wasInAir = false;

            my.vfx.jump.emitParticleAt(
                my.sprite.player.x,
                my.sprite.player.y + 20
            );

            // optional sound
            // this.sound.play("landSound");

            // squash/stretch
            my.sprite.player.setScale(
                1.1,
                0.9
            );

            this.tweens.add({
                targets: my.sprite.player,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        }

        // -----------------------------
        // JUMP
        // -----------------------------

        if(Phaser.Input.Keyboard.JustDown(cursors.up)) {

    // normal jump OR double jump
    if(this.coyoteTime > 0 || this.jumpCount < this.maxJumps){
        my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
        this.jumpCount++;
        

        // jump particles
        my.vfx.jump.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 20);

        // optional sound
        // this.sound.play("jumpSound");

        // little squash effect
        my.sprite.player.setScale(0.9, 1.1);

        this.tweens.add({
            targets: my.sprite.player,
            scaleX: 1,
            scaleY: 1,
            duration: 120
        });
    }
}

        // -----------------------------
        // RESTART
        // -----------------------------

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}