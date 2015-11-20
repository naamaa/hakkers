var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var players = [];
var connections = [];
var availableLicenses = [];
var updateInterval = 50; // milliseconds

var multiplierDecay = 0.999;
var baseMultiplierPerClick = 0.1;
var overloadPerClick = 0.07;
var overloadDecay = 0.2;

var baseBotnetIncome = 2;
var baseUpgradePrices = {
    "botnet": 50
};
var upgradePriceModifier = 1.1;

var standardLicensePrice = 1000;

var initialLotteryAmount = 20000;
var lotteryLength = 300 // in seconds

var minimumScoreForLoan = 50;
var baseLoanMultiplier = 10;
var baseLoansharkTime = 30;


server.listen(1337);
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

console.log("Up and running at port 1337")

function createPlayer(code, nick) {
    players.push({
        code: code,
        nickname: nick,
        isActive: false,
        score: 0,
        overload: 0,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        income: 0,
        upgrades: {
            "botnet": {
                level: 1,
                price: baseUpgradePrices["botnet"]
            }
        },
        licenses: {
            standard: null,
            price: standardLicensePrice
        },
        stats: {
            totalScore: 0,
            highestScore: 0,
            highestMultiplier: 1,
            clicks: 0
        },
        purchasedApps: {
            "main": {
                appId: 0,
                name: "main",
                price: 0,
                level: 1,
                icon: "fa-angle-double-right",
            },
            "store": {
                appId: 66,
                name: "store",
                price: 0,
                level: 1,
                icon: "fa-cart-plus icon",
            },
            "console": {
                appId: 69,
                name: "console",
                price: 100,
                level: 1,
                icon: "fa-list-alt icon",
            },
        },
        appAmount: 2,
        apps: {
            "bankconn": {
                appId: 1,
                name: "bankconn",
                price: 500,
                level: 1,
                icon: "fa-cloud-upload icon",
            },
            "currtransfer": {
                appId: 2,
                name: "currtransfer",
                price: 1000,
                level: 1,
                icon: "fa-database icon",
            },
            "statistics": {
                appId: 4,
                name: "statistics",
                price: 100,
                level: 1,
                icon: "fa-bar-chart icon",
            },
            "renamer": {
                appId: 5,
                name: "renamer",
                price: 50000,
                level: 1,
                icon: "fa-user icon"
            },
            "lottery": {
                appId: 6,
                name: "lottery",
                price: 2000,
                level: 1,
                icon: "fa-ticket icon"
            },
            "scoretracker": {
                appId: 70,
                name: "scoretracker",
                price: 500,
                level: 1,
                icon: "fa-table icon",
            },
            "loanshark": {
                appId: 44,
                name: "loanshark",
                price: 20000,
                level: 1,
                icon: "fa fa-credit-card icon",
                availLoan: 0,
                takenLoan: 0,
                paybackTime: 0,
                paybackMultip: baseLoanMultiplier,
            },
        }
    });
}

var lottery = {
    attendees: [],
    jackpot: initialLotteryAmount,
    timer: lotteryLength,
    round: 1,
    multiplier: 1.5
}

setInterval(function() {
    lottery.timer--;
    if (lottery.timer <= 0) {
        // Lottery has attendees
        if (lottery.attendees.length > 0) {
            var winnerIndex = randomnumber=Math.floor(Math.random()*lottery.attendees.length)
            var winnerCode = lottery.attendees[winnerIndex];
            console.log(winnerIndex)
            var winner = players[findWithCode(players, winnerCode)];
            winner.score += Math.floor(lottery.jackpot * lottery.multiplier);

            var winAmount = Math.floor(lottery.jackpot * lottery.multiplier)
                .toLocaleString()
            var message = "<i class='fa fa-ticket icon'></i>" +
                "You won " + winAmount + " crd in the lottery!";
            broadcastToConsole(message, winner);
        }
        // No attendees, reset lottery
        lottery.attendees = [];
        lottery.jackpot = initialLotteryAmount * ++lottery.round;
        lottery.timer = lotteryLength;
        lottery.multiplier = 1.5;
    }
}, 1000)


