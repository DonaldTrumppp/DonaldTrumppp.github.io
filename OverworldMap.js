class OverworldMap {
    constructor(config){
        this.overworld = null;
        this.gameObjects = config.gameObjects;
        this.walls = config.walls || {};
        this.cutsceneSpaces = config.cutsceneSpaces || {};

        // Lower = Background
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;

        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;

        this.isCutscenePlaying = false;

    }
    drawLowerImage(ctx, cameraPerson){
        ctx.drawImage(this.lowerImage, utils.withGrid(10.5) - cameraPerson.x, utils.withGrid(6) - cameraPerson.y)
    }
    drawUpperImage(ctx, cameraPerson){
        ctx.drawImage(this.upperImage,utils.withGrid(10.5) - cameraPerson.x, utils.withGrid(6) - cameraPerson.y)
    }

    isSpaceTaken(currentX, currentY, direction){
        const {x,y} = utils.nextPosition(currentX, currentY, direction);
        return this.walls[`${x},${y}`] || false;
    }

    mountObjects(){
        Object.keys(this.gameObjects).forEach(key =>{
            let o = this.gameObjects[key];
            o.id = key;

            //determine whether the object should be mounted (e.g. key or gold chest)

            o.mount(this);
        })
    }

    async startCutscene(events){
        this.isCutscenePlaying = true;

        // Start a loop of async events
        // await each one
        for (let i = 0; i < events.length; i++) {
            const eventHandler = new OverworldEvent({
                event: events[i],
                map: this,
            });
            await eventHandler.init();
            
        }

        this.isCutscenePlaying = false;

        // reset NPCs to do their idle behavior
        Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this))

    }

    checkForActionCutscene(){
        const hero = this.gameObjects["hero"];
        const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
        const match = Object.values(this.gameObjects).find(o =>{
            return `${o.x},${o.y}` === `${nextCoords.x},${nextCoords.y}`
        });
        if (!this.isCutscenePlaying && match && match.talking.length){
            this.startCutscene(match.talking[0].events);
        }
    }

    checkForFootStepCutscene(){
        const hero = this.gameObjects["hero"];
        const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];
        if (!this.isCutscenePlaying && match){
            this.startCutscene(match[0].events)
        }
    }
}


window.OverworldMaps = {
    DemoRoom: {
        lowerSrc: "/images/maps/DemoLower.png",
        upperSrc: "/images/maps/DemoUpper.png",
        gameObjects: {
            hero: new Person({
                isplayerControlled: true,
                x: utils.withGrid(5),
                y: utils.withGrid(6),
                tileSize : 48,
                offset : {x: 16, y: 20},
            }),
            npcA: new Person({
                x: utils.withGrid(7),
                y: utils.withGrid(9),
                src: "/images/characters/people/npc1.png",
                behaviorLoop:[
                    {type: "stand", direction: "left", time: 800},
                    {type: "stand", direction: "up", time: 800},
                    {type: "stand", direction: "right", time: 1200},
                    {type: "stand", direction: "up", time: 300},
                ],
                talking:[
                    {
                        events: [ 
                            {type: "textMessage", text: "Hello", faceHero: "npcA"},
                            {type: "textMessage", text: "Bye"},
                            {who: "hero", type: "walk", direction: "up"},
                        ]
                    }
                ],
            }),
            npcB: new Person({
                x: utils.withGrid(3),
                y: utils.withGrid(7),
                src: "/images/characters/people/npc2.png",
                behaviorLoop: [
                    {type: "walk", direction: "left"},
                    {type: "stand", direction: "up", time: 800},
                    {type: "walk", direction: "up"},
                    {type: "walk", direction: "right"},
                    {type: "walk", direction: "down"},
                ],
            }),
        },
        walls: {
            // [dynamic key]
            [utils.asGridCoord (7,6)]: true,
            [utils.asGridCoord (8,6)]: true,
            [utils.asGridCoord (7,7)]: true,
            [utils.asGridCoord (8,7)]: true,
        },
        cutsceneSpaces: {
            [utils.asGridCoord (7,4)]: [
                {
                    events: [
                        {who: "npcB", type: "walk", direction: "left"},
                        {type: "textMessage", text: "You can't be in there!"},
                        {who: "hero", type: "walk", direction: "down"},
                        {who: "hero", type: "walk", direction: "left"},
                    ]
                }
            ],

            [utils.asGridCoord (5,10)]: [
                {
                    events: [
                        {type: "changeMap", map: "Kitchen"}
                    ]
                }
            ]
        }
    },
    Kitchen: {
        lowerSrc: "/images/maps/KitchenLower.png",
        upperSrc: "/images/maps/KitchenUpper.png",
        gameObjects: {
            hero: new Person({
                isplayerControlled: true,
                x: utils.withGrid(5),
                y: utils.withGrid(5),
                tileSize : 48,
                offset : {x: 16, y: 20},
            }),
            npcA: new Person({
                x: utils.withGrid(9),
                y: utils.withGrid(6),
                src: "/images/characters/people/npc1.png",
                talking:[
                    {
                        events: [ 
                            {type: "textMessage", text: "New Map", faceHero: "npcA"},
                            {type: "textMessage", text: "Kitchen"},
                            {who: "hero", type: "walk", direction: "up"},
                        ]
                    }
                ],
            }),
            npcB: new Person({
                x: utils.withGrid(10),
                y: utils.withGrid(8),
                src: "/images/characters/people/npc2.png",
            }),
        }
    }
}