'use strict';

var items = {};
items['ion cannon'] = {
    dice: 1,
    damage: 1,
    energy: -1
};
items['plasma cannon'] = {
    dice: 1,
    damage: 2,
    energy: -2,
    cost_max: 6,
    cost_min: 4
};
items['antimatter cannon'] = {
    dice: 1,
    damage: 4,
    energy: -4,
    cost_max: 14,
    cost_min: 7
};
items['plasma missle'] = {
    dice: 2,
    damage: 2,
    cost_max: 14,
    cost_min: 7,
    shoot_once: true
};

items['electron computer'] = {
    computer: 1
};
items['positron computer'] = {
    computer: 2,
    influence: 1,
    energy: -1,
    cost_max: 8,
    cost_min: 5
};
items['gluon computer'] = {
    computer: 3,
    influence: 2,
    energy: -2,
    cost_max: 16,
    cost_min: 8
};

items['nuclear source'] = {
    energy: 3
};
items['fusion source'] = {
    energy: 6,
    cost_max: 6,
    cost_min: 4
};
items['tachyon source'] = {
    energy: 9,
    cost_max: 12,
    cost_min: 6
};

items['nuclear drive'] = {
    energy: -1,
    influence: 1,
    speed: 1
};
items['fusion drive'] = {
    energy: -2,
    influence: 2,
    cost_max: 4,
    cost_min: 3,
    speed: 2
};
items['tachyon drive'] = {
    energy: -3,
    influence: 3,
    cost_max: 12,
    cost_min: 6,
    speed: 3
};

items['hull'] = {
    hull: 1
};
items['improved hull'] = {
    hull: 2,
    cost_max: 4,
    cost_min: 3
};
items['gauss shield'] = {
    shield: 1,
    cost_max: 2,
    cost_min: 2
};
items['phase shield'] = {
    shield: 2,
    energy: -1,
    cost_max: 8,
    cost_min: 5
};

items['influence_1'] = {
    influence: 1,
    upgradeable: false
};
items['influence_2'] = {
    influence: 2,
    upgradeable: false
};
items['influence_3'] = {
    influence: 2,
    upgradeable: false
};
items['influence_4'] = {
    influence: 2,
    upgradeable: false
};

// Include the object name inside the object
// for when we output the results
for (var n in items) {
    items[n]['name'] = n;
}


var alien = [];
alien.push(items['ion cannon']);
alien.push(items['ion cannon']);
alien.push(items['electron computer']);
alien.push(items['hull']);
alien.push(items['influence_2']);
// technically not on the board, but not a valid ship without
alien.push(items['nuclear drive']);
alien.push(items['nuclear source']);

var interceptor = [];
interceptor.push({});
interceptor.push(items['ion cannon']);
interceptor.push(items['nuclear source']);
interceptor.push(items['nuclear drive']);
interceptor.push(items['influence_2']);

var cruiser = [];
cruiser.push({});
cruiser.push(items['ion cannon']);
cruiser.push(items['hull']);
cruiser.push(items['electron computer']);
cruiser.push(items['nuclear source']);
cruiser.push(items['nuclear drive']);
cruiser.push(items['influence_1']);

var dreadnought = [];
dreadnought.push({});
dreadnought.push(items['ion cannon']);
dreadnought.push(items['ion cannon']);
dreadnought.push(items['hull']);
dreadnought.push(items['hull']);
dreadnought.push(items['electron computer']);
dreadnought.push(items['nuclear source']);
dreadnought.push(items['nuclear drive']);

function validShip(ship) {
    function tally(ship, name) {
        var total = 0;
        for (var item in ship) {
            total += (ship[item][name] || 0);
        }
        return total;
    }
    if ((tally(ship, 'energy') < 0)
     || (tally(ship, 'speed') < 1)
     || (tally(ship, 'dice') < 1))
        return false;
    return true;
}


