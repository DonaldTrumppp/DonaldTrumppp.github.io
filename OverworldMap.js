class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = []; // Live object
    this.walls = config.walls || {};
    this.cutsceneSpaces = config.cutsceneSpaces || {};

    this.configObjects = config.configObjects; // Configuration

    // Lower = Background
    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;
    this.isPaused = false;

  }
  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(this.lowerImage, utils.withGrid(10.5) - cameraPerson.x, utils.withGrid(6) - cameraPerson.y)
  }
  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(this.upperImage, utils.withGrid(10.5) - cameraPerson.x, utils.withGrid(6) - cameraPerson.y)
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    if (this.walls[`${x},${y}`]){
      return true
    }
    return Object.values(this.gameObjects).find(obj =>{
      if (obj.x === x && obj.y === y){ return true;}
      if (obj.intentPosition && obj.intentPosition[0] === x && obj.intentPosition[1] === y){
        return true;
      }
      return false;
    });
  }

  mountObjects() {
    Object.keys(this.configObjects).forEach(key => {
      let object = this.configObjects[key];
      object.id = key;

      let instance;
      if (object.type === "Person") {
        instance = new Person(object);

      }
      if (object.type === "PizzaStone") {
        instance = new PizzaStone(object);
        // instance = new PizzaStone(object);
      }
      this.gameObjects[key] = instance;
      this.gameObjects[key].id = key;
      instance.mount(this);
      //determine whether the object should be mounted (e.g. key or gold chest)


    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    // Start a loop of async events
    // await each one
    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      });
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE") {
        break;
      }

    }

    this.isCutscenePlaying = false;

  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(o => {
      return `${o.x},${o.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {

      const relevantScenario = match.talking.find(scenario => {
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf];
        })
      })

      relevantScenario && this.startCutscene(relevantScenario.events);
    }
  }

  checkForFootStepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene(match[0].events)
    }
  }
}


window.OverworldMaps = {
  DemoRoom: {
    id: "DemoRoom",
    lowerSrc: "./images/maps/DemoLower.png",
    upperSrc: "./images/maps/DemoUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
        tileSize: 48,
        offset: { x: 16, y: 20 },
      },
      npcA: {
        type: "Person",
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "./images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand", direction: "left", time: 800 },
          { type: "stand", direction: "up", time: 800 },
          { type: "stand", direction: "right", time: 1200 },
          { type: "stand", direction: "up", time: 300 },
        ],
        talking: [
          {
            required: ["TALKED_TO_ERIO"],
            events: [
              { type: "textMessage", text: "I see you've talked to Erio", faceHero: "npcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Have you met Erio", faceHero: "npcA" },
              // { type: "battle", enemyId: "beth" },
              // { type: "addStoryFlag", flag: "DEFEATED_BETH" },
              // { type: "textMessage", text: "You win, this time" },
            ]
          }
        ],
      },
      npcB: {
        type: "Person",
        x: utils.withGrid(3),
        y: utils.withGrid(7),
        src: "./images/characters/people/erio.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Bahaha!" },
              { type: "addStoryFlag", flag: "TALKED_TO_ERIO" },
              // {type: "battle", enemyId: "erio"},
            ]
          }
        ],
        behaviorLoop: [
            {type: "walk", direction: "left"},
            {type: "stand", direction: "left", time: 800},
            {type: "walk", direction: "up"},
            {type: "stand", direction: "up", time: 800},
            {type: "walk", direction: "right"},
            {type: "stand", direction: "right", time: 800},
            {type: "walk", direction: "down"},
            {type: "stand", direction: "down", time: 800},

        ],
      },
      pizzaStone: {
        type: "PizzaStone",
        x: utils.withGrid(8),
        y: utils.withGrid(6),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["v001", "f001"],
      }
    },
    walls: {
      // [dynamic key]
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 7)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7, 4)]: [
        {
          events: [
            { who: "npcB", type: "walk", direction: "left" },
            { type: "textMessage", text: "You can't be in there!" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "left" },
          ]
        }
      ],

      [utils.asGridCoord(5, 10)]: [
        {
          events: [
            { 
              type: "changeMap",
              map: "Street",
              x: utils.withGrid(5),
              y: utils.withGrid(9),
              direction: "down"
            }
          ]
        }
      ]
    }
  },
  Kitchen: {
    id: "Kitchen",
    lowerSrc: "./images/maps/KitchenLower.png",
    upperSrc: "./images/maps/KitchenUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(5),
        tileSize: 48,
        offset: { x: 16, y: 20 },
      },
      npcA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(6),
        src: "./images/characters/people/npc1.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "New Map", faceHero: "npcA" },
              { type: "textMessage", text: "Kitchen" },
              { who: "hero", type: "walk", direction: "up" },
            ]
          }
        ],
      },
      npcB: {
        type: "Person",
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "./images/characters/people/npc2.png",
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { 
              type: "changeMap",
              map: "Street",
              x: utils.withGrid(29),
              y: utils.withGrid(9),
              direction: "down"
            }
          ]
        }
      ],
    }
  },
  Street: {
    id: "Street",
    lowerSrc: "./images/maps/StreetLower.png",
    upperSrc: "./images/maps/StreetUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(30),
        y: utils.withGrid(10),
        tileSize: 48,
        offset: { x: 16, y: 20 },
      },
      streetNpcA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(11),
        src: "./images/characters/people/npc2.png",
        behaviorLoop: [
          { type: "stand", direction: "right", time: 1400, },
          { type: "stand", direction: "up", time: 900, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "All ambitious pizza chefs gather on Anchovy Avenue.", faceHero: "streetNpcA" },
            ]
          }
        ]
      },
      streetNpcB: {
        type: "Person",
        x: utils.withGrid(31),
        y: utils.withGrid(12),
        src: "./images/characters/people/npc7.png",
        behaviorLoop: [
          { type: "stand", direction: "up", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "down", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "right", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I can't decide on my favorite toppings.", faceHero: "streetNpcB" },
            ]
          }
        ]
      },
      streetNpcC: {
        type: "Person",
        x: utils.withGrid(22),
        y: utils.withGrid(10),
        src: "./images/characters/people/npc8.png",
        talking: [
          {
            required: ["streetBattle"],
            events: [
              { type: "textMessage", text: "You are quite capable.", faceHero: "streetNpcC" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "You should have just stayed home!", faceHero: "streetNpcC" },
              { type: "battle", enemyId: "streetBattle" },
              { type: "addStoryFlag", flag: "streetBattle" },
            ]
          },
        ]
      },
    },
    walls: function () {
      let walls = {};
      ["4,9", "5,8", "6,9", "7,9", "8,9", "9,9", "10,9", "11,9", "12,9", "13,8", "14,8", "15,7",
        "16,7", "17,7", "18,7", "19,7", "20,7", "21,7", "22,7", "23,7", "24,7", "24,6", "24,5", "26,5", "26,6", "26,7", "27,7", "28,8", "28,9", "29,8", "30,9", "31,9", "32,9", "33,9",
        "16,9", "17,9", "25,9", "26,9", "16,10", "17,10", "25,10", "26,10", "16,11", "17,11", "25,11", "26,11",
        "18,11", "19,11",
        "4,14", "5,14", "6,14", "7,14", "8,14", "9,14", "10,14", "11,14", "12,14", "13,14", "14,14", "15,14", "16,14", "17,14", "18,14", "19,14", "20,14", "21,14", "22,14", "23,14",
        "24,14", "25,14", "26,14", "27,14", "28,14", "29,14", "30,14", "31,14", "32,14", "33,14",
        "3,10", "3,11", "3,12", "3,13", "34,10", "34,11", "34,12", "34,13",
        "29,8", "25,4",
      ].forEach(coord => {
        let [x, y] = coord.split(",");
        walls[utils.asGridCoord(x, y)] = true;
      })
      return walls;
    }(),
    cutsceneSpaces: {
      [utils.asGridCoord(5, 9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "DemoRoom",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(29, 9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Kitchen",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(25, 5)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "StreetNorth",
              x: utils.withGrid(7),
              y: utils.withGrid(16),
              direction: "up"
            }
          ]
        }
      ]
    }
  },
}