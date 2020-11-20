
function setCSS (css) {//добаляем кастомный css  в DOM
	const style = document.createElement('style');
	style.innerHTML = css;
	document.head.appendChild(style);
}
function getRandom(min, max) {//генератор рандомных чисел
	let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}
class TimerControl {
	//класс, отвечающий за таймер, сделан с помощью паттерна observer
	//после подписки на события subscribeOn.....() класс оповещает всех подписчиков
	constructor(){
		this.subscribersOnTick = [];
		this.subscribersOnPause = [];
		this.subscribersOnResume = [];
		this.subscribersOnStop = [];
		this.timeLeft = 0;
		
	}
	subscribeOnTick(fn){
		this.subscribersOnTick.push(fn);
	}
	subscribeOnPause(fn){
		this.subscribersOnPause.push(fn);
	}
	subscribeOnResume(fn){
		this.subscribersOnResume.push(fn);
	}
	subscribeOnStop(fn){
		this.subscribersOnStop.push(fn);
	}
	notifyOnPause(){
		this.subscribersOnPause.forEach((fn)=>{
			fn(this.timeLeft);
		});
	}
	notifyOnResume(){
		this.subscribersOnResume.forEach((fn)=>{
			fn(this.timeLeft);
		});
	}
	notifyOnStop(){
		this.subscribersOnStop.forEach((fn)=>{
			fn(this.timeLeft);
		});
	}
	notifyOnTick(){

		if (this.timeLeft<=0){
			return;
		}

		this.timeLeft--;
		this.subscribersOnTick.forEach((fn)=>{
			fn(this.timeLeft);
		});
		if (this.timeLeft == 0){
			this.stop();
		}
	}
	stop(){//выключает таймер
		clearInterval(this.timer);
		this.notifyOnStop()
	}
	start(time=60){//включает, или заного перезапускает таймер
		this.timer = setInterval(this.notifyOnTick.bind(this), 1000);
		this.timeLeft=time;
	}
	pause(){//ставит таймер  на паузу
		clearInterval(this.timer);
		this.notifyOnPause();
		
	}
	resume(){//продолжает работу таймера
		this.timer = setInterval(this.notifyOnTick.bind(this), 1000);
		this.notifyOnResume(this.timeLeft);
	}
}



class Modal{
	//класс инкапсулирует методы работы с модальным окном
	constructor(modalclass, okbtn, callBack){
		this.$modalclass = document.querySelector(modalclass);
		this.$okbtn = document.querySelector(okbtn);
		this.$okbtn.onclick = (e)=>{}
		this.$closebuttons = document.querySelectorAll("[data-dismiss = 'modal']");	
		this.$closebuttons.forEach((val)=>{val.onclick = this.close.bind(this);})
		this.$modalclass.onclick = this.close.bind(this);
		this.$values = false;
		this.closeEvent = callBack;//функция обработчик закрытия окна  кнопкой сохранить
		
		
	}
	//создает модальное окно. v - текст сообщения
	open(v){
		this.$modalclass.classList.remove("hide");
		document.getElementsByName('score')[0].value  = v;
		console.log(document.getElementsByName('score')[0]);
		
	}
	close(e){// обработчик закрытия модального окна
		if(e.target.closest('.modal-dialog') && (e.target.closest('[data-dismiss]')==null)){
			//если клик произошел в области окна,  то окно не закрыаем
			return;
		}
		if (e.target == this.$okbtn){
			this.$values = {
				name:document.querySelector('[name="name"]').value,
				score:document.querySelector('[name="score"]').value
			}
		
		
			
		}
		
		this.$modalclass.classList.add("hide");
		this.closeEvent(this.flushData());
	}
	flushData(){
		if (this.$values){
			
			return this.$values;
		}
	}
}

