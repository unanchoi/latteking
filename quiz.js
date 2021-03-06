const startButton = document.querySelector('#start-btn')
const main = document.querySelector('.main')
const result = document.querySelector('.result')
const quizBox = document.querySelector('.quiz-box')
const selectButtons = document.querySelectorAll('.control__select-btn')
const movies = document.querySelectorAll('.screen__movie')
const highScoreSpan = document.querySelector('#high-score')
const currentScoreSpan = document.querySelector('#current-score')
const resultScore = document.querySelector('.result__score')
const retryButton = document.querySelector('#retry')
const counter = document.querySelector('#counter')
const avarage = document.querySelector('.statistics__avarage')
const percentageSpan = document.querySelector('.statistics__percentage')

let curScore = 0
if (!localStorage.highScore) {
    localStorage.highScore = 0
}
let older
const date = [0, 0]
const correct = [true, true]
let scoreSum = 0
let scoreSquareSum = 0
let percentage = 0
let gameSum = 0
let avg = 0


startButton.addEventListener('click', startGame)
retryButton.addEventListener('click', startGame)

var xhr = new XMLHttpRequest();
xhr.responseType = "json";
var xhr2 = new XMLHttpRequest();
xhr2.responseType = "json";
var xhr3 = new XMLHttpRequest();
xhr3.responseType = "json";
var xhr4 = new XMLHttpRequest();
xhr4.responseType = "json";
xhr.open("GET", "https://api.countapi.xyz/get/latteking/counter")
xhr.onload = function() {
    counter.innerText = this.response.value
}
xhr.send()

function betweenDay(firstDate, secondDate) {     
    var firstDateObj = new Date(firstDate.substring(0, 4), firstDate.substring(4, 6) - 1, firstDate.substring(6, 8));
    var secondDateObj = new Date(secondDate.substring(0, 4), secondDate.substring(4, 6) - 1, secondDate.substring(6, 8));
    var betweenTime = Math.abs(secondDateObj.getTime() - firstDateObj.getTime());
    return Math.floor(betweenTime / (1000 * 60 * 60 * 24));
}

function startGame() {
    main.classList.add('hidden')
    result.classList.add('hidden')
    shuffledSongs = songs.sort(() => Math.random() - 0.5)
    currentSongIndex = 0
    curScore = 0
    currentScoreSpan.innerText = '????????????: ' + curScore
    highScoreSpan.innerText ='????????????: ' + localStorage.highScore
    quizBox.classList.remove('hidden')
    percentageSpan.innerText = '????????? ???????????? ?????? %!'
    avarage.innerText = '????????????: ???'
    setNextQuiz()
}

function setNextQuiz() {
    if (shuffledSongs.length <= currentSongIndex + 3) {
        shuffledSongs = songs.sort(() => Math.random() - 0.5)
        currentSongIndex = 0
    }
    resetState()
    let song1 = shuffledSongs[currentSongIndex]
    let song2 = shuffledSongs[currentSongIndex+1]
    let gap = betweenDay(String(song1.date), String(song2.date))
    if (gap > 90 && gap < 1095) {
        showQuiz([shuffledSongs[currentSongIndex], shuffledSongs[currentSongIndex+1]])
    } else {
        currentSongIndex += 1
        setNextQuiz()
    }
}

function showQuiz(songs) {
    older = Math.min(songs[0].date, songs[1].date)
    for (var i = 0; i < 2; i++) {
        const song = songs[i]
        const selectButton = selectButtons[i]
        const movie = movies[i]
        movie.innerHTML = song.video
        selectButton.innerText = song.title
        selectButton.dataset.index = i
        selectButton.addEventListener('click', selectAnswer)
        date[i] = song.date
        if (song.date == older) {
            correct[i] = true
        } else {
            correct[i] = false
        }
    }
}

function resetState() {
    Array.from(selectButtons).forEach(button => {
        clearStatusClass(button)
    })
}

