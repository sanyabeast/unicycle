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
			get absDelta(){
				return +new Date() - this.prevFrameDate;
			},
			get relDelta(){
				return this.absDelta / this.frameTime;
			}
		};

		this.tick = this.tick.bind(this);

	};

	Unicycle.prototype = {
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
					var timeToCall = Math.max( 0, 32 - ( currTime - lastTime ) );
					var id = root.setTimeout( function() {
						callback( currTime + timeToCall );
					}, timeToCall );
					lastTime = currTime + timeToCall;
					return id;
				};

				cancelAnimationFrame = function( id ) {
					root.clearTimeout( id );
				};
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
				var timeToCall = Math.max( 0, 32 - ( currTime - lastTime ) );
				var id = root.setTimeout( function() {
					callback( currTime + timeToCall );
				}, timeToCall );
				lastTime = currTime + timeToCall;
				return id;
			};

			root.cancelAnimationFrame = function( id ) {
				root.clearTimeout( id );
			};

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
		tick : function(){
			this.loop.rafID = requestAnimationFrame(this.tick);
			
			var absDelta = this.loop.absDelta;
			var relDelta = this.loop.relDelta;

			this.loop.prevFrameDate = (+new Date());

			for (var k in this.tasks){
				this.tasks[k](absDelta, relDelta);
			}		

		},
		start : function(){
			if (this.started){
				return;
			}

			this.loop.prevFrameDate = +new Date();
			this.started = true;

			this.tick();
		},
		stop : function(){
			cancelAnimationFrame(this.loop.rafID);
			this.started = false;
		}
	};

	unicycle = new Unicycle();
	return Unicycle;
    
}));