class Game {
	constructor(
			{start, newGame, scoreIndicator, timeCounter, gameField, blur, appearHandler,disappearHandler},
			{	ROW_MAX = 30, 
				COL_MAX = 30, 
				COLORS = [ 'red', 'blue'], 
				START_ACTIVE_CELLS = 3, 
				MAX_PAINTED_CELLS = 2},
			timerOptions,
			scoreTableOptions,
			{modalclass,okbtn}
			) {
		this.$startBtn = document.querySelector(start);
		this.$newGameBtn = document.querySelector(newGame);
		this.$scoreIndicator = document.querySelector(scoreIndicator);
		this.$timeCounter = document.querySelector(timeCounter);
		this.$gameField = document.querySelector(gameField);
		this.$blur = document.querySelector(blur);
		this.ROW_MAX = ROW_MAX;
		this.COL_MAX = COL_MAX;
		this.COLORS = COLORS;
		this.START_ACTIVE_CELLS = START_ACTIVE_CELLS;
		this.MAX_PAINTED_CELLS = MAX_PAINTED_CELLS;
		this.painted = 0;
		this.currentScore = 0;
		this.isRunning = false;
		this.timerControl = new TimerControl();
		this.timerControl.subscribeOnTick((v)=>{
			this.$timeCounter.innerHTML = v;
		});
		
		this.scoreTable = new ScoreTable (scoreTableOptions);

		let val = this.scoreTable.getTopScores();
		if (Array.isArray(val)){
			val.forEach((ff)=>{
				document.querySelector(".score-table ul").innerHTML += '<li> <span class="name"></span><span class="score">имя:<span style ="color:green">'+ff.name+'</span> счет:<span style="color:red">'+ff.score+'</span></span> </li>';
			});
		}
		appearHandler ==null ? this.$appearHandler =null : this.$appearHandler=appearHandler.bind(this);
		disappearHandler ==null ? this.$disappearHadler =null : this.$disappearHadler=disappearHandler.bind(this);
		this.$modal = new Modal(modalclass,okbtn,(fn)=>{
			console.log(fn);
			let scr = this.scoreTable.getTopScores();
			if (!Array.isArray(scr)){
				scr = [];
			}
			let found = scr.find((el)=>{
				return el.name === fn.name;
			});
			let resaray = scr.push(fn);
			if (found === undefined){
				
				scr.sort((a,b)=>{
					return b.score - a.score;
				});
				if (scr.length>10){
					scr = scr.slice(0,10);
				}
				this.scoreTable.saveTopScores(scr);
			}
			
		});
		this.timerControl.subscribeOnStop((v)=>{
			this.$modal.open(this.currentScore);
		});

		this.init();
	}
	init () {
		this.$startBtn.onclick = this.startHandler.bind(this);
		this.$startBtn.dataset.status = 'play';
		this.$newGameBtn.onclick = this.newGameHandler.bind(this);
		this.scoreTable.init();
		this.createField();
		this.$cells = document.querySelectorAll('.cell');
	}
	newGameHandler() {
		this.$newGameBtn.disabled = true;
		this.$startBtn.disabled = false;
		this.startGame();
	}
	startHandler() {
		if(this.$startBtn.dataset.status === 'play') {
			this.$startBtn.innerText = 'Старт';
			this.$startBtn.dataset.status = 'paused';
			this.pauseGame();
		} else {
			this.$startBtn.innerText = 'Пауза';
			this.$startBtn.dataset.status = 'play';
			this.resumeGame();
		}
	}
	clickHandler (e) {
		if(!this.isRunning)
				return;
		if(!e.target.classList.contains('cell'))
			return;
		const cell = e.target;
		if(!(cell.dataset.status === 'paint'))
			return;
		this.painted--;
		this.$scoreIndicator.innerText = ++this.currentScore;
		cell.dataset.status = 'clear';
		cell.style.backgroundColor = '';
		
		this.paintRandomCells();
	}
	createField () {
		this.$gameField.innerHTML = '';
		const style = window.getComputedStyle(this.$gameField);
		setCSS (
			`.cell {
				width: ${Math.floor(this.COL_MAX)}px;
				height: ${Math.floor(this.ROW_MAX)}px;
			}`);

		let number = 0;
		for(let i = 0; i < Math.floor(parseInt(style.width)/this.ROW_MAX); i++) {
			for(let j = 0; j < Math.floor(parseInt(style.height)/this.COL_MAX); j++) {
				const cell = document.createElement('div');
				cell.classList.add('cell');
				cell.dataset.id = number++;
				cell.dataset.status = 'clear';
				// cell.textContent = number - 1;
				this.$gameField.appendChild(cell);
			}
		}
		this.$gameField.onclick = this.clickHandler.bind(this);
	}
	startGame() {
		this.clearGame();
		this.paintRandomCells();
		this.resumeGame(true);
	}
	pauseGame() {
		this.timerControl.pause();
		this.isRunning = false;
		this.$blur.classList.add('active');
	}

	resumeGame(isStart) {
		isStart ? this.timerControl.start():this.timerControl.resume();

		this.isRunning = true;
		this.$blur.classList.remove('active');
	}
	stopGame() {
		this.timerControl.stop();
		this.isRunning = false;
		this.$newGameBtn.disabled = false;
		this.$startBtn.disabled = true;
		this.$startBtn.innerText = 'Пауза';
		document.querySelector('.modal').classList.remove('hide');
	}
	clearGame() {
		this.currentScore = 0;
		this.$scoreIndicator.innerText = 0;
		this.painted = 0;
		this.$cells.forEach((cell) => {
			cell.dataset.status = 'clear';
			cell.style.backgroundColor = '';
		});
	}
	paintRandomCells() {
		const count = this.painted ? getRandom(0, this.MAX_PAINTED_CELLS) : this.START_ACTIVE_CELLS;
		for(let i = 0; i < count; i++){
			while(true){
				const candidate = this.$cells[getRandom(0, this.$cells.length-1)];
				if(candidate.dataset.status === 'clear'){
					candidate.style.backgroundColor = this.COLORS[getRandom(0, this.COLORS.length-1)];
					this.painted++;
					candidate.dataset.status = 'paint';
					break;
				}
			}
		}
	}

}

class ScoreTable {
	constructor({table}) {
		this.$table = document.querySelector(table);

	}
	init() {
		const topScores = this.getTopScores();

	}
	getTopScores() {
		let ffs = window.localStorage.getItem('topScoress');
		if (ffs!='undefined'){
			return JSON.parse(ffs);
		}
		return false;
	}
	saveTopScores(scores) {

		let str = JSON.stringify(scores);
		window.localStorage.setItem('topScoress', str);
	}

}

const game = new Game ({
	start: '.start-btn',
	newGame: '.new-game-btn',
	scoreIndicator: '.current-score',
	timeCounter: '.time-counter',
	gameField: '.game-field',
	blur: '.blur',
	appearHandler:null,
	disappearHandler:null
}, {
	ROW_MAX: 30,
	COL_MAX: 30,
	COLORS: [ 'red', 'blue', 'yellow'],
	START_ACTIVE_CELLS: 3,
	MAX_PAINTED_CELLS: 2,
}, {
	GAME_TIME: 60000,
	REFRESH_TIME: 400,
},{
	table: '.score-table',
},{
	modalclass:"#exampleModal",
	okbtn:"#okbtn",
});
//document.querySelector(".test-btn").onclick = (e)=>{document.querySelector("#exampleModal").classList.remove("hide");};
