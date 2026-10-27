function changeActiveSection(e) {
    const nextSection = e.target.getAttribute('data-nextSection')
    
    document.querySelectorAll('.section.active').forEach(s => {
        s.classList.remove('active')
    })
    document.getElementById(nextSection).classList.add('active')

    if (game) {
        document.getElementById('weiterspielerBtn').style.display = 'block'
        if (nextSection === 'game') game.update()
    } else {
        document.getElementById('weiterspielerBtn').style.display = 'none'
    }
}

document.querySelectorAll('[data-nextSection]').forEach(btn => {
    btn.addEventListener('click', changeActiveSection)
})
document.getElementById('startBtn').addEventListener('click', newGame)

let game
function newGame() {
    if (game) {
        if (!confirm('Bist du sicher, dass du ein neues Spiel starten möchtest? Der aktuelle Spielstand wird überschrieben!')) {
            document.getElementById('game').classList.remove('active')
            document.getElementById('mainMenu').classList.add('active')
            return
        }
    }
    game = new Game()
}

//SETTINGS
function defaultSettings() {
    return {
        RICHTIGE_ANSAGE_PUNKTE: 20,
        FALSCHE_ANSAGE_MINUS_PUNKTE: 0,
        RICHTIGE_VORHERSAGE_PUNKTE_PRO_STICH: 10,
        FALSCHE_VORHERSAGE_MINSU_PUNKTE_PRO_STICH: 10,
        PUNKTE_PRO_STICH: 0
    }
}
const savedSettings = localStorage.getItem('settings')
let SETTINGS = savedSettings ? JSON.parse(savedSettings) : defaultSettings()
document.getElementById('settings').querySelectorAll('[data-setting]').forEach(input => {
    input.value = SETTINGS[input.getAttribute('data-setting')]
})
document.getElementById('settings').querySelectorAll('[data-setting]').forEach(input => {
    input.addEventListener('input', () => {
        SETTINGS[input.getAttribute('data-setting')] = isNaN(input.value) ? 0 : input.value
    })
})
document.getElementById('resetBtn').addEventListener('click', () => {
    SETTINGS = defaultSettings()
    document.getElementById('settings').querySelectorAll('[data-setting]').forEach(input => {
        input.value = SETTINGS[input.getAttribute('data-setting')]
    })
})
window.addEventListener('beforeunload', () => {
    localStorage.setItem('settings', JSON.stringify(SETTINGS))
})
//#################

class Player {
    constructor(index, game) {
        this.index = index // starts with 1
        this.game = game
        this.col = this.game.table.querySelector(`.stiche_col:nth-child(${this.index + 1})`)
        this.name_p = this.col.querySelector('p.name')
        this.rounds = [] // Array with {ansage: <INT>, stiche: <INT>}
        this.name = ''
    }
    getAnsage(round) {
        return this.rounds[round - 1]?.ansage ? this.rounds[round - 1].ansage : ''
    }
    ansage(round, ansage) {
        if (ansage < 0 || ansage > round || isNaN(ansage)) return

        this.rounds[round-1] ? this.rounds[round-1].ansage = ansage : this.rounds[round-1] = {ansage: ansage, stiche: undefined}
        
        this.update()
    }
    stiche(round, stiche) {
        if (!this.rounds[round-1]) return
        if (stiche < 0 || stiche > round || isNaN(stiche)) return

        this.rounds[round-1].stiche = stiche

        this.update()
    }
    reset() {
        this.rounds = []
        this.name = ''
        this.update()
    }
    update() {
        this.col = this.game.table.querySelector(`.stiche_col:nth-child(${this.index + 1})`)
        this.name_p = this.col.querySelector('p.name')
        
        this.name_p.innerText = this.name
        this.col.querySelectorAll('p:not(.name)').forEach(p => {
            const ROUND = p.getAttribute('data-row') // starts with 1
            const punkte_span = p.querySelector('span:first-child')
            const ansage_span = p.querySelector('span:last-child')
            punkte_span.innerText = ''
            ansage_span.innerText = ''
            if (this.rounds[ROUND-1]?.ansage) {
                ansage_span.innerText = this.rounds[ROUND-1].ansage
                if (this.rounds[ROUND-1]?.stiche) {
                    punkte_span.innerText = this.points_in_round(ROUND)
                }
            }
        })
    }
    points_in_round(round) {
        let points = 0
        for (let r = 0; r < round; r++) {
            const ROUND = this.rounds[r];
            if (ROUND.ansage == ROUND.stiche) {
                points += SETTINGS.RICHTIGE_ANSAGE_PUNKTE
                points += SETTINGS.RICHTIGE_VORHERSAGE_PUNKTE_PRO_STICH * ROUND.stiche
                
            } else {
                points -= SETTINGS.FALSCHE_ANSAGE_MINUS_PUNKTE
                points -= SETTINGS.FALSCHE_VORHERSAGE_MINSU_PUNKTE_PRO_STICH * Math.abs(ROUND.ansage - ROUND.stiche)
            }
            points += SETTINGS.PUNKTE_PRO_STICH * ROUND.stiche
        }
        return points
    }
    p_for_round(round) { // return the p-element for a given round in the game-table
        return this.col.querySelector(`p:nth-child(${round + 1})`)
    }
}

