const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


function updateWordOfTheDay(){
    fs.readFile('word_of_the_days.json', 'utf8', (err, data) => {
        if (err){
            console.error('Unable to read word_of_the_days.json');
        }
        const words = JSON.parse(data)
        const newWordOfTheDay = words.word_of_the_days[Math.floor(Math.random() * words.word_of_the_days.length)];

        fs.writeFile('word_of_the_day.json', JSON.stringify({word_of_the_day: newWordOfTheDay, last_updated: new Date().toISOString()}), (err) => {
            if (err){
                console.error('Unable to write word_of_the_day.json');
            }
        })
    })
}

fs.readFile('word_of_the_day.json', 'utf8', (err, data) => {
    if (err){
        console.error('Unable to read word_of_the_day.json');
    }
    const wordOfTheDay = JSON.parse(data);
    const now = new Date();
    const yesterdayMidnight = new Date(now);
    yesterdayMidnight.setDate(now.getDate() - 1);
    yesterdayMidnight.setHours(24, 0, 0, 0);
    if (new Date(wordOfTheDay.last_updated) < yesterdayMidnight) {
        updateWordOfTheDay();
    }
})



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
                            letterValues.push('green');
                        } else if(wordOfTheDay.word_of_the_day.includes(letter)){
                            letterValues.push('yellow');
                        } else {
                            letterValues.push('gray');
                        }
                    });
                    res.send({
                        valid: true,
                        correct: false,
                        letterValues: letterValues
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