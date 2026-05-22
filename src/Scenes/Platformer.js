class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {

        this.ACCELERATION = 700;
        this.DRAG = 1200;
        this.MAX_SPEED = 220;
        this.JUMP_VELOCITY = -450;

        this.physics.world.gravity.y = 1500;

        this.SCALE = 2.0;

        this.coyoteTime = 0;
        this.wasInAir = false;
        this.jumpCount = 0;
        this.maxJumps = 2;

        this.isRespawning = false;
    }

    create() {

        // Map
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        this.tileset1 = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.tileset2 = this.map.addTilesetImage("food_tilemap_packed", "food_tiles");
        this.tileset3 = this.map.addTilesetImage("industrial_tilemap_packed", "industrial_tiles");
        this.tileset4 = this.map.addTilesetImage("industrial_tilemap_packed_2", "industrial_tiles2");
        this.tileset5 = this.map.addTilesetImage("city_tilemap_packed", "city_tiles");

        this.groundLayer = this.map.createLayer(
            "Ground-n-Platforms",
            [this.tileset1, this.tileset2, this.tileset3, this.tileset4, this.tileset5],
            0,
            0
        );

        this.looks = this.map.createLayer(
            "Looks",
            [this.tileset1, this.tileset2, this.tileset3, this.tileset4],
            0,
            0
        );

        this.death = this.map.createLayer(
            "Death",
            [this.tileset1, this.tileset2, this.tileset3, this.tileset4],
            0,
            0
        );

        this.groundLayer.setCollisionByProperty({ collides: true });
        this.death.setCollisionByProperty({ collides: true });

        // Audio
        my.sfx = {};
        my.sfx.coin = this.sound.add("coin_sfx", { volume: 0.5 });
        my.sfx.jump = this.sound.add("jump_sfx", { volume: 0.5 });

        // Bounds
        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );

        // -----------------------------
        // PLAYER (NO ANIMATIONS FIX)
        // -----------------------------
        my.sprite.player = this.physics.add.sprite(100, 100, "platformer_characters");

        my.sprite.player.setOrigin(0.5);
        my.sprite.player.body.setSize(16, 12);
        my.sprite.player.body.setOffset(9, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setMaxVelocity(this.MAX_SPEED, 1000);

        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.physics.add.collider(
            my.sprite.player,
            this.death,
            () => {
                if (this.isRespawning) return;
                this.respawnPlayer();
            }
        );

        // Food
        this.foods = this.map.createFromObjects("Objects", {
            name: "food",
            key: "food"
        });

        this.physics.world.enable(this.foods, Phaser.Physics.Arcade.STATIC_BODY);
        this.foodGroup = this.add.group(this.foods);

        this.physics.add.overlap(
            my.sprite.player,
            this.foodGroup,
            (player, food) => {
                food.destroy();
                my.sfx.coin.play();
            }
        );

        // Bed
        this.bed = this.map.createFromObjects("Objects", {
            name: "bed",
            key: "bed"
        });

        this.physics.world.enable(this.bed, Phaser.Physics.Arcade.STATIC_BODY);
        this.bedGroup = this.add.group(this.bed);

        this.physics.add.overlap(
            my.sprite.player,
            this.bedGroup,
            () => {
                this.physics.pause();

                this.add.text(
                    my.sprite.player.x - 80,
                    my.sprite.player.y - 80,
                    "The fox falls asleep...",
                    {
                        fontSize: "20px",
                        color: "#ffffff"
                    }
                );
            }
        );

        // Input
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey("R");

        // Debug toggle
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;

            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
            }
        });

        // Camera
        this.cameras.main.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );

        this.cameras.main.startFollow(my.sprite.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(10, 10);
        this.cameras.main.setZoom(this.SCALE);

        // Particles
        my.vfx.walking = this.add.particles(
            0,
            0,
            "kenny-particles",
            {
                frame: ['smoke_01.png', 'smoke_03.png'],
                random: true,
                scale: { start: 0.08, end: 0.01 },
                lifespan: 250,
                gravityY: -200,
                alpha: { start: 0.7, end: 0 },
                frequency: 60
            }
        );

        my.vfx.walking.stop();

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

        document.getElementById('description').innerHTML =
            '<h2>Movement: Arrow Keys <br> D: Debug <br> R: Restart <br> Goal: Reach bed</h2>';
    }

    update() {

        if (my.sprite.player.body.blocked.down) {
            this.coyoteTime = 10;
            this.jumpCount = 0;
        } else {
            this.coyoteTime--;
        }

        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlipX(false);
            my.vfx.walking.start();
        }

        else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlipX(true);
            my.vfx.walking.start();
        }

        else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.vfx.walking.stop();
        }

        if (cursors.right.isDown) {
            this.cameras.main.setFollowOffset(-140, 0);
        } else if (cursors.left.isDown) {
            this.cameras.main.setFollowOffset(120, 0);
        } else {
            this.cameras.main.setFollowOffset(0, 0);
        }

        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            if (this.coyoteTime > 0 || this.jumpCount < this.maxJumps) {
                my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
                this.jumpCount++;
                my.vfx.jump.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 20);
                my.sfx.jump.play();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    respawnPlayer() {

        this.isRespawning = true;

        my.sprite.player.setVelocity(0, 0);
        my.sprite.player.x = 100;
        my.sprite.player.y = 100;

        this.jumpCount = 0;
        this.coyoteTime = 0;

        this.cameras.main.shake(200, 0.01);

        this.time.delayedCall(300, () => {
            this.isRespawning = false;
        });
    }
}