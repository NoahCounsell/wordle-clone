const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


function updateWordOfTheDay() {
    fs.readFile('word_of_the_days.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Unable to read word_of_the_days.json');
            return;
        }

        const words = JSON.parse(data);
        const newWord = words.word_of_the_days[Math.floor(Math.random() * words.word_of_the_days.length)];

        fs.readFile('word_of_the_day.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Cannot read word_of_the_day.json');
                return;
            }

            const stored = JSON.parse(data);
            const today = new Date().toISOString().slice(0, 10);

            if (stored.last_updated !== today) {
                const updated = {
                    word_of_the_day: newWord,
                    last_updated: today
                };

                fs.writeFile('word_of_the_day.json', JSON.stringify(updated, null, 2), (err) => {
                    if (err) {
                        console.error('Unable to write word_of_the_day.json');
                        return;
                    }
                    console.log('Word of the day updated for:', today);
                });
            } else {
                console.log('Already updated today:', today);
            }
        });
    });
}


setInterval(() => {
    updateWordOfTheDay();
}, 30000);


app.post('/check', (req, res) => {
    fs.readFile('five_letter_words.json', 'utf8', (err, data) => {
        if (err){
            console.error('Unable to read words.json');
        }

        const words = JSON.parse(data);
        
        if (words.includes(req.body.guess)){
            fs.readFile('word_of_the_day.json', 'utf8', (err, data) => {
                if (err){
                    console.error('Unable to read word_of_the_day.json');
                }
                const wordOfTheDay = JSON.parse(data);

                if(wordOfTheDay.word_of_the_day === req.body.guess){
                    res.send({
                        valid: true,
                        correct: true
                    })
                } else {
                    let letterValues = [];
                    
                    req.body.guess.split('').forEach((letter, idx) => {
                        if(wordOfTheDay.word_of_the_day.split('')[idx] === letter){
                            letterValues.push({letter: letter, color: 'green'});
                        } else if (wordOfTheDay.word_of_the_day.includes(letter)){
                            letterValues.push({letter: letter, color: 'yellow'});
                        } else {
                            letterValues.push({letter: letter, color: 'gray'});
                        }
                    });

                    // prepare to data for yellows

                    const guess = req.body.guess.split('');
                    const wordOfTheDayLetterQuantities = {};
                    const guessLetterQuantities = {};
                    
                    wordOfTheDay.word_of_the_day.split('').forEach((letter, idx) => {
                        if(wordOfTheDayLetterQuantities.hasOwnProperty(letter)){
                            wordOfTheDayLetterQuantities[letter]++;
                        } else {
                            wordOfTheDayLetterQuantities[letter] = 1;
                        }
                    })

                    guess.forEach((letter, idx) => {
                        if(guessLetterQuantities.hasOwnProperty(letter)){
                            guessLetterQuantities[letter]++;
                        } else {
                            guessLetterQuantities[letter] = 1;
                        }
                    })

                    // check for resolved yellows

                    Object.keys(guessLetterQuantities).forEach((letter, idx) => {
                        
                        let changesNeeded = guessLetterQuantities[letter] - wordOfTheDayLetterQuantities[letter] || 0;

                        let letterValuePlaces = [];

                        guess.forEach((l, i) => {
                            if (l === letter) {
                                letterValuePlaces.push(i);
                            }
                        });

                        letterValuePlaces.forEach((place) => {
                            if(letterValues[place].color === 'yellow' && changesNeeded > 0){
                                letterValues[place].color = 'gray';
                                changesNeeded--;
                            }
                        })

                    })

                    // end of check for resolved yellows

                    
                    const colorValues = [];
                    
                    letterValues.forEach((letter, idx) => {
                        colorValues.push(letter.color);
                    })

                    res.send({
                        valid: true,
                        correct: false,
                        letterValues: colorValues
                    })
                }
            })
        } else {
            res.send({
                valid: false,
                correct: false
            })
        }
   
    })
});




app.listen(3000, () => {
    console.log('Server is running on port 3000');
});