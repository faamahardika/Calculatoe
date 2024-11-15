import { db } from '../config/firebase.js';
import { auth } from '../config/firebase.js';
import { doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

const board = Array(9).fill(null);
const players = ['X', 'O'];
const playerWinSound = new Audio('assets/sounds/player win.wav');
const botWinSound = new Audio('assets/sounds/bot win.wav');
const tieSound = new Audio('assets/sounds/tie.wav');
const markSound = new Audio('assets/sounds/mark.wav');
const descriptionElement = document.getElementById('game-description');
let currentPlayer = 0;
let isVsBot = false;
let botDifficulty = 'medium';
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
let isGameActive = true;

const cells = document.querySelectorAll('.cell');
const playerDisplay = document.querySelector('.display-player');
const announcer = document.querySelector('.announcer');
const modeSelection = document.getElementById('mode-selection');
const gameBoard = document.getElementById('game-board');
const resetButton = document.getElementById('reset-button');
const displaySection = document.querySelector('.display');

// Fungsi untuk mendapatkan soal matematika
function getRandomMathQuestion() {
    const typesOfQuestions = ['limit', 'derivative', 'arithmetic', 'integral', 'quadratic'];
    const randomType = typesOfQuestions[Math.floor(Math.random() * typesOfQuestions.length)];

    let equation, answer, type;

    switch (randomType) {
        case 'limit':
            const a = Math.floor(Math.random() * 10) - 5;  // approach value (-5 to 4)
            let b, c, d;
            const limitTypes = ['polynomial', 'fraction'];
            const limitType = limitTypes[Math.floor(Math.random() * limitTypes.length)];

            if (limitType === 'polynomial') {
                // For polynomial, ensure b and c create a valid result
                const power = Math.floor(Math.random() * 3) + 1; // 1 to 3
                b = Math.floor(Math.random() * 5) + 1;  // Random from 1 to 5
                c = Math.floor(Math.random() * 5) - 2;  // Random from -2 to 2
                equation = `lim(x→${a}) (${b}x^${power} + ${c}x)`;

                // Calculate the answer properly by evaluating limit
                answer = (b * Math.pow(a, power) + c * a).toString();
            } else {
                // For fraction, ensure the denominator isn't always -1
                let desiredAnswer = Math.floor(Math.random() * 19) - 9; // -9 to 9 (non-zero)
                while (desiredAnswer === 0) {
                    desiredAnswer = Math.floor(Math.random() * 19) - 9;
                }

                b = Math.floor(Math.random() * 5) + 1; // b from 1 to 5
                d = Math.floor(Math.random() * 10) - 5; // Random denominator shift (-5 to 4)
                while (d === 0 || d === a) {
                    d = Math.floor(Math.random() * 10) - 5; // Avoid zero or a clash with 'a'
                }

                c = desiredAnswer * (a - d) - b * a; // Calculate c for desired result
                equation = `lim(x→${a}) (${b}x + ${c})/(x - ${d})`;
                answer = desiredAnswer.toString();
            }
            break;

         case 'derivative':
            const derCoef = Math.floor(Math.random() * 10) + 1;
            const derExp = Math.floor(Math.random() * 4) + 2;  // starts from 2 to avoid ^1
            equation = `d/dx ${derCoef}x^${derExp}`;
            const resultCoef = derCoef * derExp;
            const resultExp = derExp - 1;
                
                // If resulting exponent is 1, don't show ^1
            answer = resultExp === 1 ? `${resultCoef}x` : `${resultCoef}x^${resultExp}`;
            break;

        case 'arithmetic':
            const firstTerm = Math.floor(Math.random() * 20) - 10;
            const diff = Math.floor(Math.random() * 10) - 5;
            const n = Math.floor(Math.random() * 10) + 1;
            equation = `In arithmetic sequence with a=${firstTerm} and d=${diff}, find U${n}`;
            answer = (firstTerm + (n-1) * diff).toString();
            break;

        case 'integral':
            const intCoef = Math.floor(Math.random() * 10) + 1;
            const intExp = Math.floor(Math.random() * 4) + 1;
            // Format the equation differently if coefficient is 1
            equation = intCoef === 1 ? 
                `∫x^${intExp} dx` : 
                `∫${intCoef}x^${intExp} dx`;
            const newExp = intExp + 1;
        
            if (newExp === 0) {
                answer = `${intCoef}x + C`;
            } else {
                const newCoef = intCoef/(intExp + 1);
                // Check if coefficient is a whole number
                if (Number.isInteger(newCoef)) {
                    // If coefficient is 1, don't show it
                    answer = newCoef === 1 ? `x^${newExp} + C` : `${newCoef}x^${newExp} + C`;                    } else {
                    answer = `(${intCoef}/${newExp})x^${newExp} + C`;
                }
            }
            break;

        case 'quadratic':
            // Generate roots first
            let root1 = Math.floor(Math.random() * 10) - 5; // first root between -5 and 4
            let root2 = Math.floor(Math.random() * 10) - 5; // second root between -5 and 4
        
            // Ensure roots are different
            while (root2 === root1) {
                root2 = Math.floor(Math.random() * 10) - 5;
            }
            
            // Generate coefficients based on roots
            let p = Math.floor(Math.random() * 3) + 1; // coefficient of x² (1 to 3)
            let q = -p * (root1 + root2); // coefficient of x
            let r = p * root1 * root2; // constant term
            
            // Format the equation string
            let pTerm = p === 1 ? 'x²' : `${p}x²`; // Only show coefficient if it's not 1
            let qTerm = q >= 0 ? `+ ${q}` : `${q}`; // Handle positive/negative for b
            let rTerm = r >= 0 ? `+ ${r}` : `${r}`; // Handle positive/negative for c
            
            equation = `${pTerm} ${qTerm}x ${rTerm} = 0`;
            answer = [root1.toString(), root2.toString()]; // Store both roots as strings
            type = 'quadratic';
            break;
        }

    return {
        equation: equation,
        answer: answer,
        type: randomType // Adding type to help identify quadratic questions
    };
}

let mathBoard = Array.from({ length: 9 }, () => getRandomMathQuestion());

function setGameMode(mode) {
    isVsBot = mode === 'bot';
    modeSelection.classList.add('hide');
    descriptionElement.classList.add('hide');

    if (isVsBot) {
        document.getElementById('bot-difficulty').classList.remove('hide');
    } else {
        document.getElementById('bot-difficulty').classList.add('hide');
    }
    
    displaySection.classList.remove('hide');
    gameBoard.classList.remove('hide');
    resetButton.classList.remove('hide');
    resetGame();
    render();
}

function render() {
    cells.forEach((cell, i) => {
        if (board[i]) {
            cell.textContent = board[i];
            if (isVsBot && board[i] === 'O') {
                cell.className = 'cell tile bot-o';
            } else {
                cell.className = `cell tile ${board[i] === 'X' ? 'x' : 'o'}`;
            }
        } else {
            cell.textContent = mathBoard[i].equation; // Show math question if cell is empty
            cell.className = 'cell tile'; // Reset class for empty cells
        }
    });
    
    // Update player display
    if (isVsBot && currentPlayer === 1) {
        playerDisplay.className = 'display-player bot-turn';
        playerDisplay.innerHTML = "Bot's turn";
    } else {
        playerDisplay.className = `display-player player${players[currentPlayer]}`;
        playerDisplay.innerHTML = `Player ${players[currentPlayer]}'s turn`;
    }
}

function checkWinner() {
    for (let [a, b, c] of winningCombinations) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
}

function isBoardFull() {
    return board.every(cell => cell !== null);
}

function handleClick(e) {
    const index = e.target.dataset.index;

    if (board[index] || !isGameActive || (isVsBot && currentPlayer === 1)) return;

    // Prepare the question text based on the type
    let questionText = mathBoard[index].equation;
    if (mathBoard[index].type === 'integral') {
        questionText = `Solve: ${mathBoard[index].equation}\nHint: Don't forget the constant of integration!\nExample: x^3 + C`;
    } else {
        questionText = `Solve: ${mathBoard[index].equation}`;
    }

    Swal.fire({
        title: `Player ${players[currentPlayer]}`,
        text: questionText,html: questionText.replace(/\n/g, '<br>'),
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off',
            autocomplete: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Submit',
        preConfirm: (inputValue) => {
            if (!inputValue) {
                Swal.showValidationMessage('Answer cannot be empty!');
            }
            return inputValue;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const userAnswer = result.value.trim();

            if (mathBoard[index].type === 'quadratic') {
                if (userAnswer === mathBoard[index].answer[0].toString() || 
                    userAnswer === mathBoard[index].answer[1].toString()) {
                    // Correct answer handling
                    board[index] = players[currentPlayer];
                    markSound.play();
                    render();

                    if (checkWinner()) {
                        isGameActive = false;
                        playerWinSound.play();
                        updatePlayerWins(botDifficulty);

                        Swal.fire ({
                            title: `Player ${players[currentPlayer]} wins!`,
                            imageUrl: 'assets/images/player win.gif',
                            imageWidth: 400,
                            imageHeight: 200,
                            imageAlt: 'Win celebration',
                            showConfirmButton: true,
                            confirmButtonText: 'OK'
                        }).then(() => resetGame());
                    } else if (isBoardFull()) {
                        isGameActive = false;
                        tieSound.play();
                        Swal.fire({
                            title: "It's a tie!",
                            imageUrl: 'assets/images/tie.gif',
                            imageWidth: 400,
                            imageHeight: 200,
                            imageAlt: 'Tie reaction',
                            showConfirmButton: true,
                            confirmButtonText: 'OK'
                        }).then(() => resetGame());
                    } else {
                        currentPlayer = 1 - currentPlayer;
                        render();

                        if (isVsBot && currentPlayer === 1) {
                            setTimeout(botMove, 1000);
                        }
                    }
                } else {
                    Swal.fire('Wrong answer!', 'Next player\'s turn.', 'error');
                    currentPlayer = 1 - currentPlayer;
                    render();

                    if (isVsBot && currentPlayer === 1) {
                        botMove();
                    }
                }
            } else {
                if (userAnswer === mathBoard[index].answer) {
                    board[index] = players[currentPlayer];
                    markSound.play();
                    render();

                    if (checkWinner()) {
                        isGameActive = false;
                        playerWinSound.play();
                        updatePlayerWins(botDifficulty);
                        
                        Swal.fire({
                            title: `Player ${players[currentPlayer]} wins!`,
                            imageUrl: 'assets/images/player win.gif',
                            imageWidth: 400,
                            imageHeight: 200,
                            imageAlt: 'Win celebration',
                            showConfirmButton: true,
                            confirmButtonText: 'OK'
                        }).then(() => resetGame());
                    } else if (isBoardFull()) {
                        isGameActive = false;
                        tieSound.play();
                        Swal.fire({
                            title: "It's a tie!",
                            imageUrl: 'assets/images/tie.gif',
                            imageWidth: 400,
                            imageHeight: 200,
                            imageAlt: 'Tie reaction',
                            showConfirmButton: true,
                            confirmButtonText: 'OK'
                        }).then(() => resetGame());
                    } else {
                        currentPlayer = 1 - currentPlayer;
                        render();

                        if (isVsBot && currentPlayer === 1) {
                            setTimeout(botMove, 1000);
                        }
                    }
                } else {
                    Swal.fire('Wrong answer!', 'Next player\'s turn.', 'error');
                    currentPlayer = 1 - currentPlayer;
                    render();

                    if (isVsBot && currentPlayer === 1) {
                        botMove();
                    }
                }
            }
        }
    });
}

function easyBotMove() {
    let availableCells = board
        .map((value, index) => value === null ? index : null)
        .filter(value => value !== null);

    const randomIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[randomIndex];
}

function mediumBotMove() {
    // Check if bot can win in the next move
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = players[1]; // Assume bot's move
            if (checkWinner()) {
                board[i] = null; // Undo the move
                return i;
            }
            board[i] = null; // Undo the move
        }
    }

    // Check if player can win in the next move and block
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = players[0]; // Assume player's move
            if (checkWinner()) {
                board[i] = null; // Undo the move
                return i;
            }
            board[i] = null; // Undo the move
        }
    }

    // If no winning move, play randomly
    return easyBotMove();
}

