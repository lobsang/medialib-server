/**
 * Contains functions which might as well be extensions of Function prototype (but aren't for safety reasons).
 * 
 * @name objects
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
   
   var unknown = defaultName ? defaultName : '<anonymous function>';
   return functionNameMatcher.test( fn.toString() ) ? RegExp.$1 || unknown : unknown;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @example
 * function greet() {
 *    this.log( arguments );
 * }   
 * 
 * partial( greet, 'Hello' ).bindThis( console )( 'World' )
 */
function partial( fn ) {
   var args = Array.prototype.slice.call( arguments, 1 );
   
   var scope = { bound: null };
   var myFun = function() {
     return fn.apply( scope.bound, Array.prototype.concat.apply( args, arguments ) );
   };
   
   myFun.bindThis = function( object ) {
      scope.bound = object;
      return myFun;
   };
   
   return myFun;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.functionName = functionName;
exports.partial = partial;