class Game {
    constructor() {
        this.date = new Date()

        this.players = []
        this.currentRoundNum = 0 // aktuelle Runde als Zahl
        //MOVED TO PLAYER this.rounds = [] // Auflistung aller Runden als Objekte -> Spieler mit angesagten und bekommenden Stichen

        this.popup_menu = new PopupMenu(document.getElementById('popup_menu'), this)
        this.table = document.getElementById('stiche_table')
        this.table.setAttribute('data-url', window.location || 'https://blockderwahrheit.netlify.app')

        // init players
        for (let i = 1; i < 7; i++) {
            this.players.push(new Player(i, this))
            this.players[i-1].update()
        }
        
        this.p_array = []
        let index = 1
        this.table.querySelectorAll('.stiche_col:not(#numbers_col)').forEach(col => {
            const currentPlayer = this.players[index-1]
            const name = col.querySelector('.name')
            name.setAttribute('tabindex', index)
            
            name.onclick = () => {
                this.popup_menu.show('name', name)
            }
            
            name.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevents the page from scrolling down when pressing Space
                    this.popup_menu.show('name', name)
                } else if (e.key.length === 1) {
                    // Checks if it's a single printable character before appending
                    currentPlayer.name += e.key
                    name.innerText += e.key
                } else if (e.key === 'Backspace') {
                    currentPlayer.name = currentPlayer.name.slice(0, -1);
                    name.innerText = name.innerText.slice(0, -1);
                }
            })

            col.querySelectorAll('p').forEach(p => {
                this.p_array.push(p)
                p.setAttribute('data-index', index)
                if (p != name) {
                    p.onclick = () => {
                        this.popup_menu.show('stiche', p)
                    }
                    
                    p.addEventListener('keydown', e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.popup_menu.show('stiche', p)
                        } /* else if (e.key.length === 1) { 
                            // Checks if it's a single printable character before appending
                            if (currentPlayer.getAnsage(index-1)) {
                                
                            } else {
                                currentPlayer.ansage(index-1, )
                            }
                        } */
                    })
                }
            })
            index++
        })
        for (let row = 0; row < 21; row++) {
            this.table.querySelectorAll(`.stiche_col:not(#numbers_col) p:nth-child(${row + 1})`).forEach(p => {
                p.setAttribute('tabindex', index)
                p.setAttribute('data-row', row)
                index++
            })
        }

        
        window.onbeforeunload = () => {
            if (game) { // unload protection when in game
                this.popup_menu.hide()
                return 'Möchtest du das Spiel wirklich verlassen?'
            } else return
        }
    }
    update() {
        this.players.forEach(player => {
            player.update()
        })
        this.popup_menu.container.querySelectorAll('input').forEach(input => {
            input.value = ''
        })
    }
}