function hardBotMove() {
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = players[1]; // Bot's move
            let score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing) {
    let result = checkGameEnd(board);
    if (result !== null) {
        return result / (depth + 1); // Divide by depth to prefer quicker wins
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = players[1]; // Bot's move
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = players[0]; // Player's move
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkGameEnd(board) {
    for (let [a, b, c] of winningCombinations) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] === players[1] ? 10 : -10;
        }
    }
    if (board.every(cell => cell !== null)) {
        return 0; // It's a tie
    }
    return null; // Game is not over
}

function botMove() {
    if (!isGameActive) return;

    // Update display to show it's the bot's turn
    playerDisplay.className = 'display-player bot-turn';
    playerDisplay.innerHTML = "Bot's turn";

    // Add a delay before the bot makes its move
    setTimeout(() => {
        let cellIndex;
        switch (botDifficulty) {
            case 'easy':
                cellIndex = easyBotMove();
                break;
            case 'medium':
                cellIndex = mediumBotMove();
                break;
            case 'hard':
                cellIndex = hardBotMove();
                break;
            default:
                cellIndex = mediumBotMove();
        }

        if (cellIndex !== undefined && board[cellIndex] === null) {
            board[cellIndex] = players[currentPlayer];
            markSound.play(); // Play the sound effect for marking
            render();

            if (checkWinner()) {
                isGameActive = false;
                botWinSound.play();
                Swal.fire({
                    title: 'Bot wins!',
                    imageUrl: 'assets/images/bot win.gif',
                    imageWidth: 400,
                    imageHeight: 200,
                    imageAlt: 'Lose reaction',
                    showConfirmButton: true,
                    confirmButtonText: 'OK'
                }).then(() => resetGame());
            } else if (isBoardFull()) {
                isGameActive = false;
                tieSound.play();
                Swal.fire({
                    title: "It's a tie!",
                    imageUrl: 'assets/images/tie.gif',
                    imageWidth: 400,
                    imageHeight: 200,
                    imageAlt: 'Tie reaction',
                    showConfirmButton: true,
                    confirmButtonText: 'OK'
                }).then(() => resetGame());
            } else {
                currentPlayer = 1 - currentPlayer;
                render();
            }
        }
    }, 1500); // 1.5 second delay before bot makes its move
}

