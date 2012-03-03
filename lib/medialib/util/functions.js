/**
 * Contains functions which might as well be extensions of Function prototype (but aren't for safety reasons).
 * 
 * @name util.functions
 * @namespace
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////

var functionNameMatcher = /function\s*([\w\-$]+)?\s*\(/i;
/**
 * Returns the name of a named function. If the name cannot be determined, the given default name is returned
 * instead (or "<anonymous function>" if no default name has been specified).
 *
 * @param {!function} the function for which to determine the name
 * @return {string} the name of the function or the given default name or "<anonymous function>"
 */
function functionName( fn, defaultName ) {
   if( fn.name ) {
      return fn.name;
   }
   
   var unknown = defaultName || '<anonymous function>';
   return functionNameMatcher.test( fn.toString() ) ? RegExp.$1 || unknown : unknown;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @example
 * function greet() {
 *    this.log( arguments );
 * }   
 * 
 * partial( greet, 'Hello' ).bind( console )( 'World' )
 */
function partial( fn ) {
   var args = Array.prototype.slice.call( arguments, 1 );
   
   return function() {
      return fn.apply( null, Array.prototype.concat.apply( args, arguments ) );
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function noop() {
   return noop;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Always returns a function which can be safely invoked. Returns the given parameter if its a function, or
 * noop otherwise.
 *
 * @example
 * Function.guard( null )(); // noop
 * Function.guard( function() { return 'success' } )(); // 'success'
 */
function guard( functionCandidate ) {
   return typeof( functionCandidate ) === "function" ? functionCandidate : noop;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Safely calls an optional callback function. Invokes the given function with the given args. Does nothing
 * if the function candidate is not a function.
 */
function callback( functionCandidate /*, args */ ) {
   var args = Array.prototype.slice.call( arguments, 1 );
   return guard( functionCandidate ).apply( null, args );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.functionName = functionName;
exports.partial = partial;
exports.noop = noop;
exports.guard = guard;
exports.callback = callback;