// Gametime
// 30min
var gameIsOn = true;
var gameTime = 1800;
var gamewinner = {};
setInterval(function(){
    gameTime--;
    if (gameTime <= 0 && gameIsOn == true){
        var lowest = Number.POSITIVE_INFINITY;
        var highest = Number.NEGATIVE_INFINITY;
        var tmp;
        for (var i=players.length-1; i>=0; i--) {
            tmp = players[i].score;
            if (tmp < lowest){
               lowest = tmp; 
           } 
            if (tmp > highest){
                highest = tmp;
                gamewinner = players[i];
            } 
        }

        /*
            stats: {
            totalScore: 0,
            highestScore: 0,
            highestMultiplier: 1,
            clicks: 0
        },
        */
       var winnername = gamewinner.nickname;
       var winnerscore = Math.floor(gamewinner.score)
       var statTotal = Math.floor(gamewinner.stats.totalScore);
       var statHighest = Math.floor(gamewinner.stats.highestScore);
       var highestMultiplier = Math.floor(gamewinner.stats.highestMultiplier);
       var clicks = gamewinner.stats.clicks;

       console.log("____________________");
       console.log("WINNER IS DECLARED!");
       console.log("Name: " + winnername);
       console.log("Score: " + winnerscore);
       console.log("----STATS:----");
       console.log("Total score: " + statTotal);
       console.log("Highest score: " + statHighest);
       console.log("Highest multiplier: " + highestMultiplier);
       console.log("Clicks:" + clicks);

       gameIsOn = false;
    }
}, 1000)

createPlayer("1234", "Alpha") 
createPlayer("1235", "Beta") 
createPlayer("1236", "Charlie") 
createPlayer("1237", "Delta") 
createPlayer("1238", "EXCURSION") 


for (var i = 100; i < 1000; i++) {
    availableLicenses.push(i.toString());
}