function resetGame() {
    board.fill(null);
    currentPlayer = 0;
    mathBoard = Array.from({ length: 9 }, () => getRandomMathQuestion());
    isGameActive = true;
    announcer.classList.add('hide');
    render(); // Replace playerDisplay.innerHTML with this
}

function showHomePage() {
    modeSelection.classList.remove('hide');
    displaySection.classList.add('hide');   
    gameBoard.classList.add('hide');       
    resetButton.classList.add('hide');      
    announcer.classList.add('hide');    
    descriptionElement.classList.remove('hide'); 
    
    // Hide the bot difficulty section
    document.getElementById('bot-difficulty').classList.add('hide');
    
    resetGame();
}

async function showPlayerStats() {
    const user = auth.currentUser ;

    try {
        const userDocRef = doc(db, 'playerStats', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            Swal.fire({
                title: 'Your Game Stats',
                html: `
                    <div class="stats-popup">
                        <p><strong>Easy Wins:</strong> ${data.easy || 0}</p>
                        <p><strong>Medium Wins:</strong> ${data.medium || 0}</p>
                        <p><strong>Hard Wins:</strong> ${data.hard || 0}</p>
                        <p><strong>Total Wins:</strong> ${data.total || 0}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Close'
            });
        } else {
            Swal.fire({
                title: 'Your Game Stats',
                html: `
                    <div class="stats-popup">
                        <p>No stats available yet. Start playing to track your progress!</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Close'
            });
        }
    } catch (error) {
        console.error("Error fetching player stats:", error);
        Swal.fire('Error', 'Could not retrieve stats', 'error');
    }
}

async function updatePlayerWins(botDifficulty) {
    const user = auth.currentUser;
    if (!user) return; // Exit if no user is logged in

    try {
        const userDocRef = doc(db, 'playerStats', user.uid);
        
        // Check if user document exists, if not, create it
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                easy: 0,
                medium: 0,
                hard: 0,
                total: 0
            });
        }

        // Update wins based on difficulty
        await updateDoc(userDocRef, {
            [`${botDifficulty}`]: increment(1),
            total: increment(1)
        });

        console.log(`Win recorded for ${botDifficulty} difficulty`);
    } catch (error) {
        console.error("Error updating player wins:", error);
    }
}
export { updatePlayerWins, showPlayerStats };
cells.forEach(cell => cell.addEventListener('click', handleClick));

document.getElementById('player-vs-player').addEventListener('click', () => setGameMode('player'));
document.getElementById('player-vs-bot').addEventListener('click', () => setGameMode('bot'));
document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    showHomePage();
});
document.getElementById('difficulty-select').addEventListener('change', function() {
    botDifficulty = this.value;
    resetGame();
});
render();