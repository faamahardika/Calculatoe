export function getRandomMathQuestion() {
    const typesOfQuestions = ['limit', 'derivative', 'arithmetic', 'integral', 'quadratic'];
    const randomType = typesOfQuestions[Math.floor(Math.random() * typesOfQuestions.length)];
  
    let equation, answer, type;
  
    switch (randomType) {
      case 'limit':
        const a = Math.floor(Math.random() * 10) - 5;
        const limitTypes = ['polynomial', 'fraction'];
        const limitType = limitTypes[Math.floor(Math.random() * limitTypes.length)];
  
        if (limitType === 'polynomial') {
          const power = Math.floor(Math.random() * 3) + 1;
          const b = Math.floor(Math.random() * 5) + 1;
          const c = Math.floor(Math.random() * 5) - 2;
          equation = `lim(x→${a}) (${b}x^${power} + ${c}x)`;
          answer = (b * Math.pow(a, power) + c * a).toString();
        } else {
          let desiredAnswer = Math.floor(Math.random() * 19) - 9;
          while (desiredAnswer === 0) {
            desiredAnswer = Math.floor(Math.random() * 19) - 9;
          }
          const b = Math.floor(Math.random() * 5) + 1;
          let d = Math.floor(Math.random() * 10) - 5;
          while (d === 0 || d === a) {
            d = Math.floor(Math.random() * 10) - 5;
          }
          const c = desiredAnswer * (a - d) - b * a;
          equation = `lim(x→${a}) (${b}x + ${c})/(x - ${d})`;
          answer = desiredAnswer.toString();
        }
        break;
  
      case 'derivative':
        const derCoef = Math.floor(Math.random() * 10) + 1;
        const derExp = Math.floor(Math.random() * 4) + 2;
        equation = `d/dx ${derCoef}x^${derExp}`;
        const resultCoef = derCoef * derExp;
        const resultExp = derExp - 1;
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
        equation = intCoef === 1 ? `∫x^${intExp} dx` : `∫${intCoef}x^${intExp} dx`;
        const newExp = intExp + 1;
        const newCoef = intCoef / newExp;
        answer = Number.isInteger(newCoef) 
          ? (newCoef === 1 ? `x^${newExp} + C` : `${newCoef}x^${newExp} + C`)
          : `(${intCoef}/${newExp})x^${newExp} + C`;
        break;
  
      case 'quadratic':
        let root1 = Math.floor(Math.random() * 10) - 5;
        let root2 = Math.floor(Math.random() * 10) - 5;
        while (root2 === root1) {
          root2 = Math.floor(Math.random() * 10) - 5;
        }
        const p = Math.floor(Math.random() * 3) + 1;
        const q = -p * (root1 + root2);
        const r = p * root1 * root2;
        const pTerm = p === 1 ? 'x²' : `${p}x²`;
        const qTerm = q >= 0 ? `+ ${q}x` : `${q}x`;
        const rTerm = r >= 0 ? `+ ${r}` : `${r}`;
        equation = `${pTerm} ${qTerm} ${rTerm} = 0`;
        answer = [root1.toString(), root2.toString()];
        break;
    }
  
    return { equation, answer, type: randomType };
  }
  
  