function selectAnswer(e) {
    const selectedButton = e.target
    const selectedIndex = JSON.parse(selectedButton.dataset.index)
    const isCorrect = correct[selectedIndex]
    if (isCorrect){
        curScore += 1
        localStorage.highScore = Math.max(curScore, localStorage.highScore)
        highScoreSpan.innerText ='????????????: ' + localStorage.highScore
        currentScoreSpan.innerText = '????????????: ' + curScore
    }
    for (var i = 0; i < 2; i++) {
        const selectButton = selectButtons[i]
        setStatusClass(selectButton, correct[i])
        selectButton.innerText = date[i]
    }
    currentSongIndex += 2
    setTimeout(function() {
        if (isCorrect) {
            setNextQuiz()
        } else {
            showResult(curScore)
        }
    }, 3000)
}

function setStatusClass(element, isCorrect) {
    clearStatusClass(element)
    if (isCorrect) {
      element.classList.add('correct')
    } else {
      element.classList.add('wrong')
    }
}

function clearStatusClass(element) {
    element.classList.remove('correct')
    element.classList.remove('wrong')
}

function showResult(score) {
    xhr2.open("GET", "https://api.countapi.xyz/update/latteking/counter?amount=" + 1);
    xhr2.onload = function() {
        gameSum = this.response.value
        if (score > 0) {
            xhr3.open("GET", "https://api.countapi.xyz/update/latteking/score-sum?amount=" + score)
        } else {
            xhr3.open("GET", "https://api.countapi.xyz/get/latteking/score-sum")
        }
        xhr3.onload = function() {
            scoreSum = this.response.value
            avg = (scoreSum / gameSum).toFixed(1)
            avarage.innerText = "????????????: " + avg + "???"
            if (score > 0) {
                xhr4.open("GET", "https://api.countapi.xyz/update/latteking/score-square-sum?amount=" + (score)**2)
            } else {
                xhr4.open("GET", "https://api.countapi.xyz/get/latteking/score-square-sum")
            }
            xhr4.onload = function() {
                scoreSquareSum = this.response.value
                percentage = (computeNormalDistribution(score, gameSum, scoreSum, scoreSquareSum)*100).toFixed(1)
                percentageSpan.innerText = "????????? ???????????? ?????? " + percentage +"%!"
            }
            xhr4.send()
        }
        xhr3.send()
    }
    xhr2.send();
    quizBox.classList.add('hidden')
    result.classList.remove('hidden')
    resultScore.innerText = String(score) + "???"
}

function computeNormalDistribution(x, gameSum, scoreSum, scoreSquareSum) {
    const mean = scoreSum / gameSum
    const scoreSquareMean = scoreSquareSum / gameSum
    const sd = (scoreSquareMean - (mean**2)) ** (0.5)
    const Z = (x-mean)/sd
    const T = 1 / (1 + 0.2316419*  Math.abs(Z))
    const D = 0.3989423 * Math.exp(-Z*Z/2);
    let prob = D*T*(.3193815+T*(-.3565638+T*(1.781478+T*(-1.821256+T*1.330274))))
    if (Z<0) {
        prob = 1 - prob
    }
    return prob
}

