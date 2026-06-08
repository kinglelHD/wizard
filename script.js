class Player {
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

class BlockDerWahrheit {
    constructor() {
        this.table = document.getElementById('BlockDerWahrheit')
        
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
}
const startMenu = document.getElementById('startMenu')
const startBtn = document.getElementById('startBtn')
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
                Spieler[gespeicherterIndex].eintragen(sticheInput.value || 0, Runde - 1)
                gespeicherterIndex = undefined
            }
            stateInfo.innerHTML = `<b>${Player.getName(AusteilIndex)}</b> muss <b>${Runde}</b> Karte(n) austeilen`
            gameState = 'Vorhersage'
            break;
        case 'Vorhersage':
            wiederholungen++
            if (gespeicherterIndex !== undefined) {
                Spieler[gespeicherterIndex].ansagen(sticheInput.value || 0)
            }
            stateInfo.innerHTML = `<b>${Player.getName(VorhersageIndex)}</b> muss Stiche ansagen`
            sticheInput.style.display = 'block'
            sticheInput.value = ''
            gespeicherterIndex = VorhersageIndex
            VorhersageIndex = nextIndex(VorhersageIndex)
            
            if (wiederholungen === Spieler.length) {
                wiederholungen = 0
                gameState = 'Spielen'
            }
            break
        case 'Spielen':
            Spieler[gespeicherterIndex].ansagen(sticheInput.value || 0)
            gespeicherterIndex = undefined
            stateInfo.innerHTML = `<b>${Player.getName(RauskommenIndex)}</b> kommt raus`
            gameState = 'Stiche eintragen'
            break
        case 'Stiche eintragen':
            wiederholungen++
            if (gespeicherterIndex !== undefined) {
                Spieler[gespeicherterIndex].eintragen(sticheInput.value || 0)
            }
            stateInfo.innerHTML = `Wie viele Stiche hat <b>${Player.getName(ErgebnisIndex)}</b> bekommen?`
            sticheInput.style.display = 'block'
            sticheInput.value = ''
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
            Spieler[gespeicherterIndex].eintragen(sticheInput.value || 0)
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

gameWeiterBtn.addEventListener('click', next)