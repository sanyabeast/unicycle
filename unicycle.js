(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(true);
    } else {
    	var Unicycle = factory();
    	var unicycle = new Unicycle();
    	window.unicycle = unicycle;
    }
}(this, function(){

	var unicycle;

	var Unicycle = function(newInstance){
		if (newInstance != true && unicycle instanceof Unicycle){
			return unicycle;
		}

		this.applyRAFPolyfill();

		this.tasks = {};

		this.loop = {
			rafID : null,
			timeoutID : null,
			prevFrameDate : +new Date(),
			frameTime : 1000 / 60,
			benchmarkMode: false,
			framesRendered: 0,
			framesRenderedLastSecond: 0,
			fpsTimeline: [],
			frameTimeSum: 16,
			get absDelta(){
				return +new Date() - this.prevFrameDate;
			},
			get relDelta(){
				return this.absDelta / this.frameTime;
			}
		};

		this.tick = this.tick.bind(this);
		this.benchmarkTick = this.benchmarkTick.bind(this);

	};

	Unicycle.prototype = {
		get averageFPS () {
			return 1000 / (this.loop.frameTimeSum / this.loop.framesRendered)
		},
		applyRAFPolyfill : function(){
			var root;

			if (typeof self == "object" && self.self == self){
				root = self;
			} else if (typeof window == "object" && window.window == window){
				root = window;
			} else if (typeof global == "object" && global.global == global){
				root = global;
			}


			var lastTime = 0;
			var prefixList = 'webkit moz ms o'.split(' ');
			var requestAnimationFrame = root.requestAnimationFrame;
			var cancelAnimationFrame = root.cancelAnimationFrame;
			var prefix;

			for( var i = 0; i < prefixList.length; i++ ) {
				if ( requestAnimationFrame && cancelAnimationFrame ) {
					break;
				}
				prefix = prefixList[i];
				requestAnimationFrame = requestAnimationFrame || root[ prefix + 'RequestAnimationFrame' ];
				cancelAnimationFrame  = cancelAnimationFrame  || root[ prefix + 'CancelAnimationFrame' ] ||
				root[ prefix + 'CancelRequestAnimationFrame' ];
			}

			if (!requestAnimationFrame || !cancelAnimationFrame ) {

				requestAnimationFrame = function( callback ) {
					var currTime = new Date().getTime();
					var timeToCall = Math.max( 0, this.polyfillFrameTime - ( currTime - lastTime ) );
					var id = root.setTimeout( function() {
						callback( currTime + timeToCall );
					}, timeToCall );
					lastTime = currTime + timeToCall;
					return id;
				}.bind(this);

				cancelAnimationFrame = function( id ) {
					root.clearTimeout( id );
				}.bind(this);
			}


			root.requestAnimationFrame = requestAnimationFrame;
			root.cancelAnimationFrame = cancelAnimationFrame;
		}, 
		usePolyfill : function(){
			var root;

			if (typeof self == "object" && self.self == self){
				root = self;
			} else if (typeof window == "object" && window.window == window){
				root = window;
			} else if (typeof global == "object" && global.global == global){
				root = global;
			}

			var lastTime = 0;

			this.stop();
			root.requestAnimationFrame = function( callback ) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max( 0, this.polyfillFrameTime - ( currTime - lastTime ) );
				var id = root.setTimeout( function() {
					callback( currTime + timeToCall );
				}, timeToCall );
				lastTime = currTime + timeToCall;
				return id;
			}.bind(this);

			root.cancelAnimationFrame = function( id ) {
				root.clearTimeout( id );
			}.bind(this);

			this.start();
		},
		getRandString : function(){
			return ((Math.random().toString(32).substring(3, 10)) + (Math.random().toString(32).substring(3, 10)));
		},
		addTask : function(callback, id){
			id = id || this.getRandString();
			this.tasks[id] = callback;
			return this.removeTask.bind(this, id);
		},
		removeTask : function(id){
			delete this.tasks[id];
		},
		polyfillFrameTime : 16,
		currentFrameTime : 16,
		tick : function(){
			this.loop.rafID = requestAnimationFrame(this.tick);
			
			var absDelta = this.loop.absDelta;
			var relDelta = absDelta / this.loop.frameTime;

			this.loop.frameTimeSum += absDelta
			this.loop.framesRendered++

			this.loop.prevFrameDate = (+new Date());
			this.currentFrameTime = absDelta;

			this.loopList(this.tasks, function(task){
				task(absDelta, relDelta);
			}, this);
		},
		benchmarkTick : function(){
			this.loop.rafID = requestAnimationFrame(this.benchmarkTick);
			
			this.loop.framesRendered++;

			var dateSeconds = Math.floor(+new Date() / 1000)

			if (this.loop.prevFpsDate !== dateSeconds){
				this.loop.prevFpsDate = dateSeconds
				this.loop.fpsTimeline.push(this.loop.framesRenderedLastSecond)
				this.loop.framesRenderedLastSecond = 0;
			} else {
				this.loop.framesRenderedLastSecond++
			}

			var absDelta = this.loop.absDelta;
			var relDelta = absDelta / this.loop.frameTime;

			this.loop.prevFrameDate = (+new Date());
			this.currentFrameTime = absDelta;

			this.loopList(this.tasks, function(task){
				task(absDelta, relDelta);
			}, this);
		},
		loopList : function(list, cb, context){
			for (var k in list){
				cb.call(context, list[k], k, list);
			}
		},
		startBenchmark (duration, onComplete) {
			this.stop()
			this.loop.onBenchmarkComplete = onComplete
			this.loop.framesRendered = 0;
			this.loop.framesRenderedLastSecond = 0
			this.loop.fpsTimeline.length = 0;
			this.loop.benchmarkMode = true;
			this.loop.framesRenderedLastSecond = 0
			this.loop.prevFpsDate = Math.floor(+new Date() / 1000)
			this.start()
			setTimeout(function(){
				this.stopBenchmark()
			}.bind(this), duration)
		},
		stopBenchmark () {
			this.stop();
			this.loop.benchmarkMode = false;
			let averageFPS = 0;

			for (var a = 0, l = this.loop.fpsTimeline.length; a < l; a++){
				averageFPS += this.loop.fpsTimeline[a]
			}

			averageFPS /= this.loop.fpsTimeline.length
			averageFPS = Math.ceil(averageFPS)

			let results = {
				averageFPS: averageFPS,
				fpsTimeline: this.loop.fpsTimeline.slice(),
				framesRendered: this.loop.framesRendered
			}

			if (this.loop.onBenchmarkComplete){
				this.loop.onBenchmarkComplete(results)
			}
			
			window.unicycleBenchmarkResults = results
			this.start()
		},
		start : function(){
			if (this.started){
				return;
			}

			this.loop.prevFrameDate = +new Date();
			this.started = true;

			if (this.loop.benchmarkMode){
				this.benchmarkTick();
			} else {
				this.tick();
			}
		},
		stop : function(){
			cancelAnimationFrame(this.loop.rafID);
			this.started = false;
		}
	};

	unicycle = new Unicycle();
	return Unicycle;
    
}));