const songs = [
    {
        title: '????????? - ????????????',
        date: 20060330,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/EAWHtXQpYX4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????????',
        date: 20061010,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/wcuWIz6CI1U" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????? ?????????',
        date: 20070212,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/bIjLYvGNyO0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ???????????? 486',
        date: 20070315,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/elulW4MAsP0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20070816,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Y4RmVcKav9Q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????? ??????',
        date: 20071122,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/VT9lKAPWG5E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - One',
        date: 20080417,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/OKsqczjP5-8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - So Hot',
        date: 20080603,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/agL-oiDlyYo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - U-Go-Girl',
        date: 20080714,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/z246K3KBZjo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - ??????(MIROTIC)',
        date: 20080919,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/9r1lvcI-D6k" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ??????????????????',
        date: 20081113,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/weee_FzO2AI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Gee',
        date: 20090105,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/qizghQs4K6E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - ?????? ??????',
        date: 20090309,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/_rX0IoeMSoc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????, 2NE1 - Lolipop',
        date: 20090327,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/yz15f-1cUCg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - ?????????',
        date: 20090601,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/HCslYhHcWkU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????????, ????????? - ??????',
        date: 20090713,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/IWYGE6fY594" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20090730,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/lP6yruxrvdE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - ????????????',
        date: 20100114,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/BRIGlW12qpk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Bad Girl Good Girl',
        date: 20100701,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/sdtspSYyQXs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ???????????? ????????????',
        date: 20100826,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/9xJy-KbTQX0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ???????????????',
        date: 20101013,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/BZZYKmHtFfM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????? ???',
        date: 20101209,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/OIHlzvEKncQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: 'f(x) - Hot Summer',
        date: 20110615,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/xTfbMYBoFik" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - Roly-Poly',
        date: 20110629,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/PwpFx1-4BI4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????????, GD - ???????????? (Feat. ??????)',
        date: 20110702,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/1_UEBZCLn7U" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????? ??????',
        date: 20080808,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/6I4Ygo0dwRs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20080123,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/RjU5Op_KSBw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????????',
        date: 20090903,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/LF2zAz2_ICA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - diva',
        date: 20090409,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/w39MXjjGwfI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'

    },
    {
        title: '????????? - ?????????',
        date: 20090518,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/7A4WZsC1njA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'

    },
    {
        title: '4minute - Hot issue',
        date: 20090615,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/B8p-zOux9s8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: 'U-kiss - ????????????',
        date: 20091106,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/UQsNfs_9SYk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: 'love - ????????????????????????',
        date: 20080117,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/CdsQsniwoDk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - 8282',
        date: 20090227,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/c54FzJcol3I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????????????????? - abracadabra',
        date: 20090721,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/oU0b_47itlc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????????',
        date: 20080918,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/5maMAv48OcM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'

    },
    {
        title: '2am - ?????????',
        date: 20080711,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/TTpvoSN5LHg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title : '????????? - D.I.S.C.O',
        date : 20080701,
        video : '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/C0USKQRvuIc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????????',
        date: 20021211,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Nl-iaDdA908" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ??????????????? ??????',
        date: 20030530,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/rVF-F_bgIEc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - 10 Minutes',
        date: 20030813,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/okJnl6n3G7E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????????????????? - ??????',
        date: 20030124,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/BYyVDi8BpZw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20031007,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/i5i-qoH3pK8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??? - ????????? ????????? ??????',
        date: 20031006,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/GoT3vK3zrPE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????? ??? ??????',
        date: 20030712,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/gsXQPVwEO34" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? ?????? - ?????? ??????',
        date: 20030904,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/FYjWDBEA76E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????? ??? ???',
        date: 20030605,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Q6ChonO-4iM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???PD - ?????????',
        date: 20040323,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Jhl35eJXgjY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????????',
        date: 20040909,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/gSHerpMWRCQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????????',
        date: 20040909,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/4duD8KFRUC8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Hug',
        date: 20041014,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/p3dxVQsDwyU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: "??? - It's Raining",
        date: 20041008,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/nueYr7Yx8CU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ??? ???????????????',
        date: 20040625,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/4eLS-U2npxk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ??? ??????',
        date: 20040618,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/7eqOZqmKIEs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ??????',
        date: 20040707,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Cqokr695Gic" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????... ????????? ?????????',
        date: 20040105,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/4wuZsWr4kK4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20050303,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/qkIrcN04AyQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ???????????????',
        date: 20050429,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/KeMbLY7ztDw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: 'SG ????????? - ?????????',
        date: 20050323,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/0UQt0STXrK8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20041213,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/qJrFJRoto88" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Fly',
        date: 20051004,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/sHqLlyBlmQI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ??????',
        date: 20050108,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/upA01bvUemQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ???????????????',
        date: 20050701,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/aBCT3B6FGaY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - Y',
        date: 20040713,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/MKYv5w0QqFM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - Super Star',
        date: 20050325,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/l9Ih9zqtWJY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????? ???',
        date: 20041115,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/BY4sHNaV4WU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Rising Sun',
        date: 20050912,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/krNW5K6AjWM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - She Is',
        date: 20050615,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/zjVt73gD1fc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? ????????? - ????????????',
        date: 20120329,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=jrYIZ9VgmKo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: '?????? - ???????????????',
        date: 20120715,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=DQCuV0ck4aA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: '????????? - ?????????(ALONE)',
        date: 20120412,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=kLka40yzGWQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: 'BIGBANG - Fantastic Baby',
        date: 20120229,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=oM4KBLQRCM8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: '????????? - Heaven',
        date: 20120209,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=X2nUBZnC5gk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: '????????? - ?????? ???',
        date: 20120511,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=gJtNx3P02Z4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: '?????? - ????????????',
        date: 20120920,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=wyejTBPksy0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
      {
        title: '???????????? ????????? - Twinkle',
        date: 20120430,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=ETIuTYFZLow&list=PL7L5uVTUOZFZb6PE0jfuHTfSFI3WjXxwc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: 'f(x) - Hot Summer',
        date: 20110615,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/xTfbMYBoFik" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - Roly-Poly',
        date: 20110629,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/PwpFx1-4BI4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????????, GD - ???????????? (Feat. ??????)',
        date: 20110702,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/1_UEBZCLn7U" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
      {
        title: '2NE1 - ?????? ?????? ??? ??????',
        date: 20110624,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=rnxZyt3f708" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - So Cool',
        date: 20110809,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=yW5a8JO28gI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ??????????????? ????????????',
        date: 20110829,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=90ie319tqIs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
      {
        title: '????????? - ????????????',
        date: 20110106,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=9iMFkd2yf_Y" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '2PM - Hand Up',
        date: 20110620,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=XGAQzfhC4g4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },  
    {
        title: '?????????????????? - Trouble Maker',
        date: 20111201,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=z4zR1l9qTgM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - ????????????',
        date: 20100114,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/BRIGlW12qpk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Bad Girl Good Girl',
        date: 20100701,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/sdtspSYyQXs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ???????????? ????????????',
        date: 20100826,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/9xJy-KbTQX0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ???????????????',
        date: 20101013,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/BZZYKmHtFfM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????? ???',
        date: 20101209,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/OIHlzvEKncQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
      {
        title: '?????????&?????? - ?????????',
        date: 20100603,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=bzdsqPOJK_I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? ?????? - ??????',
        date: 20100330,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=KdKucPl2lXA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - Oh!',
        date: 20100128,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/watch?v=5r6M-c3_7YA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - tell me',
        date: 20070905,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/2nxIYH11FhM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - ??????????????????',
        date: 20070802,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/I1OzfxybATE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20070816,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Y4RmVcKav9Q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????? ??????',
        date: 20071122,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/VT9lKAPWG5E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - ????????????',
        date: 20071101,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/fz3HuKfNmdE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????? ?????????',
        date: 20070212,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/bIjLYvGNyO0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - ?????????',
        date: 20070223,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/4KAg6CryES8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ???????????? 486',
        date: 20070315,
        video: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/elulW4MAsP0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - kissing you',
        date: 20071101,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/RZwxxqmhA7c" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????? ???',
        date: 20070129,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/9QYYplck9Ic" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????? ??????',
        date: 20070525,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/wRdNZKsh_a00" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????? ????????? ??????',
        date: 20060718,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/_MythyZ0w3s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????? ?????????',
        date: 20060210,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/pX_Nv6gG6SY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????????',
        date: 20061009,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/8s9lL-k9DAE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????? ?????????',
        date: 20060809,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/NbP1wTPk3ME" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????????',
        date: 20061204,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/QNt7KUUk_d8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '??????????????? - ????????? ???????????? ??? ??????',
        date: 20060504,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/vtZGJgbTXgo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ?????????',
        date: 20060724,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/0siBQG4aPWs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????????',
        date: 20060720,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/dXQzwNb8G7g" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: 'MC??? - ????????? ?????? ??????(Part.2)',
        date: 20060925,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/bMZtlYj9Qqs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '?????? - ????????? ??????',
        date: 20060424,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/rgms0zs6SZc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????? ???????????????',
        date: 2000627,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/PlOPWA_DE4U" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ????????? ?????????',
        date: 20060227,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/2RMs8I3LUd4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '???????????? - I Go',
        date: 20060613,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/FwuZKJSrGAg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
        title: '????????? - ?????? ??????',
        date: 20060313,
        video: '<iframe width="100%" height="100%" src="https://youtu.be/EAWHtXQpYX4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    }
  ]