class PopupMenu {
    constructor(element, game) {
        this.container = element
        this.game = game

        // name_input
        this.name_input_div = this.container.querySelector('#name_input_div')
        this.name_h2 = this.name_input_div.querySelector('#name_h2')
        this.name_input = this.name_input_div.querySelector('#name_input')
        this.player_delete_btn = this.container.querySelector('#player_delete_btn')
        this.player_switch_left = this.container.querySelector('#player_switch_left')
        this.player_switch_right = this.container.querySelector('#player_switch_right')
        // stiche_input
        this.stiche_input_div = this.container.querySelector('#stiche_input_div')
        this.stiche_h2 = this.stiche_input_div.querySelector('#stiche_h2')
        this.ansage_input = this.stiche_input_div.querySelector('#ansage_input')
        this.stiche_input = this.stiche_input_div.querySelector('#stiche_input')

        window.addEventListener('click', e => {
            if (!this.game.p_array.includes(e.target) && !this.container.contains(e.target)) { // light dismiss
                this.hide()
            }
        })
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.game.table.querySelector('[data-menu-open="true"]')?.focus({ preventScroll: true })
                this.hide()
            }
        })
        element.onsubmit = e => {
            this.game.table.querySelector('[data-menu-open="true"]')?.focus({ preventScroll: true })
            e.preventDefault()
            this.hide()
        }
    }
    show(type, target=undefined) {
        if (this.container.classList.contains('active')) { //reopen if already open
            this.hide()
            setTimeout(() => {
                this.show(type, target)
            }, 200);
            return
        }
        this.container.classList.add('active')

        if (target) {
            target.setAttribute('data-menu-open', true)
        }

        if (target == undefined) {
            console.error('[PopupMenu] no target')
            return false
        }
        const targetIndex = target.getAttribute('data-index')
        const playerIndex = targetIndex-1
        const currentPlayer = this.game.players[playerIndex]
        switch (type) {
            case 'name':
                this.name_input_div.classList.add('active')
                this.player_switch_left.disabled = targetIndex == 1
                this.player_switch_right.disabled = targetIndex == 6
                this.name_h2.innerText = `Spieler*in ${targetIndex}`
                this.name_input.value = currentPlayer.name
                this.name_input.focus({ preventScroll: true })
                this.name_input.oninput = () => {
                    currentPlayer.name = this.name_input.value
                    target.innerText = this.name_input.value
                }
                this.player_delete_btn.onclick = () => {
                    if (window.confirm('Willst du diese*n Spieler*in wirklich aus dem Spiel entfernen? (Bereits gespielte Runden werden für diese*n Spieler*in gelöscht)')) {
                        currentPlayer.reset()
                        this.hide()
                    }
                }
                this.player_switch_left.onclick = () => {
                    if (playerIndex > 0 && playerIndex < this.game.players.length) {
                        [this.game.players[playerIndex-1], this.game.players[playerIndex]] = [this.game.players[playerIndex], this.game.players[playerIndex-1]]
                        this.game.players[playerIndex].index = playerIndex + 1
                        this.game.players[playerIndex-1].index = playerIndex
                        this.game.players[playerIndex].update()
                        this.game.players[playerIndex-1].update()
                        this.show('name', this.game.players[playerIndex-1].name_p)
                    }
                }
                this.player_switch_right.onclick = () => {
                    if (playerIndex >= 0 && playerIndex < this.game.players.length - 1) {
                        [this.game.players[playerIndex], this.game.players[playerIndex+1]] = [this.game.players[playerIndex+1], this.game.players[playerIndex]];
                        this.game.players[playerIndex].index = playerIndex + 1;
                        this.game.players[playerIndex+1].index = playerIndex + 2;
                        this.game.players[playerIndex].update();
                        this.game.players[playerIndex+1].update();
                        this.show('name', this.game.players[playerIndex+1].name_p);
                    }
                }
                break;
            case 'stiche':
                const runde = target.getAttribute('data-row')
                //const punkte_span = target.querySelector('span:first-child') handeld in Player class
                const ansage_span = target.querySelector('span:last-child')
                this.stiche_input_div.classList.add('active')
                this.stiche_h2.innerText = `${currentPlayer.name ? currentPlayer.name : `Spieler*in ${targetIndex}`} Runde ${runde}`
                this.ansage_input.value = currentPlayer.getAnsage(runde)
                this.stiche_input.disabled = this.ansage_input.value == '' // disable Stiche if there is no Ansage
                this.stiche_input.max = currentPlayer.getAnsage(runde) // max amount of stiche == round
                this.ansage_input.max = runde // max amount of ansage == round
                
                if (currentPlayer.getAnsage(runde)) {
                    this.stiche_input.focus({ preventScroll: true })
                } else {
                    this.ansage_input.focus({ preventScroll: true })
                }

                this.ansage_input.oninput = () => {
                    currentPlayer.ansage(runde, this.ansage_input.value)
                    //ansage_span.innerText = this.ansage_input.value updating ui is done in player class
                }
                this.stiche_input.oninput = () => {
                    currentPlayer.stiche(runde, this.stiche_input.value)
                    //stiche_span.innerText = this.stiche_input.value updating ui is done in player class
                }

                break
            default:
                console.warn(`[PopupMenu] unknown Type: "${type}"`)
                break;
        }
    }
    hide() {
        this.container.classList.remove('active')
        this.container.querySelectorAll('.active').forEach(el => {
            el.classList.remove('active')
        })
        this.game.table.querySelectorAll('[data-menu-open="true"]').forEach(el => {
            el.setAttribute('data-menu-open', false)
        })
    }
}

