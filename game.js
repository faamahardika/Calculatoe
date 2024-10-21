const board = Array(9).fill(null);
const players = ['X', 'O'];
let currentPlayer = 0;
let isVsBot = false;
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
    const typesOfQuestions = ['simpleQuadratic', 'multiplication', 'addition', 'subtraction'];
    const randomType = typesOfQuestions[Math.floor(Math.random() * typesOfQuestions.length)];

    let equation, answer;

    switch (randomType) {
        case 'simpleQuadratic':
            let a = Math.floor(Math.random() * 5) + 1;
            let root1 = Math.floor(Math.random() * 10) + 1;
            let root2 = Math.floor(Math.random() * 10) + 1;
            let b = -a * (root1 + root2);
            let c = a * root1 * root2;
            equation = `${a}x^2 + ${b}x + ${c} = 0, find x`;
            answer = root1 || root2;
            break;
        case 'multiplication':
            let num1 = Math.floor(Math.random() * 12) + 1;
            let num2 = Math.floor(Math.random() * 12) + 1;
            equation = `${num1} * ${num2} = ?`;
            answer = num1 * num2;
            break;
        case 'addition':
            let add1 = Math.floor(Math.random() * 100) + 1;
            let add2 = Math.floor(Math.random() * 100) + 1;
            equation = `${add1} + ${add2} = ?`;
            answer = add1 + add2;
            break;
        case 'subtraction':
            let sub1 = Math.floor(Math.random() * 100) + 1;
            let sub2 = Math.floor(Math.random() * 100) + 1;
            equation = `${Math.max(sub1, sub2)} - ${Math.min(sub1, sub2)} = ?`;
            answer = Math.max(sub1, sub2) - Math.min(sub1, sub2);
            break;
    }

    return {
        equation: equation,
        answer: answer.toString()
    };
}

let mathBoard = Array.from({ length: 9 }, () => getRandomMathQuestion());

function setGameMode(mode) {
    isVsBot = mode === 'bot';
    modeSelection.classList.add('hide');
    displaySection.classList.remove('hide');
    gameBoard.classList.remove('hide');
    resetButton.classList.remove('hide');
    resetGame();
}

function render() {
    cells.forEach((cell, i) => {
        if (board[i]) {
            cell.textContent = board[i];
            cell.className = `cell tile ${board[i] === 'X' ? 'x' : 'o'}`; // Apply class based on player
        } else {
            cell.textContent = mathBoard[i].equation; // Show math question if cell is empty
            cell.className = 'cell tile'; // Reset class for empty cells
        }
    });
    
    // Update player display color
    if (currentPlayer === 0) {
        playerDisplay.innerHTML = `Player X's turn`;
        playerDisplay.style.color = '#09C372'; // Green for X
    } else {
        playerDisplay.innerHTML = `Player O's turn`;
        playerDisplay.style.color = '#FF3860'; // Red for O
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

    if (board[index] || !isGameActive) return; // Prevent clicking on filled cells

    Swal.fire({
        title: `Player ${players[currentPlayer]}`,
        text: `Solve: ${mathBoard[index].equation}`,
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
            const userAnswer = result.value;

            if (userAnswer === mathBoard[index].answer) {
                // Correct answer, mark cell with current player's symbol
                board[index] = players[currentPlayer];
                render();

                if (checkWinner()) {
                    isGameActive = false;
                    Swal.fire({
                        icon: 'success',
                        title: `Player ${players[currentPlayer]} wins!`,
                        showConfirmButton: true,
                        confirmButtonText: 'OK'
                    }).then(() => resetGame());
                } else if (isBoardFull()) {
                    isGameActive = false;
                    Swal.fire({
                        icon: 'info',
                        title: "It's a tie!",
                        showConfirmButton: true,
                        confirmButtonText: 'OK'
                    }).then(() => resetGame());
                } else {
                    // Switch to next player
                    currentPlayer = 1 - currentPlayer;
                    render(); // Call render to update player display color
                }
            } else {
                // Wrong answer, switch to next player
                Swal.fire('Wrong answer!', 'Next player\'s turn.', 'error');
                currentPlayer = 1 - currentPlayer;
                render(); // Call render to update player display color
            }
        }
    });
}

function botMove() {
    let availableCells = board
        .map((value, index) => value === null ? index : null)
        .filter(value => value !== null);

    if (availableCells.length === 0) return; // Jika tidak ada cell kosong, berhenti

    const botAnswer = mathBoard[availableCells[0]].answer; // Bot otomatis benar
    board[availableCells[0]] = players[currentPlayer]; // Isi cell dengan simbol bot
    render();

    if (checkWinner()) {
        isGameActive = false;
        Swal.fire({
            icon: 'success',
            title: `Player ${players[currentPlayer]} wins!`,
            showConfirmButton: true,
            confirmButtonText: 'OK'
        }).then(() => resetGame());
    } else if (isBoardFull()) {
        isGameActive = false;
        Swal.fire({
            icon: 'info',
            title: "It's a tie!",
            showConfirmButton: true,
            confirmButtonText: 'OK'
        }).then(() => resetGame());
    } else {
        // Ganti giliran ke pemain
        currentPlayer = 1 - currentPlayer;
        playerDisplay.innerHTML = `Player ${players[currentPlayer]}'s turn`;
    }
}

function resetGame() {
    board.fill(null);
    currentPlayer = 0;
    mathBoard = Array.from({ length: 9 }, () => getRandomMathQuestion());
    isGameActive = true;
    announcer.classList.add('hide');
    playerDisplay.innerHTML = `Player ${players[currentPlayer]}'s turn`;
    render();
}

function showHomePage() {
    modeSelection.classList.remove('hide');
    displaySection.classList.add('hide');   
    gameBoard.classList.add('hide');       
    resetButton.classList.add('hide');      
    announcer.classList.add('hide');     
    resetGame();
}

cells.forEach(cell => cell.addEventListener('click', handleClick));

document.getElementById('player-vs-player').addEventListener('click', () => setGameMode('player'));
document.getElementById('player-vs-bot').addEventListener('click', () => setGameMode('bot'));
document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    showHomePage();
});
render();