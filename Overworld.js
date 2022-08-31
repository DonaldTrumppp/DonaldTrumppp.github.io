class Overworld {
  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
    this.fps = config.fps || 60;
    this.fpsInterval,
      this.startTime,
      this.now,
      this.then,
      this.elapsed;
  }

  startAnimating() {
    this.fpsInterval = 1000 / this.fps;
    this.then = Date.now();
    this.startTime = this.then;

    this.update();
  }

  update() {
    window.requestAnimationFrame(() => {
      this.update();
    })
    this.now = Date.now();
    this.elapsed = this.now - this.then;
    if (this.elapsed > this.fpsInterval && !this.map.isPaused) {
      // Get ready for next frame by setting then=now, but also adjust for your
      // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
      this.then = this.now - (this.elapsed % this.fpsInterval);

      // Update the game 
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // camera
      const cameraPerson = this.map.gameObjects.hero;

      // update all objects before drawing
      Object.values(this.map.gameObjects).forEach(object => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map,
        })
      })

      this.map.drawLowerImage(this.ctx, cameraPerson)

      // Draw GameOjbects between the lower and upper, sort by y value first
      Object.values(this.map.gameObjects).sort((a, b) => {
        return a.y - b.y;
      }).forEach(object => {
        object.sprite.draw(this.ctx, cameraPerson);
      })
      this.map.drawUpperImage(this.ctx, cameraPerson)
    }
  }

  bindActionInput() {
    new KeyPressListener("Enter", () => {
      this.map.checkForActionCutscene();
    })
    new KeyPressListener("Escape", ()=>{
      if (!this.map.isCutscenePlaying){
        this.map.startCutscene([
          {type: "pause"}
        ])
      }
    })
  }

  bindHeroPositionCheck() {
    document.addEventListener("PersonWalkingComplete", e =>{
      if (e.detail.whoId === "hero"){
        this.map.checkForFootStepCutscene();
      }
    })
  }

  startMap(mapConfig, heroInitialState = null){
    this.map = new OverworldMap(mapConfig);
    this.map.overworld = this;
    this.map.mountObjects();

    if (heroInitialState){
      this.map.gameObjects.hero.x = heroInitialState.x;
      this.map.gameObjects.hero.y = heroInitialState.y;
      this.map.gameObjects.hero.direction = heroInitialState.direction;
    }

    this.progress.mapId = mapConfig.id;
    this.progress.startingHeroX = this.map.gameObjects.hero.x;
    this.progress.startingHeroY = this.map.gameObjects.hero.y;
    this.progress.startingHeroDirection = this.map.gameObjects.hero.direction;

  }

  async init() {

    const container = document.querySelector(".game-container")

    this.progress = new Progress();

    this.titleScreen = new TitleScreen({
      progress: this.progress
    })
    const useSaveFile = await this.titleScreen.init(container)

    // Check if saved data
    let initialHeroState = null;
    
    if (useSaveFile){
      this.progress.load();
      initialHeroState = {
        x: this.progress.startingHeroX,
        y: this.progress.startingHeroY,
        direction: this.progress.startingHeroDirection,
      }
    }

    // load the HUD after loading file
    this.hud = new Hud();
    this.hud.init(container)

    this.startMap(window.OverworldMaps[this.progress.mapId], initialHeroState);

    this.bindActionInput();
    this.bindHeroPositionCheck();

    this.directionInput = new DirectionInput();
    this.directionInput.init();



    this.startAnimating();

    // this.map.startCutscene([
    //   {type: "battle", enemyId: "beth"}
      // {type: "changeMap", map: "DemoRoom"}
      // {who: "hero", type: "walk", direction: "down"},
      // {who: "hero", type: "walk", direction: "down"},
      // {who: "npcA", type: "walk", direction: "left"},
      // {who: "npcA", type: "walk", direction: "left"},
      // {who: "npcA", type: "stand", direction: "up", time: 100},
      // {type: "textMessage", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."},
      // {type: "textMessage", text: "Nulla gravida id neque ut vulputate. Curabitur volutpat ultrices lorem vitae faucibus."},
    // ]);


  }
}