/* class BlockDerWahrheit {
    constructor() {
        this.table = document.getElementById('BlockDerWahrheit')

        this.table.setAttribute('data-url', window.location || 'https://blockderwahrheit.netlify.app')

        this.text_img = document.createElement('img')
        this.text_img.id = 'text_img'
        this.text_img.src = 'assets/text.png'
        this.table.appendChild(this.text_img)
        
        for (let i = 0; i < 21; i++) { // 21: Anzahl der Reihen im Block
            let tr = document.createElement('tr')
            tr.id = `tr${i}`
            this.table.appendChild(tr)
            if (i !== 0) {
                let td = document.createElement('td')
                td.id = 'td0'
                td.innerText = i
                tr.appendChild(td)
                for (let j = 0; j < 6; j++) { // 6: 6 Spieler
                    if ((i >= 11 && j >= 5) || (i >= 13 && j >= 4) || (i >= 16 && j >= 3)) {
                        continue
                    }
                    let td = document.createElement('td')
                    let p0 = document.createElement('p')
                    p0.id = `p0`
                    let p1 = document.createElement('p')
                    p1.id = `p1`
                    td.id = `td${j + 1}`
                    tr.appendChild(td)
                    td.appendChild(p0)
                    td.appendChild(p1)
                }
            } else {
                for (let j = 0; j < 7; j++) { // 7: 6 Spieler und die frei Ecke
                    let th = document.createElement('th')
                    th.id = `th${j}`
                    tr.appendChild(th)
                }
            }
        }
        let index = 0
        Spieler.forEach(player => {
            index++
            document.getElementById(`th${index}`).innerText = player.name
        })
    }
    remove() {
        this.table.innerHTML = ''
    }
    show() {
        this.table.classList.add('active')
        backdrop.classList.add('active')
        backdrop.style.pointerEvents = 'all'
        backdrop.addEventListener('click', () => {
            backdrop.style.pointerEvents = 'none'
            this.table.classList.remove('active')
            backdrop.classList.remove('active')
        }, {once: true})
    }
} */