function rollDie() {
    var min = 1;
    var max = 6;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// TODO currently if a dice is a hit
// we simply assign it damage to the first valid
// ship rather than optimally distributing the dice
// which can matter is multi-ship battles.
function execBattle(ships) {
    for (var ship in ships) {
        ships[ship].hit = 0;
    }

    function attack(attackingShip, roll, damage) {
        if (roll === 1)
            return;

        function hit(ship) {
            ship.hit += damage;
            //console.log('hit: ' + ship.side + ' got a hit of ' + damage);
        }

        var computer = attackingShip['computer'];
        var side = attackingShip.side;
        var ahit = false;
        for (var ship in ships) {
            if (ships[ship].side === side)
                continue;
            if ((ships[ship].hull - ships[ship].hit) < 0)
                continue;
            if (roll === 6) {
                ahit = true;
                hit(ships[ship]);
            } else {
                var shield = ships[ship].shield;
                if (roll + computer - shield >= 6) {
                    ahit = true;
                    hit(ships[ship]);
                }
            }
            //if ((ships[ship].hull - ships[ship].hit) < 0)
            //    console.log(ships[ship].side + ' destroyed by ' + side + ' ' + damage + ' ' + roll);
            if (ahit)
                break;
        }
        //console.log('attack: ' + side + ' ' + roll + ' ' + damage + ' ' + computer + ' ' + ahit);
    }

    function rollDice(shoot_once) {
        for (var ship in ships) {
            if ((ships[ship].hull - ships[ship].hit) < 0)
                continue;
            for (var item in ships[ship]) {
                var once = (ships[ship][item]['shoot_once'] || false);
                if (once !== shoot_once)
                    continue;
                var dice = ships[ship][item]['dice'] || 0;
                while (dice > 0) {
                    var roll = rollDie();
                    attack(ships[ship], roll, ships[ship][item]['damage'] || 0);
                    dice--;
                }
            }
        }
    }

    function countUp() {
        ac = 0;
        bc = 0;
        for (var ship in ships) {
            if ((ships[ship].hull - ships[ship].hit) < 0)
                continue;
            if (ships[ship].side === 'a')
                ac++;
            if (ships[ship].side === 'b')
                bc++;
        }
    }
    var ac = 0;
    var bc = 0;
    countUp();
    var initialbc = bc;

    rollDice(true);
    do {
        rollDice(false);
        countUp();
    } while (ac > 0 && bc > 0);
    //console.log((ac > 0 ? 'a' : 'b') + ' won');
    return bc > 0 && bc === initialbc;
}

function battle(playerA, playerB) {
    // Tag the ships and put into one list sorted by influence
    for (var ship in playerA)
        playerA[ship].side = 'a';
    for (var ship in playerB)
        playerB[ship].side = 'b';
    var ships = [].concat(playerA, playerB);
    ships.sort(function(a, b) { return a['influence'] < b['influence']; });

    for (var ship in ships) {
        if (!validShip(ships[ship])) {
            console.warn('Not a valid ship');
            return 0;
        }
    }

    // Total up the ship's capabilities before fighting
    function tally(name) {
        for (var ship in ships) {
            var total = 0;
            for (var item in ships[ship]) {
                total += (ships[ship][item][name] || 0);
            }
            ships[ship][name] = total;
        }
    }
    tally('hull');
    tally('computer');
    tally('shield');
    tally('influence');

    var wins = 0;
    for (var i = 0; i < max_tries; ++i) {
        wins += execBattle(ships);
    }
    return 100 * (wins/max_tries);
}

function allValidShipCombinations(numberOfSpaces) {
    // Return an array of all combinations of
    // 'setSize' from the array 'from'
    function combinationsWithRepetition(setSize, from) {
        function _internal(setSize, got, pos, from) {
            if (got.length === setSize) {
                return [got.slice(0)];
            }
            var result = [];
            var length = from.length;
            for (var i = pos; i < length; ++i) {
                got.push(from[i]);
                result = result.concat(_internal(setSize, got, i, from));
                got.pop();
            }
            return result;
        }
        return _internal(setSize, [], 0, from);
    }

    // Make up a list of only upgradeable parts
    var itemsArray = [];
    for (var name in items) {
        if (items[name]['upgradeable'] === false)
            continue;
        if ((items[name]['cost_max'] || 0) > max_cost)
            continue;
        itemsArray.push(items[name]);
    }
    var all = combinationsWithRepetition(numberOfSpaces, itemsArray);

    all = all.filter(validShip);

    function researchShip(ship) {
        var c = countResearch(ship);
         if (c > max_research)
            return false;
        return true;
    }

    return all.filter(researchShip);
}

function countResearch(ship) {
    var research = {};
    for (var i = 0; i < ship.length; ++i) {
        if (ship[i]['cost_max'])
            research[ship[i]['name']] = 1;
    }
    var c = 0;
    for (var r in research)
        c++;
    return c;
}

function countCost(ship) {
    var research = {};
    for (var i = 0; i < ship.length; ++i) {
        if (ship[i]['cost_max'])
            research[ship[i]['name']] = ship[i]['cost_max'] || 0;
    }
    var c = 0;
    for (var r in research)
        c += research[r];
    return c;
}

function countUpgrades(stock, ship) {
    var c = 0;
    var stockCopy= stock.slice();
    for (var i = 0; i < ship.length; ++i) {
        var name = ship[i]['name'];
        ship[i]['upgraded'] = true;
        for (var j = 0; j < stock.length; ++j) {
            if (stockCopy[j]['name'] === name) {
                stockCopy[j] = {};
                ship[i]['upgraded'] = false;
                ++c;
                break;
            }
        }
    }
    return stock.length - c;
}

function test_ship(stock) {
    var base = [];
    for (var i = 0; i < stock.length; ++i) {
        if (stock[i]['upgradeable'] === false)
            base.push(stock[i]);
    }
    var size = stock.length - base.length;

    var all = allValidShipCombinations(size);
    var results = {};
    for (var offset in all) {
        var ship = all[offset];
        ship = ship.concat(base);
        var defense = [];
        for (var i = 0; i < max_ships; ++i) {
            defense.push(ship);
        }
        var r = battle(offense, defense);
        r = Math.floor(r);
        r += 1/(offset+1);
        var tname = '';
        var research = countResearch(ship);
        var upgrades = countUpgrades(stock, ship);
        var cost = countCost(ship);
        for (var i = 0; i < ship.length; ++i) {
            var name = ship[i]['name'];
            if (ship[i]['upgraded'])
                name = name.toUpperCase();
            tname += name + ', ';
        }
        results[r] = 'Upgrades: ' + upgrades + ' Cost:' + cost + ' Research:' + research + ' boxes:' + tname;
    }
    console.log(results);

    var best = 0;
    var bestShip;
    for (var ship in results) {
        if (parseInt(ship, 10) > best) {
            best = ship;
            bestShip = results[best];
        }
    }
    return best + '% ' + bestShip;
}

function test_interceptor() {
    return test_ship(interceptor);
}

function test_cruiser () {
    return test_ship(cruiser);
}

function test_dreadnought() {
    return test_ship(dreadnought);
}

var offense = [alien];
var max_tries = 200;
var max_research = 1;
var max_cost = 10;
var max_ships = 1;