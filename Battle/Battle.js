class Battle{
    constructor({enemy, onComplete}){
        
        this.enemy = enemy;
        this.onComplete = onComplete;
        
        this.combatants = {

            // "player1": new Combatant({
            //     ...Pizzas.s001,
            //     team: "player",
            //     hp: 50,
            //     maxHp: 50,
            //     xp: 95,
            //     maxXp: 100,
            //     level:1,
            //     status: {type: "saucy"},
            //     isPlayerControlled: true,
            // }, this),
            // "player2": new Combatant({
            //     ...Pizzas.s002,
            //     team: "player",
            //     hp: 1,
            //     maxHp: 50,
            //     xp: 75,
            //     maxXp: 100,
            //     level:1,
            //     status: null,
            //     isPlayerControlled: true,
            // }, this),
            // "enemy1": new Combatant({
            //     team: "enemy",
            //     ...Pizzas.v001,
            //     hp: 1,
            //     maxHp: 50,
            //     xp: 20,
            //     maxXp: 100,
            //     level:1,
            //     status: null,
            // }, this),
            // "enemy2": new Combatant({
            //     team: "enemy",
            //     ...Pizzas.f001,
            //     hp: 25,
            //     maxHp: 50,
            //     xp: 30,
            //     maxXp: 100,
            //     level:1,
            //     status: null,
            // }, this),
        }

        this.activeCombatants = {
            player: null,
            enemy: null,
        }

        window.playerState.lineup.forEach(id => {
            this.addCombatant(id,"player", window.playerState.pizzas[id])
        })


        Object.keys(this.enemy.pizzas).forEach(key =>{
            this.addCombatant("e_"+key, "enemy", this.enemy.pizzas[key])
        })


       
        this.items = []

        // loading items from playerState
        window.playerState.items.forEach(item => {
            this.items.push({
                ...item,
                team: "player"
            })
        })

        this.usedInstanceIds = {};
    }

    addCombatant(id, team,config){
        this.combatants[id] = new Combatant({
            ...Pizzas[config.pizzaId],
            ...config,
            team,
            isPlayerControlled: team === "player"
        }, this)

        // Populate first active pizza
        this.activeCombatants[team] = this.activeCombatants[team] || id
    }

    createElement(){
        this.element = document.createElement("div");
        this.element.classList.add("Battle");
        this.element.innerHTML = (`
            <div class = "Battle_hero">
                <img src = "${'./images/characters/people/cat.png'}" alt = "Hero"/>
            </div> 

            <div class = "Battle_enemy">
                <img src = "${this.enemy.src}" alt = "${this.enemy.name}"/>
            </div>  
        `)
    }

    init(container){
        this.createElement();
        container.appendChild(this.element);

        this.playerTeam = new Team ("player", "Hero");
        this.enemyTeam = new Team ("enemy", "Bully");

        Object.keys(this.combatants).forEach(key =>{
            let combatant = this.combatants[key];
            combatant.id = key;
            combatant.init(this.element);

            if (combatant.team === "player"){
                this.playerTeam.combatants.push(combatant);
            } else if (combatant.team === "enemy") {
                this.enemyTeam.combatants.push(combatant);
            }
        })

        this.playerTeam.init(this.element);
        this.enemyTeam.init(this.element);

        this.turnCycle = new TurnCycle({
            battle: this,
            onNewEvent: event =>{
                return new Promise(resolve =>{
                    const battleEvent = new BattleEvent(event, this);
                    battleEvent.init(resolve);
                })
            },
            onWinner: winner => {
                if (winner === "player"){
                    const playerState = window.playerState;
                    Object.keys(playerState.pizzas).forEach(id =>{
                        const playerStatePizza = playerState.pizzas[id];
                        const combatant = this.combatants[id];
                        if (combatant){
                            playerStatePizza.hp = combatant.hp;
                            playerStatePizza.xp = combatant.xp;
                            playerStatePizza.maxXp = combatant.maxXp;
                            playerStatePizza.level = combatant.level;
                        }
                    })

                    // remove used items
                    playerState.items = playerState.items.filter(item =>{
                        return !this.usedInstanceIds[item.instanceId ]
                    })

                    // send signal to update
                    utils.emitEvent("PlayerStateUpdated");
                }

                this.element.remove();
                this.onComplete(winner === "player");
            }
        })

        this.turnCycle.init();
    }
}