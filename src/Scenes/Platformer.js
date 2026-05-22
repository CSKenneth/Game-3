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

        // camera
        this.SCALE = 2.0;

        // jump system
        this.coyoteTime = 0;
        this.wasInAir = false;
        this.jumpCount = 0;
        this.maxJumps = 2;

        // respawn safety
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


        // Player
        my.sprite.player = this.physics.add.sprite(100, 100, "platformer_characters");

        my.sprite.player.setOrigin(0.5);
        my.sprite.player.body.setSize(16, 12);
        my.sprite.player.body.setOffset(9, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setMaxVelocity(this.MAX_SPEED, 1000);

        this.physics.add.collider(my.sprite.player, this.groundLayer);


        // Death
        this.physics.add.collider(
            my.sprite.player,
            this.death,
            () => {
                if (this.isRespawning) return;
                this.respawnPlayer();
            }
        );

  
        // Food Collectibles
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


        // Bed Win Condition

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

        // 🐛 DEBUG TOGGLE (D KEY)
        this.input.keyboard.on('keydown-D', () => {

            this.physics.world.drawDebug = !this.physics.world.drawDebug;

            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
            }

        }, this);

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

        // Walking Particles
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

        // Jump Particles
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
        document.getElementById('description').innerHTML = '<h2>Movement: A/D <br> Movement: Left/Right/Up/Down Arrow Keys <br> Hitboxes: D <br> Restart: R <br> Goal: Make it to the box at the end to allow the fox to sleep<br> Made by Kenneth Tran <br> Email: ktran111@ucsc.edu</h2>' 
    }

    update() {

        //Coyote Time
        if (my.sprite.player.body.blocked.down) {
            this.coyoteTime = 10;
            this.jumpCount = 0;
        } else {
            this.coyoteTime--;
        }

        // Left
        if (cursors.left.isDown) {

            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlipX(false);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        }

        // Right
        else if (cursors.right.isDown) {

            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlipX(true);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        }

        // Idle
        else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.vfx.walking.stop();
        }

        // CAMERA LOOK-AHEAD
        if (cursors.right.isDown) {
            this.cameras.main.setFollowOffset(-140, 0);
        }
        else if (cursors.left.isDown) {
            this.cameras.main.setFollowOffset(120, 0);
        }
        else {
            this.cameras.main.setFollowOffset(0, 0);
        }

        // Jump
        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {

            if (this.coyoteTime > 0 || this.jumpCount < this.maxJumps) {

                my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
                this.jumpCount++;

                my.vfx.jump.emitParticleAt(
                    my.sprite.player.x,
                    my.sprite.player.y + 20
                );

                my.sfx.jump.play();
            }
        }

        // Restart
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }


    // Respawn
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