/* class Player {
    constructor(name, index) {
       this.name = name
        this.points = 0
        this.ansage = 0
        this.index = index
    }
    ansagen(value, runde = Runde) {
        this.ansage = value
        document.querySelector(`#tr${runde} #td${this.index+1} #p1`).innerText = value
    }
    eintragen(value, runde = Runde) {
        if (this.ansage == value) {
            this.points += richtigPkt + value * richtigProStichPkt
        } else {
            this.points -= falschPkt + Math.abs(this.ansage - value) * falschProStichPkt
        }
        this.points += value * proStichPkt
        
        document.querySelector(`#tr${runde} #td${this.index+1} #p0`).innerText = this.points
    }
    static addPlayerNameInput(position) {
        let input = document.createElement('input')
        input.type = 'text'
        input.maxLength = 10
        input.placeholder = `Spieler ${position}`
        return input
    }
    static getName(index) {
        return Spieler[index].name
    }
}
const quickStartBtn = document.getElementById('quickStartBtn')

const playerMenu = document.getElementById('playerMenu')
const anzahlP = document.getElementById('anzahlP')

let Spieleranzahl = 3
let Spieler = []
let richtigPkt = 20
let falschPkt = 0 // Minuspunkte
let falschProStichPkt = 10 // Minuspunkte
let richtigProStichPkt = 10
let proStichPkt = 0 // unabhängig von Vorhersage

if (localStorage.getItem('settings')) {
    const settings = JSON.parse(localStorage.getItem('settings'))
    Spieleranzahl = settings.Spieleranzahl
    let _index = 0
    settings.SpielerNamen.forEach(p => {
        Spieler.push(new Player(p, _index))
        _index++
    })
    
    richtigPkt = settings.richtigPkt
    falschPkt = settings.falschPkt
    falschProStichPkt = settings.falschProStichPkt
    richtigProStichPkt = settings.richtigProStichPkt
    proStichPkt = settings.proStichPkt
} else {
    quickStartBtn.style.display = 'none'
}
let AusteilIndex = 2
let RauskommenIndex = 0
let wiederholungen = 0
let gespeicherterIndex = undefined
let VorhersageIndex = RauskommenIndex
let ErgebnisIndex = VorhersageIndex
let Runde = 1
let gameState = 'Main_Menu'

const minusBtn = document.getElementById('minus')
const plusBtn = document.getElementById('plus')
const weiterBtn = document.getElementById('weiterBtn')
const playerNameInputs = document.getElementById('playerNameInputs')

const gameMenu = document.getElementById('gameMenu')
const richtigPktInput = document.getElementById('richtigPkt')
const falschPktInput = document.getElementById('falschPkt')
const falschProStichPktInput = document.getElementById('falschProStichPkt')
const richtigProStichPktInput = document.getElementById('richtigProStichPkt')
const proStichPktInput = document.getElementById('proStichPkt')
const losBtn = document.getElementById('losBtn')

const BlockDerWahrheitBtn = document.getElementById('BlockDerWahrheitBtn')
const backdrop = document.getElementById('backdrop')
const gameWeiterBtn = document.getElementById('gameWeiterBtn')
const currentState = document.getElementById('currentState')
const stateInfo = document.getElementById('stateInfo')
const sticheInput = document.getElementById('sticheInput')
const anzahlS = document.getElementById('anzahlS')
const plusSBtn = document.getElementById('plusS')
const minusSBtn = document.getElementById('minusS')

// RESET BTN
document.querySelectorAll('.resetBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        switch (gameState) {
            case 'Player_Menu':
                playerNameInputs.innerHTML = ""
                Spieleranzahl = 3
                anzahlP.innerText = Spieleranzahl
                for (let i = 0; i < Spieleranzahl; i++) {
                    playerNameInputs.appendChild(Player.addPlayerNameInput(i+1))
                }
                break;
            case 'Game_Menu':
                richtigPkt = 20
                falschPkt = 0
                falschProStichPkt = 10
                richtigProStichPkt = 10
                proStichPkt = 0
                richtigPktInput.value = richtigPkt
                falschPktInput.value = falschPkt
                falschProStichPktInput.value = falschProStichPkt
                richtigProStichPktInput.value = richtigProStichPkt
                proStichPktInput.value = proStichPkt
                break;
        
            default:
                console.error('Reset was called with an unknown gamestate')
                break;
        }
    })
})

// Start from Main Menu
startBtn.addEventListener('click', () => {
    startMenu.classList.remove('active')
    playerMenu.classList.add('active')
    gameState = 'Player_Menu'
    playerNameInputs.innerHTML = ''
    for (let i = 0; i < Spieleranzahl; i++) {
        playerNameInputs.appendChild(Player.addPlayerNameInput(i+1))
    }
})

// Remove Player in Player Menu
minusBtn.addEventListener('click', () => {
    if (Spieleranzahl > 3) {
        Spieleranzahl--
        anzahlP.innerText = Spieleranzahl
        playerNameInputs.removeChild(playerNameInputs.lastChild)
    }
})
// Add Player in Player Menu
plusBtn.addEventListener('click', () => {
    if (Spieleranzahl < 6) {
        Spieleranzahl++
        anzahlP.innerText = Spieleranzahl
        playerNameInputs.appendChild(Player.addPlayerNameInput(Spieleranzahl))
    }
})

// Weiter von Player Menu zu Game Menu
weiterBtn.addEventListener('click', () => {
    Spieler = []
    for (let i = 0; i < Spieleranzahl; i++) {
        Spieler.push(new Player(playerNameInputs.children.item(i).value || `Spieler ${i+1}`, i))
    }
    playerMenu.classList.remove('active')
    gameMenu.classList.add('active')
    gameState = 'Game_Menu'
})

// Spiel starten von Game Menu
let blockDerWahrheit
losBtn.addEventListener('click', () => {
    gameMenu.classList.remove('active')
    gameDiv.classList.add('active')
    gameState = 'Austeilen'
    blockDerWahrheit= new BlockDerWahrheit()

    AusteilIndex = Spieler.length - 1
    RauskommenIndex = 0
    VorhersageIndex = RauskommenIndex
    ErgebnisIndex = VorhersageIndex
    let _Spieler = []
    Spieler.forEach(p => {
        p.points = 0
        _Spieler.push(p.name)
    })

    const settings = {
        Spieleranzahl: Spieleranzahl,
        SpielerNamen: _Spieler,
        richtigPkt: richtigPkt,
        falschPkt: falschPkt,
        falschProStichPkt: falschProStichPkt,
        richtigProStichPkt: richtigProStichPkt,
        proStichPkt: proStichPkt
    }
    localStorage.setItem('settings', JSON.stringify(settings))
    quickStartBtn.style.display = 'block'
    next()
})
// Spiel starten von Start Menu
quickStartBtn.addEventListener('click', () => {
    startMenu.classList.remove('active')
    gameDiv.classList.add('active')
    gameState = 'Austeilen'
    blockDerWahrheit= new BlockDerWahrheit()
    Spieler.forEach(p => {
        p.points = 0
    })

    AusteilIndex = Spieler.length - 1
    RauskommenIndex = 0
    VorhersageIndex = RauskommenIndex
    ErgebnisIndex = VorhersageIndex
    next()
})

plusSBtn.addEventListener('click', () => {
    if (anzahlS.innerText < Runde) {
        anzahlS.innerText = parseInt(anzahlS.innerText) + 1
    }
})
minusSBtn.addEventListener('click', () => {
    if (anzahlS.innerText > 0) {
        anzahlS.innerText = parseInt(anzahlS.innerText) - 1
    }
})

BlockDerWahrheitBtn.addEventListener('click', (e) => {
    e.stopImmediatePropagation()
    blockDerWahrheit.show()
})
function next() {
    gameWeiterBtn.disabled = true
    setTimeout(() => {
        gameWeiterBtn.disabled = false
    }, 200);
    sticheInput.style.display = 'none'
    currentState.innerText = `${gameState} (Runde ${Runde})`
    switch (gameState) {
        case 'Austeilen':
            if (gespeicherterIndex !== undefined) {
                Spieler[gespeicherterIndex].eintragen(parseInt(anzahlS.innerText) || 0, Runde - 1)
                gespeicherterIndex = undefined
            }
            stateInfo.innerHTML = `<b>${Player.getName(AusteilIndex)}</b> muss <b>${Runde}</b> Karte(n) austeilen`
            gameState = 'Vorhersage'
            break;
        case 'Vorhersage':
            wiederholungen++
            if (gespeicherterIndex !== undefined) {
                Spieler[gespeicherterIndex].ansagen(parseInt(anzahlS.innerText) || 0)
            }
            stateInfo.innerHTML = `<b>${Player.getName(VorhersageIndex)}</b> muss Stiche ansagen`
            sticheInput.style.display = 'flex'
            anzahlS.innerText = '0'
            gespeicherterIndex = VorhersageIndex
            VorhersageIndex = nextIndex(VorhersageIndex)
            
            if (wiederholungen === Spieler.length) {
                wiederholungen = 0
                gameState = 'Spielen'
            }
            break
        case 'Spielen':
            Spieler[gespeicherterIndex].ansagen(parseInt(anzahlS.innerText) || 0)
            gespeicherterIndex = undefined
            stateInfo.innerHTML = `<b>${Player.getName(RauskommenIndex)}</b> kommt raus`
            gameState = 'Stiche eintragen'
            break
        case 'Stiche eintragen':
            wiederholungen++
            if (gespeicherterIndex !== undefined) {
                Spieler[gespeicherterIndex].eintragen(parseInt(anzahlS.innerText) || 0)
            }
            stateInfo.innerHTML = `Wie viele Stiche hat <b>${Player.getName(ErgebnisIndex)}</b> bekommen?`
            sticheInput.style.display = 'flex'
            anzahlS.innerText = Spieler[ErgebnisIndex].ansage
            gespeicherterIndex = ErgebnisIndex
            ErgebnisIndex = nextIndex(ErgebnisIndex)
            if (wiederholungen === Spieler.length) {
                wiederholungen = 0
                if (Runde < 60 / Spieler.length) {
                    gameState = 'Austeilen'
                    Runde ++
                    RauskommenIndex = nextIndex(RauskommenIndex)
                    AusteilIndex = nextIndex(AusteilIndex)
                    VorhersageIndex = nextIndex(VorhersageIndex)
                    ErgebnisIndex = nextIndex(ErgebnisIndex)
                } else {
                    gameState = 'Ende'
                }
            }
            break
        case 'Ende':
            Spieler[gespeicherterIndex].eintragen(parseInt(anzahlS.innerText) || 0)
            gespeicherterIndex = undefined
            stateInfo.innerHTML = `Das Spiel ist zueende`
            blockDerWahrheit.show()
            gameState = 'Zurück'
            break
        case 'Zurück':
            Runde = 1
            blockDerWahrheit.remove()
            gameDiv.classList.remove('active')
            startMenu.classList.add('active')
            break
                
        default:
            console.error('unknown gamestate')
            break;
        }
}
function nextIndex(index) {
    return index < Spieler.length - 1 ? index + 1 : 0
}

gameWeiterBtn.addEventListener('click', next) */