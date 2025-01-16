import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import { getRandomMathQuestion } from '../utils/mathQuestions';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export default function GameScreen({ route, navigation }: Props) {
  const { mode } = route.params;
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [mathBoard, setMathBoard] = useState<any[]>(Array(9).fill(null).map(() => getRandomMathQuestion()));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [isGameActive, setIsGameActive] = useState(true);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [sounds, setSounds] = useState<{[key: string]: Audio.Sound}>({});
  const { user } = useAuth();

  useEffect(() => {
    initializeGame();
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  useEffect(() => {
    if (mode === 'bot' && currentPlayer === 'O' && isGameActive) {
      setTimeout(botMove, 1000);
    }
  }, [currentPlayer, mode, isGameActive]);

  const loadSounds = async () => {
    const soundFiles = {
      playerWin: require('../assets/sounds/player_win.wav'),
      botWin: require('../assets/sounds/bot_win.wav'),
      tie: require('../assets/sounds/tie.wav'),
      mark: require('../assets/sounds/mark.wav'),
    };

    const loadedSounds: {[key: string]: Audio.Sound} = {};
    for (const [key, value] of Object.entries(soundFiles)) {
      const { sound } = await Audio.Sound.createAsync(value);
      loadedSounds[key] = sound;
    }
    setSounds(loadedSounds);
  };

  const unloadSounds = async () => {
    for (const sound of Object.values(sounds)) {
      await sound.unloadAsync();
    }
  };

  const playSound = async (soundName: string) => {
    if (sounds[soundName]) {
      await sounds[soundName].replayAsync();
    }
  };

  const initializeGame = () => {
    setBoard(Array(9).fill(null));
    setMathBoard(Array(9).fill(null).map(() => getRandomMathQuestion()));
    setCurrentPlayer('X');
    setIsGameActive(true);
  };

  const handleCellPress = (index: number) => {
    if (board[index] || !isGameActive || (mode === 'bot' && currentPlayer === 'O')) return;

    setCurrentQuestion(mathBoard[index]);
    setModalVisible(true);
  };

  const handleAnswer = () => {
    setModalVisible(false);
    const index = board.findIndex((cell, i) => cell === null && mathBoard[i] === currentQuestion);
    
    if (currentQuestion.type === 'quadratic') {
      if (userAnswer === currentQuestion.answer[0] || userAnswer === currentQuestion.answer[1]) {
        makeMove(index);
      } else {
        Alert.alert('Wrong answer!', 'Next player\'s turn.');
        switchPlayer();
      }
    } else {
      if (userAnswer === currentQuestion.answer) {
        makeMove(index);
      } else {
        Alert.alert('Wrong answer!', 'Next player\'s turn.');
        switchPlayer();
      }
    }
    setUserAnswer('');
  };

  const makeMove = (index: number) => {
    playSound('mark');
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(newBoard, currentPlayer)) {
      const winMessage = mode === 'bot' 
        ? (currentPlayer === 'X' ? 'You win!' : 'Bot wins!') 
        : `Player ${currentPlayer} wins!`;
      endGame(winMessage);
    } else if (isBoardFull(newBoard)) {
      endGame("It's a tie!");
    } else {
      switchPlayer();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
  };

  const botMove = () => {
    let cellIndex: number | undefined;
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
      makeMove(cellIndex);
    }
  };

  const easyBotMove = (): number => {
    const availableCells = board
      .map((cell, index) => cell === null ? index : null)
      .filter((cell): cell is number => cell !== null);
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };

  const mediumBotMove = (): number => {
    // Check if bot can win in the next move
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = 'O';
        if (checkWinner(testBoard, 'O')) {
          return i;
        }
      }
    }

    // Check if player can win in the next move and block
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = 'X';
        if (checkWinner(testBoard, 'X')) {
          return i;
        }
      }
    }

    // If no winning move, play randomly
    return easyBotMove();
  };

  const hardBotMove = (): number => {
    let bestScore = -Infinity;
    let move: number = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = 'O';
        let score = minimax(testBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const minimax = (board: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const result = checkGameEnd(board);
    if (result !== null) {
      return result;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
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
          board[i] = 'X';
          let score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const checkGameEnd = (board: (string | null)[]): number | null => {
    if (checkWinner(board, 'O')) return 10;
    if (checkWinner(board, 'X')) return -10;
    if (isBoardFull(board)) return 0;
    return null;
  };

  const checkWinner = (board: (string | null)[], player: string): boolean => {
    return winningCombinations.some(combination =>
      combination.every(index => board[index] === player)
    );
  };

  const isBoardFull = (board: (string | null)[]): boolean => {
    return board.every(cell => cell !== null);
  };

  const updateUserStats = async (difficulty: string) => {
    if (user) {
      const statsRef = doc(db, 'playerStats', user.uid);
      const statsDoc = await getDoc(statsRef);
    
      if (statsDoc.exists()) {
        const currentStats = statsDoc.data();
        const updatedStats = {
          ...currentStats,
          [difficulty]: (currentStats[difficulty] || 0) + 1,
          total: (currentStats.total || 0) + 1
        };

        await updateDoc(statsRef, updatedStats);
      }
    }
  };

  const endGame = async (message: string) => {
    setIsGameActive(false);
    if (message.includes('win')) {
      if (message.includes('Bot')) {
        playSound('botWin');
      } else {
        playSound('playerWin');
        if (mode === 'bot') {
          await updateUserStats(botDifficulty);
        }
      }
    } else {
      playSound('tie');
    }
    Alert.alert('Game Over', message, [
      { text: 'Play Again', onPress: initializeGame },
      { text: 'Home', onPress: () => navigation.navigate('Home') },
    ]);
  };

  const renderCell = (index: number) => {
    return (
      <TouchableOpacity
        style={styles.cell}
        onPress={() => handleCellPress(index)}
        disabled={!isGameActive || board[index] !== null}
      >
        <Text style={[styles.cellText, board[index] === 'O' && styles.botText]}>
          {board[index] || (mathBoard[index] && mathBoard[index].equation)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculatoe</Text>
      <Text style={styles.playerTurn}>
        {mode === 'bot' && currentPlayer === 'O' ? "Bot's turn" : `Player ${currentPlayer}'s turn`}
      </Text>
      <View style={styles.board}>
        {board.map((_, index) => (
          <TouchableOpacity
            key={index} // Tambahkan key yang unik di sini
            style={styles.cell}
            onPress={() => handleCellPress(index)}
            disabled={!isGameActive || board[index] !== null}
          >
            <Text style={[styles.cellText, board[index] === 'O' && styles.botText]}>
              {board[index] || (mathBoard[index] && mathBoard[index].equation)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
        <Text style={styles.resetButtonText}>Reset Game</Text>
      </TouchableOpacity>
      {mode === 'bot' && (
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyText}>Bot Difficulty:</Text>
          <TouchableOpacity
            style={[styles.difficultyButton, botDifficulty === 'easy' && styles.activeDifficulty]}
            onPress={() => setBotDifficulty('easy')}
          >
            <Text style={styles.difficultyButtonText}>Easy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.difficultyButton, botDifficulty === 'medium' && styles.activeDifficulty]}
            onPress={() => setBotDifficulty('medium')}
          >
            <Text style={styles.difficultyButtonText}>Medium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.difficultyButton, botDifficulty === 'hard' && styles.activeDifficulty]}
            onPress={() => setBotDifficulty('hard')}
          >
            <Text style={styles.difficultyButtonText}>Hard</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{currentQuestion?.equation}</Text>
          <TextInput
            style={styles.input}
            onChangeText={setUserAnswer}
            value={userAnswer}
            placeholder="Enter your answer"
            keyboardType="default"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleAnswer}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    fontFamily: 'Itim-Regular',
  },
  playerTurn: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    fontFamily: 'Itim-Regular',
  },
  board: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    color: '#09C372',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Itim-Regular',
  },
  botText: {
    color: '#FF3860',
    fontFamily: 'Itim-Regular',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#FF3860',
    padding: 10,
    borderRadius: 5,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Itim-Regular',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  difficultyText: {
    color: 'white',
    marginRight: 10,
    fontFamily: 'Itim-Regular',
  },
  difficultyButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDifficulty: {
    backgroundColor: '#FF3860',
  },
  difficultyButtonText: {
    color: 'white',
    fontFamily: 'Itim-Regular',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Itim-Regular',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: 200,
    fontFamily: 'Itim-Regular',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Itim-Regular',
  },
});