io.on('connection', function(socket) {
    var code = null;
    socket.on('login', function(data) {
        if (findWithCode(players, data.code) == -1) {
            socket.emit('loginError', {
                message: "Wrong login code"
            });
        } else {
            if (findWithCode(connections, data.code) != -1) {
                socket.emit('loginError', {
                    message: "Already logged in"
                });
                return;
            }
            code = data.code;
            connections.push({
                code: data.code,
                socket: socket
            });
            socket.emit('loginSuccess');
            console.log("User logged in :: " + code)
        }
    });

    socket.on('disconnect', function() {
        if (code != null) {
            console.log("User disconnected :: " + code);
            connections.splice(findWithCode(connections, code),
                1);
        }
    });

    socket.on('click', function() {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        player.bonusMultiplier += baseMultiplierPerClick;
        player.isActive = true;
        ++player.stats.clicks;
        player.overload += overloadPerClick *
            randomRange(0.25, 1.25);
    })

    socket.on('purchaseLicense', function() {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        if (player.licenses.standard == null && player.score >=
            standardLicensePrice) {
            var licensecode = createLicenseCode();
            if (licensecode == null) {
                return;
            }
            player.score -= standardLicensePrice;
            player.licenses.standard = licensecode;

            var message = inclAppIcon("bankconn") +
                "Purchased rights to license " + licensecode;
            broadcastToConsole(message, player);
        }
    });

    socket.on('purchaseUpgrade', function(data) {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        var upgrade = player.upgrades[data.upgradeType]
        if (upgrade == null) {
            return;
        }
        if (player.score >= upgrade.price) {
            player.score -= upgrade.price;
            ++upgrade.level;
        }
    });

    socket.on("purchaseApp", function(data) {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        var app = player.apps[data.app];
        if (app == null) {
            return;
        }
        if (player.score >= app.price && !player.purchasedApps[
                app.name]) {
            player.score -= app.price;
            player.purchasedApps[app.name] = app;
            player.appAmount++;
            delete player.apps[data.app];

            var message = inclAppIcon("store") +
                "Purchased an app: " + "<i class='fa " + app.icon +
                "'></i> " + app.name + ".exe";
            broadcastToConsole(message, player)
        }
    })

    socket.on('sendCurrency', function(data) {
        var player = players[findWithCode(players, code)];
        var amount = parseInt(data.amount);
        if (!player) {
            return;
        }
        if (data.license == null || amount <= 0) {
            return;
        }
        var player = players[findWithCode(players, code)];
        if (player.purchasedApps["currtransfer"]) {
            for (var i in players) {
                var target = players[i];
                var license = target.licenses.standard;

                if (data.license == license && data.license !=
                    player.licenses.standard) {
                    if (amount > player.score) {
                        amount = player.score;
                    }
                    player.score -= amount;
                    target.score += amount;
                    target.stats.totalScore += amount;
                    target.licenses.standard = null;
                    availableLicenses.push(data.license)
                    var message = inclAppIcon("currtransfer") +
                        player.nickname + " transferred " +
                        amount + " credits to your account.";
                    broadcastToConsole(message, target)
                }
            }
        }
    });

    socket.on('sendToLottery', function(data) {
        var amount = parseInt(data.amount);
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        if (amount == null || amount <= 0) {
            return;
        }

        if (player.purchasedApps["lottery"]) {
            if (player.score >= amount && amount >= lottery.jackpot *
                0.1) {
                player.score -= amount;
                lottery.jackpot += amount;

                var found = false;
                for (i = 0; i < lottery.attendees.length && !
                    found; i++) {
                    if (lottery.attendees[i] === player.code) {
                        found = true;
                    }
                }
                if (!found) {
                    lottery.attendees.push(player.code);
                    lottery.multiplier += 0.1;
                }
            }
        }
    })

    socket.on("rename", function(data) {
        if (!data.name) {
            return;
        }
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        if (player.purchasedApps["renamer"]) {
            var name = data.name.slice(0, 15);
            var name = name.replace(/<(?:.|\n)*?>/gm, '');
            var message = inclAppIcon("renamer") + player.nickname +
                " renamed to " + data.name;
            player.nickname = name;
            player.apps["renamer"] = player.purchasedApps[
                "renamer"]
            delete player.purchasedApps["renamer"];

            broadcastToConsole(message, player)
        }
    })

    socket.on("loan", function(data) {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        if (player.purchasedApps["loanshark"]) {
            var loanshark = player.purchasedApps["loanshark"];
            if (loanshark.takenLoan > 0) {
                return;
            } else if (player.score < minimumScoreForLoan) {
                var message = inclAppIcon("loanshark") +
                    "You are not credible enough for a loan. Earn some and come back again.";
                broadcastToConsole(message, player)
            } else {
                loanshark.takenLoan = loanshark.availLoan;
                loanshark.paybackTime = baseLoansharkTime;
                player.score += loanshark.takenLoan;

                var message = inclAppIcon("loanshark") +
                    "You took a loan of " + loanshark.takenLoan;
                broadcastToConsole(message, player);

                paybackTimer = setInterval(function() {
                    loanshark.paybackTime--;

                    var selfIndex = findWithCode(
                        connections, player.code);
                    if (selfIndex != -1) {
                        connections[selfIndex].socket.emit(
                            'loanshark', {
                                loanshark: loanshark
                            })
                    };

                    if (loanshark.paybackTime < 1) {
                        var paybackAmount = (loanshark.takenLoan *
                            1);
                        player.score -= paybackAmount;
                        loanshark.takenLoan = 0;
                        loanshark.paybackTime = 0;

                        var message = inclAppIcon(
                                "loanshark") +
                            "Loanshark collected " +
                            paybackAmount +
                            " crd from your account.";
                        broadcastToConsole(message,
                            player);
                        clearInterval(paybackTimer);
                    }
                }, 1000)
            }
        }
    });

    /*
    socket.on("payback", function(data) {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        if (player.purchasedApps["loanshark"] && player.purchasedApps[
                "loanshark"].takenLoan > 0) {
            var loanshark = player.purchasedApps["loanshark"]
            var paybackAmount = (loanshark.takenLoan *
                loanshark.paybackMultip);
            if (player.score >= paybackAmount) {
                player.score -= paybackAmount;
                loanshark.takenLoan = 0;
                loanshark.paybackTime = 0;
                var message = inclAppIcon("loanshark") +
                    "You paid your debt of " + paybackAmount +
                    " crd to the Loanshark.";
                broadcastToConsole(message, player);
                if (!paybackTimer) {
                    console.log("ei löydy timerii");
                } else {
                    clearInterval(paybackTimer);
                }
            }
        }
    })
    */

    function inclAppIcon(app) {
        var player = players[findWithCode(players, code)];
        if (!player) {
            return;
        }
        if (!player.purchasedApps[app]) {
            return;
        }
        return "<i class='fa " + player.purchasedApps[app].icon +
            "'></i>";
    }
});


