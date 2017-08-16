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
	};

	Unicycle.prototype = {

	};

	unicycle = new Unicycle();
	return Unicycle;
    
}));