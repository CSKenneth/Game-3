class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {

       
        this.load.setPath("./assets/");

        // Player
        this.load.image("platformer_characters", "fox.png");

        // Textures
        this.load.image("tilemap_tiles", "tilemap_packed.png");
        this.load.image("food_tiles", "food_tilemap_packed.png");
        this.load.image("industrial_tiles", "tilemap_packed1.png");
        this.load.image("industrial_tiles2", "platformerPack_industrial_tilesheet.png");
        this.load.image("city_tiles", "city_tilemap_packed.png");

        // Objects
        this.load.image("food", "tile_0014.png");
        this.load.image("bed", "tile_0275.png");

        // Loads Tilemaps
        this.load.tilemapTiledJSON(
            "platformer-level-1",
            "platformer-level-1.tmj"
        );

        // Audio
        this.load.audio("coin_sfx", "switch_003.ogg");
        this.load.audio("jump_sfx", "bong_001.ogg");

        // Tilemaps frame
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet("food_sheet", "food_tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet("industrial_sheet", "tilemap_packed1.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // Particles
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {

        // random fixes
        this.anims.create({
            key: "idle",
            frames: [{ key: "platformer_characters" }]
        });

        this.scene.start("platformerScene");
    }

    update() {}
}