// Handle basic game logic
setInterval(function() {
    for (var i in players) {
        var player = players[i];
        if (player.nickname == null) {
            continue;
        }
        var deltaTime = updateInterval / 1000;

        // Update player score multiplier
        player.bonusMultiplier *= multiplierDecay;
        var multiplier = player.baseMultiplier + player.bonusMultiplier;
        if (multiplier > player.stats.highestMultiplier) {
            player.stats.highestMultiplier = multiplier;
        }

        // Calculate score tick and increment player score
        var scoreTick = calculateBotnetIncome(player.upgrades["botnet"]
            .level);
        scoreTick *= deltaTime * multiplier;

        if (!player.isActive) {
            scoreTick = 0;
        }

        player.score += scoreTick;
        player.stats.totalScore += scoreTick;
        player.income = scoreTick / deltaTime;
        if (player.score > player.stats.highestScore) {
            player.stats.highestScore = player.score;
        }

        // Handle overload
        player.overload = Math.max(0, player.overload -
            overloadDecay * deltaTime);

        if (player.overload > 1.0) {
            player.overload = 0;
            player.bonusMultiplier = 0;
        }

        // Calculate upgrade prices (shouldn't really be done here)
        for (var key in player.upgrades) {
            var upgrade = player.upgrades[key];
            upgrade.price = calculateUpgradePrice(
                baseUpgradePrices[key],
                upgrade.level);
        }

        // If player owns loanshark.exe, do the math
        if (player.purchasedApps["loanshark"]) {
            var loanshark = player.purchasedApps["loanshark"];
            if (player.score < minimumScoreForLoan) {
                loanshark.availLoan = "---";
            } else {
                loanshark.availLoan = Math.floor(player.score *
                    loanshark.paybackMultip);
            }
        }

        // Send player data to the client if player is online
        var selfIndex = findWithCode(connections, player.code);
        if (selfIndex != -1) {
            connections[selfIndex].socket.emit('updateSelf', {
                nickname: player.nickname,
                score: player.score,
                baseMultiplier: player.baseMultiplier,
                bonusMultiplier: player.bonusMultiplier,
                overload: player.overload,
                income: player.income,
                upgrades: player.upgrades,
                licenses: player.licenses,
                stats: player.stats,
                purchasedApps: player.purchasedApps,
                apps: player.apps,
            });
        };
    }
}, updateInterval);

// Store updater
setInterval(function() {
    for (var i in players) {
        var player = players[i];
        if (player.nickname == null) {
            continue;
        }
        var selfIndex = findWithCode(connections, player.code);
        if (selfIndex != -1) {
            connections[selfIndex].socket.emit('updateSelfStore', {
                apps: player.apps
            });
        };
    }
}, 500)

// Broadcast all relevant global state to all players
setInterval(function() {
    var scores = [];
    for (var i in players) {
        var player = players[i];
        if (player.nickname == null) {
            continue;
        }
        scores.push({
            nickname: player.nickname,
            score: player.score,
            licenses: player.licenses
        })
    }
    for (var i in connections) {
        var connection = connections[i];
        connection.socket.emit('updateScores', {
            scores: scores
        })
        connection.socket.emit('lottery', {
            lottery: lottery
        });
    }
}, 500);

// Helper functions
function findWithCode(from, code) {
    for (var i = 0; i < from.length; i++) {
        if (from[i].code == code) {
            return i;
        }
    }
    return -1;
}

function broadcastToConsole(message, target, sender) {
    if (target.purchasedApps["console"]) {
        var selfIndex = findWithCode(connections, target.code);
        if (selfIndex != -1) {
            connections[selfIndex].socket.emit('consoleMsg', {
                msg: message
            });
        };
    }
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function createLicenseCode() {
    if (availableLicenses.length == 0) {
        return null;
    }
    var index = randomInt(availableLicenses.length)
    var license = availableLicenses[index];
    availableLicenses.splice(index, 1);
    return license;
}

function calculateUpgradePrice(base, level) {
    if (level <= 0) {
        return 0;
    } else if (level == 1) {
        return base;
    } else {
        var price = base * 2 * Math.pow(1.5, level - 2);
        return Math.round(price / 50) * 50;
    }
}

function calculateBotnetIncome(level) {
    var baseMod = Math.floor(level / 10);
    return baseBotnetIncome * level * Math.pow(4, baseMod);
}
